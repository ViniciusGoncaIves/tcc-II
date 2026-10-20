const service = require('../services/medicamentos');

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
  cadastrarMedicamento
};
