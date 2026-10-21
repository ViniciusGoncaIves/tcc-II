const repository = require('../repositories/medicamentos');
const ErroApi = require('../errors/ErroApi');

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
 * * DATE: 20/10/2026 21:36
 * * OBJECTIVE: Tirar os espaços das pontas do nome e tratar descrição vazia como não informada.
 */
function normalizarMedicamento(ADados) {
  return {
    nome: ADados.nome.trim(),
    descricao: ADados.descricao || null
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 20:49
 * * OBJECTIVE: Cadastrar um medicamento com os dados normalizados e devolver o registro criado.
 */
async function cadastrarMedicamento(ADados) {
  return repository.cadastrarMedicamento(normalizarMedicamento(ADados));
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:36
 * * OBJECTIVE: Alterar o nome e a descrição de um medicamento, já normalizados, e devolver o registro alterado.
 */
async function alterarMedicamento(AId, ADados) {
  return repository.alterarMedicamento(AId, normalizarMedicamento(ADados));
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:36
 * * OBJECTIVE: Mudar a situação do medicamento, recusando quando ele já está na situação pedida.
 */
async function alterarSituacao(AId, AAtivo) {
  const LMedicamento = await repository.buscarMedicamentoPorId(AId);
  if (!LMedicamento) {
    return undefined;
  }
  if (LMedicamento.ativo === AAtivo) {
    throw new ErroApi(
      409,
      `o medicamento já está ${AAtivo ? 'ativo' : 'inativo'}`
    );
  }
  return repository.alterarSituacaoMedicamento(AId, AAtivo);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:36
 * * OBJECTIVE: Inativar um medicamento sem apagar o registro.
 */
async function inativarMedicamento(AId) {
  return alterarSituacao(AId, false);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:36
 * * OBJECTIVE: Reativar um medicamento inativado.
 */
async function reativarMedicamento(AId) {
  return alterarSituacao(AId, true);
}

module.exports = {
  buscarMedicamentos,
  buscarMedicamentoPorId,
  cadastrarMedicamento,
  alterarMedicamento,
  inativarMedicamento,
  reativarMedicamento
};
