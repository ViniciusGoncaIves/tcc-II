const service = require('../services/whatsapp');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:13
 * * OBJECTIVE: Devolver a situação da conexão com o WhatsApp e, quando estiver esperando a leitura, o QR code.
 */
async function consultarSituacao(req, res) {
  return res.status(200).json(await service.consultarSituacao());
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:14
 * * OBJECTIVE: Desconectar o número atual e devolver a nova situação da conexão.
 */
async function desconectar(req, res) {
  return res.status(200).json(await service.desconectar());
}

module.exports = {
  consultarSituacao,
  desconectar
};
