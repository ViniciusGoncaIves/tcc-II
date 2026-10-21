const jwt = require('jsonwebtoken');
const repository = require('../repositories/usuarios');
const ErroApi = require('../errors/ErroApi');

const TIPO_ADMINISTRADOR = 'ADMIN';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Validar o token do cabeçalho Authorization e carregar em req.usuario os dados atuais do usuário.
 */
async function identificarUsuario(req) {
  const [LTipo, LToken] = (req.headers.authorization || '').split(' ');
  if (LTipo !== 'Bearer' || !LToken) {
    throw new ErroApi(401, 'token de acesso não informado');
  }
  let LConteudo;
  try {
    LConteudo = jwt.verify(LToken, process.env.JWT_SECRET);
  } catch {
    throw new ErroApi(401, 'token de acesso inválido ou expirado');
  }
  const LUsuario = await repository.buscarUsuarioPorId(LConteudo.idusuario);
  if (!LUsuario || !LUsuario.ativo) {
    throw new ErroApi(401, 'token de acesso inválido ou expirado');
  }
  req.usuario = LUsuario;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Exigir login, permitindo o acesso mesmo com senha provisória (usado só na troca de senha).
 */
async function autenticarParaTrocarSenha(req, res, next) {
  await identificarUsuario(req);
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Exigir login com senha definitiva; com senha provisória só a troca de senha é liberada.
 */
async function autenticar(req, res, next) {
  await identificarUsuario(req);
  if (req.usuario.trocar_senha) {
    throw new ErroApi(403, 'é necessário redefinir a senha antes de continuar');
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Barrar a requisição quando o usuário logado não é administrador.
 */
function exigirAdministrador(req, res, next) {
  if (req.usuario.tipo_usuario !== TIPO_ADMINISTRADOR) {
    throw new ErroApi(403, 'acesso permitido apenas para administradores');
  }
  return next();
}

module.exports = {
  autenticarParaTrocarSenha,
  autenticar,
  exigirAdministrador
};
