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
 * * DATE: 20/10/2026 20:57
 * * OBJECTIVE: Tirar os espaços das pontas do nome e do telefone e tratar data de nascimento vazia como não informada.
 */
function normalizarPaciente(ADados) {
  return {
    nome: ADados.nome.trim(),
    telefone: ADados.telefone.trim(),
    data_nascimento: ADados.data_nascimento || null
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Cadastrar um paciente com os dados normalizados e devolver o registro criado.
 */
async function cadastrarPaciente(ADados) {
  return repository.cadastrarPaciente(normalizarPaciente(ADados));
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 16:51
 * * OBJECTIVE: Alterar os dados de um paciente, já normalizados, e devolver o registro alterado.
 */
async function alterarPaciente(AId, ADados) {
  return repository.alterarPaciente(AId, normalizarPaciente(ADados));
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
