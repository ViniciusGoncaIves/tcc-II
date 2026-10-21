const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/usuarios');
const ErroApi = require('../errors/ErroApi');

const CUSTO_HASH = 10;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Gerar o hash bcrypt de uma senha para ser gravado no banco.
 */
async function gerarHashSenha(ASenha) {
  return bcrypt.hash(ASenha, CUSTO_HASH);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Conferir e-mail e senha e devolver o token de acesso com os dados do usuário.
 */
async function entrar(AEmail, ASenha) {
  const LUsuario = await repository.buscarUsuarioComSenhaPorEmail(
    AEmail.trim().toLowerCase()
  );
  const LSenhaConfere =
    LUsuario !== undefined && (await bcrypt.compare(ASenha, LUsuario.senha));
  if (!LSenhaConfere) {
    throw new ErroApi(401, 'e-mail ou senha inválidos');
  }
  if (!LUsuario.ativo) {
    throw new ErroApi(403, 'usuário inativo, procure um administrador');
  }
  const LToken = jwt.sign(
    { idusuario: LUsuario.idusuario },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRACAO || '8h' }
  );
  return {
    token: LToken,
    usuario: {
      idusuario: LUsuario.idusuario,
      nome: LUsuario.nome,
      email: LUsuario.email,
      tipo_usuario: LUsuario.tipo_usuario,
      trocar_senha: LUsuario.trocar_senha
    }
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Trocar a senha do próprio usuário, conferindo a atual, e deixá-la como definitiva.
 */
async function alterarMinhaSenha(AIdUsuario, ASenhaAtual, ANovaSenha) {
  const LSenhaGravada = await repository.buscarSenhaPorId(AIdUsuario);
  if (!(await bcrypt.compare(ASenhaAtual, LSenhaGravada))) {
    throw new ErroApi(400, 'a senha atual está incorreta');
  }
  await repository.definirSenha(
    AIdUsuario,
    await gerarHashSenha(ANovaSenha),
    false
  );
  return repository.buscarUsuarioPorId(AIdUsuario);
}

module.exports = {
  gerarHashSenha,
  entrar,
  alterarMinhaSenha
};
