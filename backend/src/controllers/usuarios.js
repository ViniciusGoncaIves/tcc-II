const service = require('../services/usuarios');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Criar o erro 404 padrão para usuário não encontrado.
 */
function usuarioNaoEncontrado(AId) {
  return new ErroApi(404, `O usuário com id ${AId} não foi encontrado`);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Devolver a lista de usuários, filtrada pela situação quando o parâmetro ativo for enviado.
 */
async function buscarUsuarios(req, res) {
  const LAtivo =
    req.query.ativo === undefined ? null : req.query.ativo === 'true';
  const LUsuarios = await service.buscarUsuarios(LAtivo);
  return res.status(200).json(LUsuarios);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Devolver o usuário do id informado ou 404 quando ele não existe.
 */
async function buscarUsuarioPorId(req, res) {
  const LUsuario = await service.buscarUsuarioPorId(req.params.id);
  if (!LUsuario) {
    throw usuarioNaoEncontrado(req.params.id);
  }
  return res.status(200).json(LUsuario);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Cadastrar um novo usuário e devolver o registro criado.
 */
async function cadastrarUsuario(req, res) {
  const LUsuario = await service.cadastrarUsuario(req.body);
  return res.status(201).json(LUsuario);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Alterar o usuário do id informado ou devolver 404 quando ele não existe.
 */
async function alterarUsuario(req, res) {
  const LUsuario = await service.alterarUsuario(req.params.id, req.body);
  if (!LUsuario) {
    throw usuarioNaoEncontrado(req.params.id);
  }
  return res.status(200).json(LUsuario);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Inativar o usuário do id informado ou devolver 404 quando ele não existe.
 */
async function inativarUsuario(req, res) {
  const LUsuario = await service.inativarUsuario(
    req.params.id,
    req.usuario.idusuario
  );
  if (!LUsuario) {
    throw usuarioNaoEncontrado(req.params.id);
  }
  return res.status(200).json(LUsuario);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Reativar o usuário do id informado ou devolver 404 quando ele não existe.
 */
async function reativarUsuario(req, res) {
  const LUsuario = await service.reativarUsuario(req.params.id);
  if (!LUsuario) {
    throw usuarioNaoEncontrado(req.params.id);
  }
  return res.status(200).json(LUsuario);
}

module.exports = {
  buscarUsuarios,
  buscarUsuarioPorId,
  cadastrarUsuario,
  alterarUsuario,
  inativarUsuario,
  reativarUsuario
};
