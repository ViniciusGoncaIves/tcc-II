const db = require('../configs');
const repository = require('../repositories/alertas');
const receitasRepository = require('../repositories/receitas');

const LIMITE_ALERTAS_POR_RODADA = 50;

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
 * * OBJECTIVE: Enviar os alertas reservados; até a integração com o WhatsApp, a mensagem de cada alerta é escrita no console. Devolve quantos foram enviados.
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

module.exports = {
  enviarAlertasVencidos,
  expirarAlertas
};
