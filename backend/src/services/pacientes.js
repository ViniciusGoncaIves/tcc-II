const db = require('../configs');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Buscar todos os pacientes em ordem alfabética.
 */
async function buscarPacientes () {
  const LSql = 'SELECT * FROM PACIENTE ORDER BY NOME';
  const LResultado = await db.query(LSql);
  return LResultado.rows;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Buscar um paciente pelo id.
 */
async function buscarPacientePorId (AId) {
  const LSql = 'SELECT * FROM PACIENTE WHERE IDPACIENTE = $1';
  const LResultado = await db.query(LSql, [AId]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Inserir um paciente e devolver o registro criado.
 */
async function cadastrarPaciente (ADados) {
  const LSql = `
    INSERT INTO PACIENTE (NOME, TELEFONE, DATA_NASCIMENTO)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const LResultado = await db.query(LSql, [ADados.nome, ADados.telefone, ADados.data_nascimento]);
  return LResultado.rows[0];
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente
}
