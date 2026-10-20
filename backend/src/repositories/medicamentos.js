const db = require('../configs');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 20:49
 * * OBJECTIVE: Inserir um medicamento e devolver o registro criado.
 */
async function cadastrarMedicamento(ADados) {
  const LSql = `INSERT INTO MEDICAMENTO (NOME, DESCRICAO)
                VALUES ($1, $2)
             RETURNING *`;
  const LResultado = await db.query(LSql, [ADados.nome, ADados.descricao]);
  return LResultado.rows[0];
}

module.exports = {
  cadastrarMedicamento
};
