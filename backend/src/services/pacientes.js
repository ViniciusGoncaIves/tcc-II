const db = require('../configs');

async function buscarPacientes () {
  const sql = 'SELECT * FROM PACIENTE ORDER BY NOME';
  const result = await db.query(sql);
  return result.rows;
}

async function buscarPacientePorId (id) {
  const sql = 'SELECT * FROM PACIENTE WHERE IDPACIENTE = $1';
  const result = await db.query(sql, [id]);
  return result.rows[0];
}

async function cadastrarPaciente (dados) {
  const sql = `
    INSERT INTO PACIENTE (NOME, TELEFONE, DATA_NASCIMENTO)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await db.query(sql, [dados.nome, dados.telefone, dados.data_nascimento]);
  return result.rows[0];
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente
}
