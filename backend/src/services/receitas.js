const db = require('../configs');
const repository = require('../repositories/receitas');
const alertasRepository = require('../repositories/alertas');
const pacientesRepository = require('../repositories/pacientes');
const medicamentosRepository = require('../repositories/medicamentos');
const agendador = require('../jobs/alertas');
const whatsapp = require('../integrations/whatsapp');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Tirar os espaços das pontas da observação e das doses e tratar observação vazia como não informada.
 */
function normalizarReceita(ADados) {
  return {
    idpaciente: ADados.idpaciente,
    observacao: (ADados.observacao || '').trim() || null,
    itens: ADados.itens.map((AItem) => ({
      idmedicamento: AItem.idmedicamento,
      dose: AItem.dose.trim(),
      intervalo_horas: AItem.intervalo_horas,
      duracao_dias: AItem.duracao_dias
    }))
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Garantir que o paciente da receita existe (404) e está ativo (409, com a mensagem própria quando ele pediu para não receber alertas); devolve o paciente.
 */
async function conferirPaciente(AIdPaciente) {
  const LPaciente = await pacientesRepository.buscarPacientePorId(AIdPaciente);
  if (!LPaciente) {
    throw new ErroApi(
      404,
      `O paciente com id ${AIdPaciente} não foi encontrado`
    );
  }
  if (!LPaciente.ativo) {
    throw new ErroApi(
      409,
      LPaciente.motivo_inativacao === 'PEDIDO_DO_PACIENTE'
        ? 'o paciente pediu para não receber alertas'
        : 'o paciente está inativo'
    );
  }
  return LPaciente;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:01
 * * OBJECTIVE: Recusar a emissão quando o telefone do paciente não tem WhatsApp (400). Só é possível conferir com o WhatsApp do sistema conectado; desconectado, ou se a consulta falhar, a receita segue e a conferência fica para o envio.
 */
async function conferirWhatsApp(ATelefone) {
  if (!whatsapp.estaConectado()) {
    return;
  }
  let LNumero;
  try {
    LNumero = await whatsapp.verificarNumero(ATelefone);
  } catch {
    return;
  }
  if (!LNumero.existe) {
    throw new ErroApi(400, 'o telefone do paciente não tem WhatsApp');
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Garantir que todos os medicamentos da receita existem (404) e estão ativos (409).
 */
async function conferirMedicamentos(AItens) {
  for (const LItem of AItens) {
    const LMedicamento = await medicamentosRepository.buscarMedicamentoPorId(
      LItem.idmedicamento
    );
    if (!LMedicamento) {
      throw new ErroApi(
        404,
        `O medicamento com id ${LItem.idmedicamento} não foi encontrado`
      );
    }
    if (!LMedicamento.ativo) {
      throw new ErroApi(409, `o medicamento ${LMedicamento.nome} está inativo`);
    }
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Emitir a receita em uma única transação: grava a receita, os itens e o alerta da dose 1 de cada item, ou nada em caso de erro; em seguida, aciona o agendador para a dose 1 sair na hora.
 */
async function emitirReceita(ADados, AIdUsuario) {
  const LDados = normalizarReceita(ADados);
  const LPaciente = await conferirPaciente(LDados.idpaciente);
  await conferirMedicamentos(LDados.itens);
  await conferirWhatsApp(LPaciente.telefone);
  const LReceitaEmitida = await db.transacao(async (AConexao) => {
    const LReceita = await repository.cadastrarReceita(
      AConexao,
      LDados,
      AIdUsuario
    );
    LReceita.itens = [];
    for (const LItem of LDados.itens) {
      const LItemReceita = await repository.cadastrarItemReceita(
        AConexao,
        LReceita.idreceita,
        LItem
      );
      await alertasRepository.cadastrarAlertaPrimeiraDose(
        AConexao,
        LItemReceita.iditensreceita
      );
      LReceita.itens.push(LItemReceita);
    }
    return LReceita;
  });
  // A dose 1 sai logo após a emissão, sem esperar a próxima rodada do agendador.
  agendador.executarRodada();
  return LReceitaEmitida;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:25
 * * OBJECTIVE: Buscar as receitas, filtrando pela situação e pelo paciente quando forem informados.
 */
async function buscarReceitas(AFiltros) {
  return repository.buscarReceitas(AFiltros);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:27
 * * OBJECTIVE: Buscar uma receita com os itens e o resumo das doses de cada item.
 */
async function buscarReceitaPorId(AId) {
  const LReceita = await repository.buscarReceitaPorId(AId);
  if (!LReceita) {
    return undefined;
  }
  LReceita.itens = await repository.buscarItensReceita(AId);
  return LReceita;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:28
 * * OBJECTIVE: Cancelar uma receita ativa em uma única transação: a receita, os itens que não terminaram e os alertas ainda não enviados, registrando quem cancelou.
 */
async function cancelarReceita(AId, AIdUsuario) {
  const LReceita = await repository.buscarReceitaPorId(AId);
  if (!LReceita) {
    return undefined;
  }
  if (LReceita.status !== 'ATIVA') {
    throw new ErroApi(
      409,
      `a receita já está ${LReceita.status === 'CANCELADA' ? 'cancelada' : 'concluída'}`
    );
  }
  await db.transacao(async (AConexao) => {
    const LAlteradas = await repository.cancelarReceita(
      AConexao,
      AId,
      AIdUsuario,
      'USUARIO'
    );
    if (LAlteradas === 0) {
      throw new ErroApi(409, 'a receita não está mais ativa');
    }
    await repository.cancelarItensReceita(AConexao, AId);
    await alertasRepository.cancelarAlertasReceita(AConexao, AId);
  });
  return buscarReceitaPorId(AId);
}

module.exports = {
  emitirReceita,
  buscarReceitas,
  buscarReceitaPorId,
  cancelarReceita
};
