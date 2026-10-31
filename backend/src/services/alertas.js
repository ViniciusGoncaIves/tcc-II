const db = require('../configs');
const tempo = require('../configs/tempo');
const repository = require('../repositories/alertas');
const receitasRepository = require('../repositories/receitas');
const enquetesRepository = require('../repositories/enquetes');
const whatsapp = require('../integrations/whatsapp');

const LIMITE_ALERTAS_POR_RODADA = 50;
// Intervalo entre uma mensagem e outra, para reduzir o risco de bloqueio do número.
const PAUSA_ENTRE_ENVIOS_MS = 1500;
const OPCOES_PRIMEIRA_DOSE = [
  'Sim, tomei',
  'Ainda não',
  'Parar de receber alertas'
];

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:29
 * * OBJECTIVE: Montar o texto do alerta: na dose 1, a pergunta da enquete de confirmação, que nos reenvios avisa qual é o envio; nas demais doses, só o lembrete do horário.
 */
function montarMensagem(AAlerta) {
  const LPrimeiroNome = AAlerta.nome_paciente.split(' ')[0];
  const LMedicamento = `${AAlerta.nome_medicamento} (${AAlerta.dose})`;
  if (!AAlerta.requer_confirmacao) {
    return `Olá, ${LPrimeiroNome}! Está na hora do seu medicamento ${LMedicamento}, dose ${AAlerta.numero_dose} de ${AAlerta.quantidade_alerta}.`;
  }
  const LEnvio = AAlerta.tentativas + 1;
  const LLembrete =
    LEnvio > 1
      ? `Lembrete (envio ${LEnvio} de ${AAlerta.limite_tentativas}): `
      : '';
  const LHoras = AAlerta.intervalo_horas === 1 ? 'hora' : 'horas';
  return `${LLembrete}Olá, ${LPrimeiroNome}! Está na hora da primeira dose de ${LMedicamento}, de ${AAlerta.intervalo_horas} em ${AAlerta.intervalo_horas} ${LHoras}. Você já tomou? Para parar os lembretes, escolha a última opção ou responda PARAR.`;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:59
 * * OBJECTIVE: Esperar o tempo informado, em milissegundos.
 */
function esperar(AMilissegundos) {
  return new Promise((AResolver) => setTimeout(AResolver, AMilissegundos));
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
 * * DATE: 29/10/2026 20:00
 * * OBJECTIVE: Enviar um alerta reservado: confere o telefone no WhatsApp e manda a enquete (dose 1) ou o lembrete (demais doses). Telefone sem WhatsApp conta como tentativa na dose 1 e expira as demais doses; se o envio falhar, o alerta volta à situação anterior. Devolve se a mensagem saiu.
 */
async function enviarAlerta(AAlerta) {
  // A receita pode ter sido cancelada, ou a dose 1 confirmada, depois da reserva.
  const LSituacao = await repository.buscarSituacaoAlerta(AAlerta.idalerta);
  if (LSituacao?.status !== 'ENVIADO') {
    return false;
  }
  try {
    const LNumero = await whatsapp.verificarNumero(AAlerta.telefone);
    if (!LNumero.existe) {
      console.log(
        `agendador: o telefone do paciente não tem WhatsApp (alerta ${AAlerta.idalerta})`
      );
      if (!AAlerta.requer_confirmacao) {
        await repository.expirarAlertaSemWhatsApp(AAlerta.idalerta);
      }
      return false;
    }
    if (AAlerta.requer_confirmacao) {
      const LEnquete = await whatsapp.enviarEnquete(
        LNumero.destino,
        montarMensagem(AAlerta),
        OPCOES_PRIMEIRA_DOSE
      );
      await enquetesRepository.cadastrarEnquete({
        id_mensagem: LEnquete.idMensagem,
        tipo: 'CONFIRMACAO_DOSE',
        idpaciente: AAlerta.idpaciente,
        idalerta: AAlerta.idalerta,
        destino: LNumero.destino,
        conteudo: LEnquete.conteudo
      });
    } else {
      await whatsapp.enviarTexto(LNumero.destino, montarMensagem(AAlerta));
    }
    return true;
  } catch (LErro) {
    await repository.devolverAlerta(AAlerta);
    console.error(
      `agendador: erro ao enviar o alerta ${AAlerta.idalerta}: ${LErro.message}`
    );
    return false;
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:32
 * * OBJECTIVE: Enviar os alertas que venceram, com uma pausa entre as mensagens. Com o WhatsApp do sistema desconectado, nada é reservado: os alertas esperam e nenhuma tentativa conta. Devolve quantos foram enviados.
 */
async function enviarAlertasVencidos() {
  if (!whatsapp.estaConectado()) {
    return 0;
  }
  const LAlertas = await reservarAlertasParaEnvio();
  let LEnviados = 0;
  for (const [LIndice, LAlerta] of LAlertas.entries()) {
    if (LIndice > 0 && !whatsapp.MODO_SIMULADO) {
      await esperar(PAUSA_ENTRE_ENVIOS_MS);
    }
    if (await enviarAlerta(LAlerta)) {
      LEnviados++;
    }
  }
  return LEnviados;
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
    await receitasRepository.cancelarReceita(
      AConexao,
      AIdReceita,
      null,
      'PRIMEIRA_DOSE_NAO_CONFIRMADA'
    );
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
          LAlerta.intervalo_horas * tempo.MILISSEGUNDOS_POR_HORA
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
  OPCOES_PRIMEIRA_DOSE,
  encerrarReceitaSemItensAtivos,
  enviarAlertasVencidos,
  expirarAlertas,
  confirmarPrimeiraDose,
  expirarDosesAtrasadas,
  concluirItensFinalizados
};
