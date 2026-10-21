const repository = require('../repositories/medicamentos');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:24
 * * OBJECTIVE: Buscar os medicamentos em ordem alfabética, filtrando pela situação quando ela for informada.
 */
async function buscarMedicamentos(AAtivo) {
  return repository.buscarMedicamentos(AAtivo);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:24
 * * OBJECTIVE: Buscar um medicamento pelo id.
 */
async function buscarMedicamentoPorId(AId) {
  return repository.buscarMedicamentoPorId(AId);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 20:49
 * * OBJECTIVE: Cadastrar um medicamento sem espaços sobrando no nome e devolver o registro criado.
 */
async function cadastrarMedicamento(ADados) {
  return repository.cadastrarMedicamento({
    nome: ADados.nome.trim(),
    descricao: ADados.descricao
  });
}

module.exports = {
  buscarMedicamentos,
  buscarMedicamentoPorId,
  cadastrarMedicamento
};
