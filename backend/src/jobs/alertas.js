const service = require('../services/alertas');

const SEGUNDOS_ENTRE_RODADAS = 60;

let LRodadaEmAndamento = false;
let LNovaRodadaPedida = false;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:37
 * * OBJECTIVE: Fazer uma verificação completa dos alertas: primeiro expira as doses 1 sem confirmação, depois envia o que venceu; o erro de uma etapa é registrado no console e não impede a outra.
 */
async function processarAlertas() {
  try {
    const LExpirados = await service.expirarAlertas();
    if (LExpirados > 0) {
      console.log(
        `agendador: ${LExpirados} alerta(s) expirado(s) sem confirmação`
      );
    }
  } catch (LErro) {
    console.error(`agendador: erro ao expirar alertas: ${LErro.message}`);
  }
  try {
    const LEnviados = await service.enviarAlertasVencidos();
    if (LEnviados > 0) {
      console.log(`agendador: ${LEnviados} alerta(s) enviado(s)`);
    }
  } catch (LErro) {
    console.error(`agendador: erro ao enviar alertas: ${LErro.message}`);
  }
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
