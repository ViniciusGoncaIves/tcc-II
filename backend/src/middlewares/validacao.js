const ErroApi = require('../errors/ErroApi');

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 14:41
 * * OBJECTIVE: Barrar a requisição quando o id da rota não está no formato UUID.
 */
function validarId (req, res, next) {
  if (!FORMATO_UUID.test(req.params.id)) {
    throw new ErroApi(400, 'o id informado é inválido');
  }
  return next();
}

module.exports = {
  validarId
}
