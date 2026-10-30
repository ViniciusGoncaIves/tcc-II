const db = require('../configs');
const repository = require('../repositories/pacientes');
const receitasRepository = require('../repositories/receitas');
const alertasRepository = require('../repositories/alertas');
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
 * * OBJECTIVE: Inativar um paciente sem apagar o registro, recusando quando ele tem receita ativa.
 */
async function inativarPaciente(AId) {
  if ((await receitasRepository.contarReceitasAtivasPorPaciente(AId)) > 0) {
    throw new ErroApi(
      409,
      'o paciente possui receita ativa e não pode ser inativado'
    );
  }
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

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:02
 * * OBJECTIVE: Atender ao pedido do paciente para não receber mais alertas, em uma única transação: cancela todas as receitas ativas dele (com os itens e os alertas que ainda iam sair) e o inativa com esse motivo, para nenhuma receita nova voltar a enviar mensagens sem ele autorizar. Devolve quantas receitas foram canceladas.
 */
async function pararAlertasDoPaciente(AIdPaciente) {
  return db.transacao(async (AConexao) => {
    const LIdsReceitas =
      await receitasRepository.buscarIdsReceitasAtivasPorPaciente(
        AConexao,
        AIdPaciente
      );
    for (const LIdReceita of LIdsReceitas) {
      await receitasRepository.cancelarReceita(
        AConexao,
        LIdReceita,
        null,
        'PEDIDO_DO_PACIENTE'
      );
      await receitasRepository.cancelarItensReceita(AConexao, LIdReceita);
      await alertasRepository.cancelarAlertasReceita(AConexao, LIdReceita);
    }
    await repository.inativarPacientePorPedido(AConexao, AIdPaciente);
    return LIdsReceitas.length;
  });
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente,
  alterarPaciente,
  inativarPaciente,
  reativarPaciente,
  pararAlertasDoPaciente
};
