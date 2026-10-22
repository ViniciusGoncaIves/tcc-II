const db = require('../configs');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 15:18
 * * OBJECTIVE: Consultar os pacientes em ordem alfabética, filtrando pela situação quando ela for informada.
 */
async function buscarPacientes(AAtivo) {
  const LSql = `SELECT PACIENTE.IDPACIENTE,
                       PACIENTE.NOME,
                       PACIENTE.TELEFONE,
                       PACIENTE.DATA_NASCIMENTO,
                       PACIENTE.ATIVO,
                       PACIENTE.DATA_CADASTRO,
                       PACIENTE.DATA_ATUALIZACAO
                  FROM PACIENTE
                 WHERE ($1::BOOLEAN IS NULL OR PACIENTE.ATIVO = $1)
                 ORDER BY PACIENTE.NOME`;
  const LResultado = await db.query(LSql, [AAtivo]);
  return LResultado.rows;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 15:18
 * * OBJECTIVE: Consultar um paciente pelo id.
 */
async function buscarPacientePorId(AId) {
  const LSql = `SELECT PACIENTE.IDPACIENTE,
                       PACIENTE.NOME,
                       PACIENTE.TELEFONE,
                       PACIENTE.DATA_NASCIMENTO,
                       PACIENTE.ATIVO,
                       PACIENTE.DATA_CADASTRO,
                       PACIENTE.DATA_ATUALIZACAO
                  FROM PACIENTE
                 WHERE PACIENTE.IDPACIENTE = $1`;
  const LResultado = await db.query(LSql, [AId]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 15:18
 * * OBJECTIVE: Inserir um paciente e devolver o registro criado.
 */
async function cadastrarPaciente(ADados) {
  const LSql = `INSERT INTO PACIENTE (NOME, TELEFONE, DATA_NASCIMENTO)
                VALUES ($1, $2, $3)
             RETURNING PACIENTE.IDPACIENTE,
                       PACIENTE.NOME,
                       PACIENTE.TELEFONE,
                       PACIENTE.DATA_NASCIMENTO,
                       PACIENTE.ATIVO,
                       PACIENTE.DATA_CADASTRO,
                       PACIENTE.DATA_ATUALIZACAO`;
  const LResultado = await db.query(LSql, [
    ADados.nome,
    ADados.telefone,
    ADados.data_nascimento
  ]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 16:51
 * * OBJECTIVE: Atualizar os dados de um paciente e devolver o registro alterado.
 */
async function alterarPaciente(AId, ADados) {
  const LSql = `UPDATE PACIENTE
                   SET NOME = $1,
                       TELEFONE = $2,
                       DATA_NASCIMENTO = $3,
                       DATA_ATUALIZACAO = NOW()
                 WHERE PACIENTE.IDPACIENTE = $4
             RETURNING PACIENTE.IDPACIENTE,
                       PACIENTE.NOME,
                       PACIENTE.TELEFONE,
                       PACIENTE.DATA_NASCIMENTO,
                       PACIENTE.ATIVO,
                       PACIENTE.DATA_CADASTRO,
                       PACIENTE.DATA_ATUALIZACAO`;
  const LResultado = await db.query(LSql, [
    ADados.nome,
    ADados.telefone,
    ADados.data_nascimento,
    AId
  ]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 19:31
 * * OBJECTIVE: Ativar ou inativar um paciente e devolver o registro alterado.
 */
async function alterarSituacaoPaciente(AId, AAtivo) {
  const LSql = `UPDATE PACIENTE
                   SET ATIVO = $1,
                       DATA_ATUALIZACAO = NOW()
                 WHERE PACIENTE.IDPACIENTE = $2
             RETURNING PACIENTE.IDPACIENTE,
                       PACIENTE.NOME,
                       PACIENTE.TELEFONE,
                       PACIENTE.DATA_NASCIMENTO,
                       PACIENTE.ATIVO,
                       PACIENTE.DATA_CADASTRO,
                       PACIENTE.DATA_ATUALIZACAO`;
  const LResultado = await db.query(LSql, [AAtivo, AId]);
  return LResultado.rows[0];
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente,
  alterarPaciente,
  alterarSituacaoPaciente
};
