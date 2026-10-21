const repository = require('../repositories/usuarios');
const { gerarHashSenha } = require('./autenticacao');
const ErroApi = require('../errors/ErroApi');

const TIPO_ADMINISTRADOR = 'ADMIN';
const TIPO_OPERADOR = 'OPERADOR';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Tirar os espaços das pontas do nome e do e-mail e deixar o e-mail em minúsculas.
 */
function normalizarUsuario(ADados) {
  return {
    nome: ADados.nome.trim(),
    email: ADados.email.trim().toLowerCase(),
    tipo_usuario: ADados.tipo_usuario || null
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Recusar a operação quando ela deixaria o sistema sem nenhum administrador ativo.
 */
async function garantirOutroAdministrador(AUsuario) {
  if (AUsuario.tipo_usuario !== TIPO_ADMINISTRADOR || !AUsuario.ativo) {
    return;
  }
  if ((await repository.contarAdministradoresAtivos()) <= 1) {
    throw new ErroApi(
      409,
      'o sistema precisa de pelo menos um administrador ativo'
    );
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Buscar os usuários em ordem alfabética, filtrando pela situação quando ela for informada.
 */
async function buscarUsuarios(AAtivo) {
  return repository.buscarUsuarios(AAtivo);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Buscar um usuário pelo id.
 */
async function buscarUsuarioPorId(AId) {
  return repository.buscarUsuarioPorId(AId);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Cadastrar um usuário com senha provisória, que deverá ser trocada no primeiro login.
 */
async function cadastrarUsuario(ADados) {
  const LUsuario = normalizarUsuario(ADados);
  return repository.cadastrarUsuario({
    ...LUsuario,
    tipo_usuario: LUsuario.tipo_usuario || TIPO_OPERADOR,
    senha: await gerarHashSenha(ADados.senha)
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Alterar um usuário, sem permitir que o último administrador ativo deixe de ser administrador.
 */
async function alterarUsuario(AId, ADados) {
  const LAtual = await repository.buscarUsuarioPorId(AId);
  if (!LAtual) {
    return undefined;
  }
  const LUsuario = normalizarUsuario(ADados);
  if (LUsuario.tipo_usuario === TIPO_OPERADOR) {
    await garantirOutroAdministrador(LAtual);
  }
  const LSenha = ADados.senha ? await gerarHashSenha(ADados.senha) : null;
  return repository.alterarUsuario(AId, { ...LUsuario, senha: LSenha });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Inativar um usuário, sem permitir inativar a si mesmo nem o último administrador ativo.
 */
async function inativarUsuario(AId, AIdUsuarioLogado) {
  if (AId.toLowerCase() === AIdUsuarioLogado.toLowerCase()) {
    throw new ErroApi(409, 'não é possível inativar o próprio usuário');
  }
  const LAtual = await repository.buscarUsuarioPorId(AId);
  if (!LAtual) {
    return undefined;
  }
  if (!LAtual.ativo) {
    throw new ErroApi(409, 'o usuário já está inativo');
  }
  await garantirOutroAdministrador(LAtual);
  return repository.alterarSituacaoUsuario(AId, false);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Reativar um usuário inativado.
 */
async function reativarUsuario(AId) {
  const LAtual = await repository.buscarUsuarioPorId(AId);
  if (!LAtual) {
    return undefined;
  }
  if (LAtual.ativo) {
    throw new ErroApi(409, 'o usuário já está ativo');
  }
  return repository.alterarSituacaoUsuario(AId, true);
}

module.exports = {
  buscarUsuarios,
  buscarUsuarioPorId,
  cadastrarUsuario,
  alterarUsuario,
  inativarUsuario,
  reativarUsuario
};
