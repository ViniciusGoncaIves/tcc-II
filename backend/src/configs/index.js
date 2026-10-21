const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASS,
  port: process.env.POSTGRES_PORT
});

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Executar os comandos da função recebida em uma única transação, na mesma conexão, confirmando tudo no fim ou desfazendo tudo em caso de erro.
 */
async function transacao(AFuncao) {
  const LConexao = await pool.connect();
  try {
    await LConexao.query('BEGIN');
    const LResultado = await AFuncao(LConexao);
    await LConexao.query('COMMIT');
    return LResultado;
  } catch (LErro) {
    await LConexao.query('ROLLBACK');
    throw LErro;
  } finally {
    LConexao.release();
  }
}

module.exports = {
  query: (sql, params) => pool.query(sql, params),
  transacao
};
