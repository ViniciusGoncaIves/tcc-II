const db = require('../configs');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:24
 * * OBJECTIVE: Consultar os medicamentos em ordem alfabética, filtrando pela situação quando ela for informada.
 */
async function buscarMedicamentos(AAtivo) {
  const LSql = `SELECT MEDICAMENTO.IDMEDICAMENTO,
                       MEDICAMENTO.NOME,
                       MEDICAMENTO.DESCRICAO,
                       MEDICAMENTO.DATA_CRIACAO,
                       MEDICAMENTO.DATA_ALTERACAO,
                       MEDICAMENTO.ATIVO
                  FROM MEDICAMENTO
                 WHERE ($1::BOOLEAN IS NULL OR MEDICAMENTO.ATIVO = $1)
                 ORDER BY MEDICAMENTO.NOME`;
  const LResultado = await db.query(LSql, [AAtivo]);
  return LResultado.rows;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:24
 * * OBJECTIVE: Consultar um medicamento pelo id.
 */
async function buscarMedicamentoPorId(AId) {
  const LSql = `SELECT MEDICAMENTO.IDMEDICAMENTO,
                       MEDICAMENTO.NOME,
                       MEDICAMENTO.DESCRICAO,
                       MEDICAMENTO.DATA_CRIACAO,
                       MEDICAMENTO.DATA_ALTERACAO,
                       MEDICAMENTO.ATIVO
                  FROM MEDICAMENTO
                 WHERE MEDICAMENTO.IDMEDICAMENTO = $1`;
  const LResultado = await db.query(LSql, [AId]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 20:49
 * * OBJECTIVE: Inserir um medicamento e devolver o registro criado.
 */
async function cadastrarMedicamento(ADados) {
  const LSql = `INSERT INTO MEDICAMENTO (NOME, DESCRICAO)
                VALUES ($1, $2)
             RETURNING MEDICAMENTO.IDMEDICAMENTO,
                       MEDICAMENTO.NOME,
                       MEDICAMENTO.DESCRICAO,
                       MEDICAMENTO.DATA_CRIACAO,
                       MEDICAMENTO.DATA_ALTERACAO,
                       MEDICAMENTO.ATIVO`;
  const LResultado = await db.query(LSql, [ADados.nome, ADados.descricao]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:36
 * * OBJECTIVE: Atualizar o nome e a descrição de um medicamento e devolver o registro alterado.
 */
async function alterarMedicamento(AId, ADados) {
  const LSql = `UPDATE MEDICAMENTO
                   SET NOME = $1,
                       DESCRICAO = $2,
                       DATA_ALTERACAO = NOW()
                 WHERE MEDICAMENTO.IDMEDICAMENTO = $3
             RETURNING MEDICAMENTO.IDMEDICAMENTO,
                       MEDICAMENTO.NOME,
                       MEDICAMENTO.DESCRICAO,
                       MEDICAMENTO.DATA_CRIACAO,
                       MEDICAMENTO.DATA_ALTERACAO,
                       MEDICAMENTO.ATIVO`;
  const LResultado = await db.query(LSql, [ADados.nome, ADados.descricao, AId]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 21:36
 * * OBJECTIVE: Ativar ou inativar um medicamento e devolver o registro alterado.
 */
async function alterarSituacaoMedicamento(AId, AAtivo) {
  const LSql = `UPDATE MEDICAMENTO
                   SET ATIVO = $1,
                       DATA_ALTERACAO = NOW()
                 WHERE MEDICAMENTO.IDMEDICAMENTO = $2
             RETURNING MEDICAMENTO.IDMEDICAMENTO,
                       MEDICAMENTO.NOME,
                       MEDICAMENTO.DESCRICAO,
                       MEDICAMENTO.DATA_CRIACAO,
                       MEDICAMENTO.DATA_ALTERACAO,
                       MEDICAMENTO.ATIVO`;
  const LResultado = await db.query(LSql, [AAtivo, AId]);
  return LResultado.rows[0];
}

module.exports = {
  buscarMedicamentos,
  buscarMedicamentoPorId,
  cadastrarMedicamento,
  alterarMedicamento,
  alterarSituacaoMedicamento
};
