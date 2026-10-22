const db = require('../configs');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Inserir uma receita, dentro da transação recebida, e devolver o registro criado.
 */
async function cadastrarReceita(AConexao, ADados, AIdUsuario) {
  const LSql = `INSERT INTO RECEITA (IDPACIENTE, USUARIO, OBSERVACAO)
                VALUES ($1, $2, $3)
             RETURNING RECEITA.IDRECEITA,
                       RECEITA.IDPACIENTE,
                       RECEITA.USUARIO,
                       RECEITA.OBSERVACAO,
                       RECEITA.STATUS,
                       RECEITA.DATA_EMISSAO`;
  const LResultado = await AConexao.query(LSql, [
    ADados.idpaciente,
    AIdUsuario,
    ADados.observacao
  ]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Inserir um item da receita, dentro da transação recebida, e devolver o registro criado com a quantidade de alertas calculada pelo banco.
 */
async function cadastrarItemReceita(AConexao, AIdReceita, AItem) {
  const LSql = `INSERT INTO ITENS_RECEITA (IDRECEITA, IDMEDICAMENTO, DOSE,
                                           INTERVALO_HORAS, DURACAO_DIAS)
                VALUES ($1, $2, $3, $4, $5)
             RETURNING ITENS_RECEITA.IDITENSRECEITA,
                       ITENS_RECEITA.IDRECEITA,
                       ITENS_RECEITA.IDMEDICAMENTO,
                       ITENS_RECEITA.DOSE,
                       ITENS_RECEITA.INTERVALO_HORAS,
                       ITENS_RECEITA.DURACAO_DIAS,
                       ITENS_RECEITA.DATA_INICIO,
                       ITENS_RECEITA.QUANTIDADE_ALERTA,
                       ITENS_RECEITA.STATUS`;
  const LResultado = await AConexao.query(LSql, [
    AIdReceita,
    AItem.idmedicamento,
    AItem.dose,
    AItem.intervalo_horas,
    AItem.duracao_dias
  ]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 20:06
 * * OBJECTIVE: Contar as receitas ativas de um paciente.
 */
async function contarReceitasAtivasPorPaciente(AIdPaciente) {
  const LSql = `SELECT COUNT(*) AS TOTAL
                  FROM RECEITA
                 WHERE RECEITA.IDPACIENTE = $1
                   AND RECEITA.STATUS = 'ATIVA'`;
  const LResultado = await db.query(LSql, [AIdPaciente]);
  return Number(LResultado.rows[0].total);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:16
 * * OBJECTIVE: Consultar as receitas, das mais recentes para as mais antigas, com o nome do paciente, do emissor e a quantidade de itens, filtrando pela situação e pelo paciente quando forem informados.
 */
async function buscarReceitas(AFiltros) {
  const LSql = `SELECT RECEITA.IDRECEITA,
                       RECEITA.IDPACIENTE,
                       PACIENTE.NOME AS NOME_PACIENTE,
                       USUARIO.NOME AS NOME_EMISSOR,
                       RECEITA.STATUS,
                       RECEITA.DATA_EMISSAO,
                       (SELECT COUNT(*)::INTEGER
                          FROM ITENS_RECEITA
                         WHERE ITENS_RECEITA.IDRECEITA = RECEITA.IDRECEITA) AS QUANTIDADE_ITENS
                  FROM RECEITA
                  JOIN PACIENTE ON PACIENTE.IDPACIENTE = RECEITA.IDPACIENTE
                  JOIN USUARIO ON USUARIO.IDUSUARIO = RECEITA.USUARIO
                 WHERE ($1::STATUS_RECEITA IS NULL OR RECEITA.STATUS = $1)
                   AND ($2::UUID IS NULL OR RECEITA.IDPACIENTE = $2)
                 ORDER BY RECEITA.DATA_EMISSAO DESC`;
  const LResultado = await db.query(LSql, [
    AFiltros.status,
    AFiltros.idpaciente
  ]);
  return LResultado.rows;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:18
 * * OBJECTIVE: Consultar uma receita pelo id, com o nome do paciente, do emissor e de quem cancelou, quando for o caso.
 */
async function buscarReceitaPorId(AId) {
  const LSql = `SELECT RECEITA.IDRECEITA,
                       RECEITA.IDPACIENTE,
                       PACIENTE.NOME AS NOME_PACIENTE,
                       RECEITA.USUARIO,
                       (SELECT USUARIO.NOME
                          FROM USUARIO
                         WHERE USUARIO.IDUSUARIO = RECEITA.USUARIO) AS NOME_EMISSOR,
                       RECEITA.OBSERVACAO,
                       RECEITA.STATUS,
                       RECEITA.DATA_EMISSAO,
                       RECEITA.DATA_CANCELAMENTO,
                       RECEITA.USUARIO_CANCELAMENTO,
                       (SELECT USUARIO.NOME
                          FROM USUARIO
                         WHERE USUARIO.IDUSUARIO = RECEITA.USUARIO_CANCELAMENTO) AS NOME_USUARIO_CANCELAMENTO
                  FROM RECEITA
                  JOIN PACIENTE ON PACIENTE.IDPACIENTE = RECEITA.IDPACIENTE
                 WHERE RECEITA.IDRECEITA = $1`;
  const LResultado = await db.query(LSql, [AId]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:19
 * * OBJECTIVE: Consultar os itens de uma receita com o nome do medicamento e o resumo das doses: situação da dose 1, envios, doses enviadas, próxima dose e término previsto.
 */
async function buscarItensReceita(AIdReceita) {
  const LSql = `SELECT ITENS_RECEITA.IDITENSRECEITA,
                       ITENS_RECEITA.IDMEDICAMENTO,
                       MEDICAMENTO.NOME AS NOME_MEDICAMENTO,
                       ITENS_RECEITA.DOSE,
                       ITENS_RECEITA.INTERVALO_HORAS,
                       ITENS_RECEITA.DURACAO_DIAS,
                       ITENS_RECEITA.STATUS,
                       ITENS_RECEITA.QUANTIDADE_ALERTA,
                       MIN(ALERTA.STATUS) FILTER (WHERE ALERTA.NUMERO_DOSE = 1) AS STATUS_PRIMEIRA_DOSE,
                       MIN(ALERTA.TENTATIVAS) FILTER (WHERE ALERTA.NUMERO_DOSE = 1) AS ENVIOS_PRIMEIRA_DOSE,
                       MIN(ALERTA.HORARIO_CONFIRMACAO) FILTER (WHERE ALERTA.NUMERO_DOSE = 1) AS HORARIO_CONFIRMACAO,
                       (COUNT(ALERTA.IDALERTA) FILTER (WHERE ALERTA.HORARIO_ENVIO IS NOT NULL))::INTEGER AS DOSES_ENVIADAS,
                       MIN(ALERTA.HORARIO_PREVISTO) FILTER (WHERE ALERTA.STATUS = 'PENDENTE') AS PROXIMA_DOSE,
                       MIN(ALERTA.HORARIO_CONFIRMACAO) FILTER (WHERE ALERTA.NUMERO_DOSE = 1)
                         + ITENS_RECEITA.DURACAO_DIAS * INTERVAL '1 day' AS DATA_FIM_PREVISTA
                  FROM ITENS_RECEITA
                  JOIN MEDICAMENTO ON MEDICAMENTO.IDMEDICAMENTO = ITENS_RECEITA.IDMEDICAMENTO
             LEFT JOIN ALERTA ON ALERTA.IDITENSRECEITA = ITENS_RECEITA.IDITENSRECEITA
                 WHERE ITENS_RECEITA.IDRECEITA = $1
                 GROUP BY ITENS_RECEITA.IDITENSRECEITA,
                          MEDICAMENTO.NOME
                 ORDER BY MEDICAMENTO.NOME,
                          ITENS_RECEITA.DOSE`;
  const LResultado = await db.query(LSql, [AIdReceita]);
  return LResultado.rows;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:21
 * * OBJECTIVE: Cancelar a receita, dentro da transação recebida, registrando quando e quem cancelou; devolve quantas receitas foram alteradas (0 se ela não estava mais ativa).
 */
async function cancelarReceita(AConexao, AId, AIdUsuario) {
  const LSql = `UPDATE RECEITA
                   SET STATUS = 'CANCELADA',
                       DATA_CANCELAMENTO = NOW(),
                       USUARIO_CANCELAMENTO = $2
                 WHERE RECEITA.IDRECEITA = $1
                   AND RECEITA.STATUS = 'ATIVA'`;
  const LResultado = await AConexao.query(LSql, [AId, AIdUsuario]);
  return LResultado.rowCount;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:22
 * * OBJECTIVE: Cancelar, dentro da transação recebida, os itens da receita que ainda não terminaram.
 */
async function cancelarItensReceita(AConexao, AIdReceita) {
  const LSql = `UPDATE ITENS_RECEITA
                   SET STATUS = 'CANCELADO'
                 WHERE ITENS_RECEITA.IDRECEITA = $1
                   AND ITENS_RECEITA.STATUS IN ('AGUARDANDO_CONFIRMACAO', 'EM_ANDAMENTO')`;
  await AConexao.query(LSql, [AIdReceita]);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:23
 * * OBJECTIVE: Cancelar, dentro da transação recebida, os itens cuja dose 1 expirou sem confirmação; devolve os ids das receitas desses itens.
 */
async function cancelarItensExpirados(AConexao, AIdsItens) {
  const LSql = `UPDATE ITENS_RECEITA
                   SET STATUS = 'CANCELADO'
                 WHERE ITENS_RECEITA.IDITENSRECEITA = ANY($1::UUID[])
                   AND ITENS_RECEITA.STATUS = 'AGUARDANDO_CONFIRMACAO'
             RETURNING ITENS_RECEITA.IDRECEITA`;
  const LResultado = await AConexao.query(LSql, [AIdsItens]);
  return LResultado.rows.map((ALinha) => ALinha.idreceita);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:24
 * * OBJECTIVE: Contar, dentro da transação recebida, quantos itens da receita ainda estão ativos e quantos foram concluídos.
 */
async function resumirItensReceita(AConexao, AIdReceita) {
  const LSql = `SELECT (COUNT(*) FILTER (WHERE ITENS_RECEITA.STATUS IN ('AGUARDANDO_CONFIRMACAO', 'EM_ANDAMENTO')))::INTEGER AS ITENS_ATIVOS,
                       (COUNT(*) FILTER (WHERE ITENS_RECEITA.STATUS = 'CONCLUIDO'))::INTEGER AS ITENS_CONCLUIDOS
                  FROM ITENS_RECEITA
                 WHERE ITENS_RECEITA.IDRECEITA = $1`;
  const LResultado = await AConexao.query(LSql, [AIdReceita]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:26
 * * OBJECTIVE: Marcar a receita como concluída, dentro da transação recebida, se ela ainda estiver ativa.
 */
async function concluirReceita(AConexao, AIdReceita) {
  const LSql = `UPDATE RECEITA
                   SET STATUS = 'CONCLUIDA'
                 WHERE RECEITA.IDRECEITA = $1
                   AND RECEITA.STATUS = 'ATIVA'`;
  await AConexao.query(LSql, [AIdReceita]);
}

module.exports = {
  cadastrarReceita,
  cadastrarItemReceita,
  contarReceitasAtivasPorPaciente,
  buscarReceitas,
  buscarReceitaPorId,
  buscarItensReceita,
  cancelarReceita,
  cancelarItensReceita,
  cancelarItensExpirados,
  resumirItensReceita,
  concluirReceita
};
