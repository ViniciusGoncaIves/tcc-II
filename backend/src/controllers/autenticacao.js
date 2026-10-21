const service = require('../services/autenticacao');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Fazer o login e devolver o token de acesso com os dados do usuário.
 */
async function entrar(req, res) {
  const LResultado = await service.entrar(req.body.email, req.body.senha);
  return res.status(200).json(LResultado);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Trocar a senha do usuário logado e devolver os dados atualizados.
 */
async function alterarMinhaSenha(req, res) {
  const LUsuario = await service.alterarMinhaSenha(
    req.usuario.idusuario,
    req.body.senha_atual,
    req.body.nova_senha
  );
  return res.status(200).json(LUsuario);
}

module.exports = {
  entrar,
  alterarMinhaSenha
};
