const whatsapp = require('../integrations/whatsapp');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:11
 * * OBJECTIVE: Buscar a situação da conexão com o WhatsApp do sistema.
 */
async function consultarSituacao() {
  return whatsapp.consultarSituacao();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:12
 * * OBJECTIVE: Desconectar o número atual para conectar outro celular; no modo simulado não há o que desconectar (409).
 */
async function desconectar() {
  if (whatsapp.MODO_SIMULADO) {
    throw new ErroApi(409, 'o WhatsApp está em modo simulado');
  }
  await whatsapp.desconectar();
  return whatsapp.consultarSituacao();
}

module.exports = {
  consultarSituacao,
  desconectar
};
