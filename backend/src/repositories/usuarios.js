const db = require('../configs');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Consultar os usuários em ordem alfabética, sem a senha, filtrando pela situação quando ela for informada.
 */
async function buscarUsuarios(AAtivo) {
  const LSql = `SELECT USUARIO.IDUSUARIO,
                       USUARIO.NOME,
                       USUARIO.EMAIL,
                       USUARIO.TIPO_USUARIO,
                       USUARIO.ATIVO,
                       USUARIO.TROCAR_SENHA,
                       USUARIO.DATA_REGISTRO,
                       USUARIO.DATA_ATUALIZACAO
                  FROM USUARIO
                 WHERE ($1::BOOLEAN IS NULL OR USUARIO.ATIVO = $1)
                 ORDER BY USUARIO.NOME`;
  const LResultado = await db.query(LSql, [AAtivo]);
  return LResultado.rows;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Consultar um usuário pelo id, sem a senha.
 */
async function buscarUsuarioPorId(AId) {
  const LSql = `SELECT USUARIO.IDUSUARIO,
                       USUARIO.NOME,
                       USUARIO.EMAIL,
                       USUARIO.TIPO_USUARIO,
                       USUARIO.ATIVO,
                       USUARIO.TROCAR_SENHA,
                       USUARIO.DATA_REGISTRO,
                       USUARIO.DATA_ATUALIZACAO
                  FROM USUARIO
                 WHERE USUARIO.IDUSUARIO = $1`;
  const LResultado = await db.query(LSql, [AId]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Consultar um usuário pelo e-mail incluindo o hash da senha, para uso exclusivo no login.
 */
async function buscarUsuarioComSenhaPorEmail(AEmail) {
  const LSql = `SELECT USUARIO.IDUSUARIO,
                       USUARIO.NOME,
                       USUARIO.EMAIL,
                       USUARIO.TIPO_USUARIO,
                       USUARIO.ATIVO,
                       USUARIO.TROCAR_SENHA,
                       USUARIO.DATA_REGISTRO,
                       USUARIO.DATA_ATUALIZACAO,
                       USUARIO.SENHA
                  FROM USUARIO
                 WHERE USUARIO.EMAIL = $1`;
  const LResultado = await db.query(LSql, [AEmail]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Consultar o hash da senha de um usuário, para conferir a senha atual na troca de senha.
 */
async function buscarSenhaPorId(AId) {
  const LSql = `SELECT USUARIO.SENHA
                  FROM USUARIO
                 WHERE USUARIO.IDUSUARIO = $1`;
  const LResultado = await db.query(LSql, [AId]);
  return LResultado.rows[0]?.senha;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Inserir um usuário e devolver o registro criado, sem a senha.
 */
async function cadastrarUsuario(ADados) {
  const LSql = `INSERT INTO USUARIO (NOME, EMAIL, SENHA, TIPO_USUARIO)
                VALUES ($1, $2, $3, $4)
             RETURNING USUARIO.IDUSUARIO,
                       USUARIO.NOME,
                       USUARIO.EMAIL,
                       USUARIO.TIPO_USUARIO,
                       USUARIO.ATIVO,
                       USUARIO.TROCAR_SENHA,
                       USUARIO.DATA_REGISTRO,
                       USUARIO.DATA_ATUALIZACAO`;
  const LResultado = await db.query(LSql, [
    ADados.nome,
    ADados.email,
    ADados.senha,
    ADados.tipo_usuario
  ]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Atualizar os dados de um usuário; quando vier uma nova senha, gravá-la como provisória.
 */
async function alterarUsuario(AId, ADados) {
  const LSql = `UPDATE USUARIO
                   SET NOME = $1,
                       EMAIL = $2,
                       TIPO_USUARIO = COALESCE($3, USUARIO.TIPO_USUARIO),
                       SENHA = COALESCE($4::VARCHAR, USUARIO.SENHA),
                       TROCAR_SENHA = ($4::VARCHAR IS NOT NULL OR USUARIO.TROCAR_SENHA),
                       DATA_ATUALIZACAO = NOW()
                 WHERE USUARIO.IDUSUARIO = $5
             RETURNING USUARIO.IDUSUARIO,
                       USUARIO.NOME,
                       USUARIO.EMAIL,
                       USUARIO.TIPO_USUARIO,
                       USUARIO.ATIVO,
                       USUARIO.TROCAR_SENHA,
                       USUARIO.DATA_REGISTRO,
                       USUARIO.DATA_ATUALIZACAO`;
  const LResultado = await db.query(LSql, [
    ADados.nome,
    ADados.email,
    ADados.tipo_usuario,
    ADados.senha,
    AId
  ]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Gravar uma nova senha para o usuário, indicando se ela é provisória.
 */
async function definirSenha(AId, ASenha, ATrocarSenha) {
  const LSql = `UPDATE USUARIO
                   SET SENHA = $1,
                       TROCAR_SENHA = $2,
                       DATA_ATUALIZACAO = NOW()
                 WHERE USUARIO.IDUSUARIO = $3`;
  await db.query(LSql, [ASenha, ATrocarSenha, AId]);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Ativar ou inativar um usuário e devolver o registro alterado, sem a senha.
 */
async function alterarSituacaoUsuario(AId, AAtivo) {
  const LSql = `UPDATE USUARIO
                   SET ATIVO = $1,
                       DATA_ATUALIZACAO = NOW()
                 WHERE USUARIO.IDUSUARIO = $2
             RETURNING USUARIO.IDUSUARIO,
                       USUARIO.NOME,
                       USUARIO.EMAIL,
                       USUARIO.TIPO_USUARIO,
                       USUARIO.ATIVO,
                       USUARIO.TROCAR_SENHA,
                       USUARIO.DATA_REGISTRO,
                       USUARIO.DATA_ATUALIZACAO`;
  const LResultado = await db.query(LSql, [AAtivo, AId]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Contar quantos administradores ativos existem.
 */
async function contarAdministradoresAtivos() {
  const LSql = `SELECT COUNT(*) AS TOTAL
                  FROM USUARIO
                 WHERE USUARIO.TIPO_USUARIO = 'ADMIN'
                   AND USUARIO.ATIVO = TRUE`;
  const LResultado = await db.query(LSql);
  return Number(LResultado.rows[0].total);
}

module.exports = {
  buscarUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioComSenhaPorEmail,
  buscarSenhaPorId,
  cadastrarUsuario,
  alterarUsuario,
  definirSenha,
  alterarSituacaoUsuario,
  contarAdministradoresAtivos
};
