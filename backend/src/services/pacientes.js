const repository = require('../repositories/pacientes');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Buscar todos os pacientes em ordem alfabética.
 */
async function buscarPacientes() {
  return repository.buscarPacientes();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Buscar um paciente pelo id.
 */
async function buscarPacientePorId(AId) {
  return repository.buscarPacientePorId(AId);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Cadastrar um paciente e devolver o registro criado.
 */
async function cadastrarPaciente(ADados) {
  return repository.cadastrarPaciente(ADados);
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente
};
