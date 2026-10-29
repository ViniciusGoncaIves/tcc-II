const db = require('../configs');
const repository = require('../repositories/alertas');
const receitasRepository = require('../repositories/receitas');

const LIMITE_ALERTAS_POR_RODADA = 50;
const MILISSEGUNDOS_POR_HORA = 3600000;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:29
 * * OBJECTIVE: Montar o texto da mensagem do alerta: a dose 1 pede confirmação e, nos reenvios, avisa qual é o envio; as demais doses só lembram o horário.
 */
function montarMensagem(AAlerta) {
  const LPrimeiroNome = AAlerta.nome_paciente.split(' ')[0];
  const LMedicamento = `${AAlerta.nome_medicamento} ${AAlerta.dose}`;
  if (!AAlerta.requer_confirmacao) {
    return `Olá, ${LPrimeiroNome}! Está na hora do seu medicamento ${LMedicamento} (dose ${AAlerta.numero_dose} de ${AAlerta.quantidade_alerta}).`;
  }
  const LEnvio = AAlerta.tentativas + 1;
  const LLembrete =
    LEnvio > 1
      ? `Lembrete (envio ${LEnvio} de ${AAlerta.limite_tentativas}): `
      : '';
  const LHoras = AAlerta.intervalo_horas === 1 ? 'hora' : 'horas';
  return `${LLembrete}Olá, ${LPrimeiroNome}! Está na hora da primeira dose do seu medicamento ${LMedicamento}, que deve ser tomado de ${AAlerta.intervalo_horas} em ${AAlerta.intervalo_horas} ${LHoras}. Por favor, confirme quando tomar.`;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:31
 * * OBJECTIVE: Reservar, em uma única transação, os alertas que precisam sair agora, marcando-os como enviados antes do envio, para que nenhuma outra rodada envie o mesmo alerta.
 */
async function reservarAlertasParaEnvio() {
  return db.transacao(async (AConexao) => {
    const LAlertas = await repository.buscarAlertasParaEnvio(
      AConexao,
      LIMITE_ALERTAS_POR_RODADA
    );
    if (LAlertas.length > 0) {
      await repository.marcarAlertasEnviados(
        AConexao,
        LAlertas.map((AAlerta) => AAlerta.idalerta)
      );
    }
    return LAlertas;
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:32
 * * OBJECTIVE: Enviar os alertas reservados, escrevendo a mensagem de cada um no console. Devolve quantos foram enviados.
 */
async function enviarAlertasVencidos() {
  const LAlertas = await reservarAlertasParaEnvio();
  for (const LAlerta of LAlertas) {
    console.log(
      `agendador: mensagem para ${LAlerta.telefone}: ${montarMensagem(LAlerta)}`
    );
  }
  return LAlertas.length;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:34
 * * OBJECTIVE: Encerrar, dentro da transação recebida, a receita que não tem mais item ativo: concluída se algum item foi concluído, ou cancelada pelo sistema (sem usuário) se todos foram cancelados.
 */
async function encerrarReceitaSemItensAtivos(AConexao, AIdReceita) {
  const LResumo = await receitasRepository.resumirItensReceita(
    AConexao,
    AIdReceita
  );
  if (LResumo.itens_ativos > 0) {
    return;
  }
  if (LResumo.itens_concluidos > 0) {
    await receitasRepository.concluirReceita(AConexao, AIdReceita);
  } else {
    await receitasRepository.cancelarReceita(AConexao, AIdReceita, null);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:36
 * * OBJECTIVE: Expirar, em uma única transação, as doses 1 que esgotaram os envios sem confirmação, cancelando os itens delas e encerrando as receitas que ficarem sem item ativo. Devolve quantos alertas expiraram.
 */
async function expirarAlertas() {
  return db.transacao(async (AConexao) => {
    const LIdsItens = await repository.expirarAlertasSemConfirmacao(AConexao);
    if (LIdsItens.length === 0) {
      return 0;
    }
    const LIdsReceitas = await receitasRepository.cancelarItensExpirados(
      AConexao,
      LIdsItens
    );
    for (const LIdReceita of new Set(LIdsReceitas)) {
      await encerrarReceitaSemItensAtivos(AConexao, LIdReceita);
    }
    return LIdsItens.length;
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:40
 * * OBJECTIVE: Confirmar a dose 1 votada pelo paciente em uma única transação: marca a confirmação, inicia o item e cria as doses seguintes a partir dela (ou conclui o item de dose única). Devolve a situação (CONFIRMADA, JA_CONFIRMADA ou INDISPONIVEL) com os dados para a resposta ao paciente.
 */
async function confirmarPrimeiraDose(AIdAlerta) {
  return db.transacao(async (AConexao) => {
    const LAlerta = await repository.buscarPrimeiraDoseParaConfirmacao(
      AConexao,
      AIdAlerta
    );
    if (!LAlerta || !['ENVIADO', 'CONFIRMADO'].includes(LAlerta.status)) {
      return { situacao: 'INDISPONIVEL' };
    }
    const LDados = {
      nome_paciente: LAlerta.nome_paciente,
      nome_medicamento: LAlerta.nome_medicamento,
      dose: LAlerta.dose
    };
    if (LAlerta.status === 'CONFIRMADO') {
      return {
        situacao: 'JA_CONFIRMADA',
        ...LDados,
        horario_confirmacao: LAlerta.horario_confirmacao
      };
    }
    const LHorarioConfirmacao = await repository.confirmarAlerta(
      AConexao,
      AIdAlerta
    );
    const LItem = await receitasRepository.iniciarItemReceita(
      AConexao,
      LAlerta.iditensreceita,
      LHorarioConfirmacao
    );
    if (!LItem) {
      throw new Error('o item da dose 1 não está aguardando confirmação');
    }
    let LProximaDose = null;
    if (LItem.status === 'CONCLUIDO') {
      await encerrarReceitaSemItensAtivos(AConexao, LItem.idreceita);
    } else {
      await repository.cadastrarDosesSeguintes(
        AConexao,
        LAlerta.iditensreceita,
        LHorarioConfirmacao
      );
      LProximaDose = new Date(
        LHorarioConfirmacao.getTime() +
          LAlerta.intervalo_horas * MILISSEGUNDOS_POR_HORA
      );
    }
    return {
      situacao: 'CONFIRMADA',
      ...LDados,
      horario_confirmacao: LHorarioConfirmacao,
      proxima_dose: LProximaDose
    };
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:41
 * * OBJECTIVE: Expirar as doses 2 em diante com mais de 30 minutos de atraso, antes do envio. Devolve quantas expiraram.
 */
async function expirarDosesAtrasadas() {
  return repository.expirarDosesSeguintesAtrasadas();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:42
 * * OBJECTIVE: Concluir, em uma única transação, os itens em andamento sem dose agendada e encerrar as receitas que ficarem sem item ativo. Devolve quantos itens foram concluídos.
 */
async function concluirItensFinalizados() {
  return db.transacao(async (AConexao) => {
    const LIdsReceitas =
      await receitasRepository.concluirItensSemDosesPendentes(AConexao);
    for (const LIdReceita of new Set(LIdsReceitas)) {
      await encerrarReceitaSemItensAtivos(AConexao, LIdReceita);
    }
    return LIdsReceitas.length;
  });
}

module.exports = {
  enviarAlertasVencidos,
  expirarAlertas,
  confirmarPrimeiraDose,
  expirarDosesAtrasadas,
  concluirItensFinalizados
};
