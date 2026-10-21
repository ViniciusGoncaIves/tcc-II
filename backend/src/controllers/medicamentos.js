const service = require('../services/medicamentos');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:24
 * * OBJECTIVE: Devolver a lista de medicamentos, filtrada pela situação quando o parâmetro ativo for enviado.
 */
async function buscarMedicamentos(req, res) {
  const LAtivo =
    req.query.ativo === undefined ? null : req.query.ativo === 'true';
  const LMedicamentos = await service.buscarMedicamentos(LAtivo);
  return res.status(200).json(LMedicamentos);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:24
 * * OBJECTIVE: Devolver o medicamento do id informado ou 404 quando ele não existe.
 */
async function buscarMedicamentoPorId(req, res) {
  const LMedicamento = await service.buscarMedicamentoPorId(req.params.id);
  if (!LMedicamento) {
    throw new ErroApi(
      404,
      `O medicamento com id ${req.params.id} não foi encontrado`
    );
  }
  return res.status(200).json(LMedicamento);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 20:49
 * * OBJECTIVE: Cadastrar um novo medicamento e devolver o registro criado.
 */
async function cadastrarMedicamento(req, res) {
  const LMedicamento = await service.cadastrarMedicamento(req.body);
  return res.status(201).json(LMedicamento);
}

module.exports = {
  buscarMedicamentos,
  buscarMedicamentoPorId,
  cadastrarMedicamento
};
