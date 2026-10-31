const repository = require('../repositories/painel');
const whatsapp = require('../integrations/whatsapp');

const LIMITE_DOSES_AGUARDANDO = 10;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 30/10/2026 22:49
 * * OBJECTIVE: Montar o painel da tela inicial: os números do dia, se o WhatsApp está conectado e as doses que esperam confirmação há mais tempo.
 */
async function buscarPainel() {
  const [LResumo, LDoses] = await Promise.all([
    repository.buscarResumo(),
    repository.buscarDosesAguardando(LIMITE_DOSES_AGUARDANDO)
  ]);
  return {
    ...LResumo,
    whatsapp_conectado: whatsapp.estaConectado(),
    doses_aguardando: LDoses
  };
}

module.exports = {
  buscarPainel
};
