const service = require('../services/alertas');

const SEGUNDOS_ENTRE_RODADAS = 60;

let LRodadaEmAndamento = false;
let LNovaRodadaPedida = false;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:43
 * * OBJECTIVE: Executar uma etapa da rodada, escrevendo no console quantos registros ela tratou; o erro da etapa é registrado e não impede as seguintes.
 */
async function executarEtapa(AAcao, AEtapa, AMensagem) {
  try {
    const LQuantidade = await AAcao();
    if (LQuantidade > 0) {
      console.log(`agendador: ${LQuantidade} ${AMensagem}`);
    }
  } catch (LErro) {
    console.error(
      `agendador: erro ao ${AEtapa}: ${LErro.message || LErro.code}`
    );
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:37
 * * OBJECTIVE: Fazer uma verificação completa dos alertas: expira as doses 1 sem confirmação e as doses seguintes muito atrasadas, envia o que venceu e conclui os itens sem dose agendada.
 */
async function processarAlertas() {
  await executarEtapa(
    service.expirarAlertas,
    'expirar alertas',
    'alerta(s) expirado(s) sem confirmação'
  );
  await executarEtapa(
    service.expirarDosesAtrasadas,
    'expirar doses atrasadas',
    'dose(s) expirada(s) por atraso de mais de 30 minutos'
  );
  await executarEtapa(
    service.enviarAlertasVencidos,
    'enviar alertas',
    'alerta(s) enviado(s)'
  );
  await executarEtapa(
    service.concluirItensFinalizados,
    'concluir itens',
    'item(ns) de receita concluído(s)'
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:40
 * * OBJECTIVE: Executar uma rodada do agendador sem sobrepor outra: se já houver uma em andamento, a nova é feita logo que ela terminar.
 */
async function executarRodada() {
  if (LRodadaEmAndamento) {
    LNovaRodadaPedida = true;
    return;
  }
  LRodadaEmAndamento = true;
  try {
    do {
      LNovaRodadaPedida = false;
      await processarAlertas();
    } while (LNovaRodadaPedida);
  } finally {
    LRodadaEmAndamento = false;
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:42
 * * OBJECTIVE: Iniciar o agendador dos alertas, que roda uma vez na hora e depois a cada minuto.
 */
function iniciarAgendador() {
  setInterval(executarRodada, SEGUNDOS_ENTRE_RODADAS * 1000);
  console.log(
    `agendador de alertas rodando a cada ${SEGUNDOS_ENTRE_RODADAS} segundos`
  );
  executarRodada();
}

module.exports = {
  iniciarAgendador,
  executarRodada
};
