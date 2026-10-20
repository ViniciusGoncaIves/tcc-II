const repository = require('../repositories/medicamentos');

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
  cadastrarMedicamento
};
