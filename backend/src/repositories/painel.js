const db = require('../configs');

const FUSO_HORARIO = 'America/Sao_Paulo';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 30/10/2026 22:46
 * * OBJECTIVE: Contar as receitas ativas, as primeiras doses aguardando confirmação e as doses confirmadas e enviadas desde o início do dia, no fuso de Brasília.
 */
async function buscarResumo() {
  const LSql = `WITH INICIO_DIA AS (
                  SELECT DATE_TRUNC('DAY', NOW() AT TIME ZONE $1::TEXT) AT TIME ZONE $1::TEXT AS HORARIO
                )
                SELECT (SELECT COUNT(RECEITA.IDRECEITA)::INTEGER
                          FROM RECEITA
                         WHERE RECEITA.STATUS = 'ATIVA') AS RECEITAS_ATIVAS,
                       (SELECT COUNT(ALERTA.IDALERTA)::INTEGER
                          FROM ALERTA
                          JOIN ITENS_RECEITA ON ITENS_RECEITA.IDITENSRECEITA = ALERTA.IDITENSRECEITA
                         WHERE ALERTA.STATUS = 'ENVIADO'
                           AND ALERTA.REQUER_CONFIRMACAO = TRUE
                           AND ITENS_RECEITA.STATUS = 'AGUARDANDO_CONFIRMACAO') AS AGUARDANDO_CONFIRMACAO,
                       (SELECT COUNT(ALERTA.IDALERTA)::INTEGER
                          FROM ALERTA
                         WHERE ALERTA.STATUS = 'CONFIRMADO'
                           AND ALERTA.HORARIO_CONFIRMACAO >= INICIO_DIA.HORARIO) AS CONFIRMADAS_HOJE,
                       (SELECT COUNT(ALERTA.IDALERTA)::INTEGER
                          FROM ALERTA
                         WHERE ALERTA.HORARIO_ENVIO >= INICIO_DIA.HORARIO) AS DOSES_ENVIADAS_HOJE
                  FROM INICIO_DIA`;
  const LResultado = await db.query(LSql, [FUSO_HORARIO]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 30/10/2026 22:47
 * * OBJECTIVE: Consultar as primeiras doses que esperam a confirmação do paciente há mais tempo, com o paciente, o medicamento e o número do envio.
 */
async function buscarDosesAguardando(ALimite) {
  const LSql = `SELECT ALERTA.IDALERTA,
                       ALERTA.TENTATIVAS,
                       ALERTA.LIMITE_TENTATIVAS,
                       ITENS_RECEITA.IDRECEITA,
                       ITENS_RECEITA.DOSE,
                       MEDICAMENTO.NOME AS NOME_MEDICAMENTO,
                       PACIENTE.NOME AS NOME_PACIENTE
                  FROM ALERTA
                  JOIN ITENS_RECEITA ON ITENS_RECEITA.IDITENSRECEITA = ALERTA.IDITENSRECEITA
                  JOIN MEDICAMENTO ON MEDICAMENTO.IDMEDICAMENTO = ITENS_RECEITA.IDMEDICAMENTO
                  JOIN RECEITA ON RECEITA.IDRECEITA = ITENS_RECEITA.IDRECEITA
                  JOIN PACIENTE ON PACIENTE.IDPACIENTE = RECEITA.IDPACIENTE
                 WHERE ALERTA.STATUS = 'ENVIADO'
                   AND ALERTA.REQUER_CONFIRMACAO = TRUE
                   AND ITENS_RECEITA.STATUS = 'AGUARDANDO_CONFIRMACAO'
                 ORDER BY ALERTA.HORARIO_PREVISTO
                 LIMIT $1`;
  const LResultado = await db.query(LSql, [ALimite]);
  return LResultado.rows;
}

module.exports = {
  buscarResumo,
  buscarDosesAguardando
};
