const repository = require('../repositories/pacientes');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Buscar os pacientes em ordem alfabética, filtrando pela situação quando ela for informada.
 */
async function buscarPacientes(AAtivo) {
  return repository.buscarPacientes(AAtivo);
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

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 16:51
 * * OBJECTIVE: Alterar os dados de um paciente e devolver o registro alterado.
 */
async function alterarPaciente(AId, ADados) {
  return repository.alterarPaciente(AId, ADados);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 19:31
 * * OBJECTIVE: Mudar a situação do paciente, recusando quando ele já está na situação pedida.
 */
async function alterarSituacao(AId, AAtivo) {
  const LPaciente = await repository.buscarPacientePorId(AId);
  if (!LPaciente) {
    return undefined;
  }
  if (LPaciente.ativo === AAtivo) {
    throw new ErroApi(
      409,
      `o paciente já está ${AAtivo ? 'ativo' : 'inativo'}`
    );
  }
  return repository.alterarSituacaoPaciente(AId, AAtivo);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 19:31
 * * OBJECTIVE: Inativar um paciente sem apagar o registro.
 */
async function inativarPaciente(AId) {
  return alterarSituacao(AId, false);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 19:31
 * * OBJECTIVE: Reativar um paciente inativado.
 */
async function reativarPaciente(AId) {
  return alterarSituacao(AId, true);
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente,
  alterarPaciente,
  inativarPaciente,
  reativarPaciente
};
