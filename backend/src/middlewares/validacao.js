const ErroApi = require('../errors/ErroApi');

const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 14:41
 * * OBJECTIVE: Barrar a requisição quando o id da rota não está no formato UUID.
 */
function validarId(req, res, next) {
  if (!FORMATO_UUID.test(req.params.id)) {
    throw new ErroApi(400, 'o id informado é inválido');
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 16:51
 * * OBJECTIVE: Informar se o texto é uma data existente no formato AAAA-MM-DD.
 */
function dataValida(AData) {
  if (!FORMATO_DATA.test(AData)) {
    return false;
  }
  const LData = new Date(`${AData}T00:00:00Z`);
  return (
    !Number.isNaN(LData.getTime()) && LData.toISOString().startsWith(AData)
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 16:51
 * * OBJECTIVE: Barrar a requisição quando os dados do paciente estão incompletos ou inválidos.
 */
function validarPaciente(req, res, next) {
  const LDados = req.body || {};
  if (!LDados.nome || !LDados.telefone) {
    throw new ErroApi(400, 'campos obrigatórios faltando');
  }
  if (LDados.data_nascimento && !dataValida(LDados.data_nascimento)) {
    throw new ErroApi(
      400,
      'a data de nascimento é inválida, use o formato AAAA-MM-DD'
    );
  }
  return next();
}

module.exports = {
  validarId,
  validarPaciente
};
