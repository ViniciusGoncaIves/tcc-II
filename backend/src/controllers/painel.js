const service = require('../services/painel');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 30/10/2026 22:50
 * * OBJECTIVE: Devolver o painel da tela inicial.
 */
async function buscarPainel(req, res) {
  return res.status(200).json(await service.buscarPainel());
}

module.exports = {
  buscarPainel
};
