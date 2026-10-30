const db = require('../configs');
const tempo = require('../configs/tempo');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Inserir, dentro da transação recebida, o alerta da dose 1 do item, que exige confirmação e fica previsto para o momento da emissão.
 */
async function cadastrarAlertaPrimeiraDose(AConexao, AIdItemReceita) {
  const LSql = `INSERT INTO ALERTA (IDITENSRECEITA, NUMERO_DOSE,
                                    REQUER_CONFIRMACAO, HORARIO_PREVISTO)
                VALUES ($1, 1, TRUE, NOW())
             RETURNING ALERTA.IDALERTA,
                       ALERTA.IDITENSRECEITA,
                       ALERTA.NUMERO_DOSE,
                       ALERTA.REQUER_CONFIRMACAO,
                       ALERTA.HORARIO_PREVISTO,
                       ALERTA.HORARIO_ENVIO,
                       ALERTA.HORARIO_CONFIRMACAO,
                       ALERTA.STATUS,
                       ALERTA.TENTATIVAS,
                       ALERTA.LIMITE_TENTATIVAS,
                       ALERTA.PROXIMA_TENTATIVA`;
  const LResultado = await AConexao.query(LSql, [AIdItemReceita]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:24
 * * OBJECTIVE: Cancelar, dentro da transação recebida, os alertas da receita que ainda não foram enviados e a dose 1 que espera confirmação; as doses já enviadas ficam como histórico.
 */
async function cancelarAlertasReceita(AConexao, AIdReceita) {
  const LSql = `UPDATE ALERTA
                   SET STATUS = 'CANCELADO'
                 WHERE ALERTA.IDITENSRECEITA IN (SELECT ITENS_RECEITA.IDITENSRECEITA
                                                   FROM ITENS_RECEITA
                                                  WHERE ITENS_RECEITA.IDRECEITA = $1)
                   AND (ALERTA.STATUS = 'PENDENTE'
                        OR (ALERTA.STATUS = 'ENVIADO' AND ALERTA.REQUER_CONFIRMACAO = TRUE))`;
  await AConexao.query(LSql, [AIdReceita]);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:14
 * * OBJECTIVE: Buscar e travar, dentro da transação recebida, os alertas que precisam sair agora (pendentes que venceram e doses 1 sem confirmação na hora do reenvio), com os dados da mensagem; os alertas já travados por outra rodada são pulados.
 */
async function buscarAlertasParaEnvio(AConexao, ALimite) {
  const LSql = `SELECT ALERTA.IDALERTA,
                       ALERTA.NUMERO_DOSE,
                       ALERTA.REQUER_CONFIRMACAO,
                       ALERTA.STATUS,
                       ALERTA.HORARIO_ENVIO,
                       ALERTA.TENTATIVAS,
                       ALERTA.LIMITE_TENTATIVAS,
                       ALERTA.PROXIMA_TENTATIVA,
                       ITENS_RECEITA.DOSE,
                       ITENS_RECEITA.INTERVALO_HORAS,
                       ITENS_RECEITA.QUANTIDADE_ALERTA,
                       MEDICAMENTO.NOME AS NOME_MEDICAMENTO,
                       RECEITA.IDPACIENTE,
                       PACIENTE.NOME AS NOME_PACIENTE,
                       PACIENTE.TELEFONE
                  FROM ALERTA
                  JOIN ITENS_RECEITA ON ITENS_RECEITA.IDITENSRECEITA = ALERTA.IDITENSRECEITA
                  JOIN MEDICAMENTO ON MEDICAMENTO.IDMEDICAMENTO = ITENS_RECEITA.IDMEDICAMENTO
                  JOIN RECEITA ON RECEITA.IDRECEITA = ITENS_RECEITA.IDRECEITA
                  JOIN PACIENTE ON PACIENTE.IDPACIENTE = RECEITA.IDPACIENTE
                 WHERE ITENS_RECEITA.STATUS IN ('AGUARDANDO_CONFIRMACAO', 'EM_ANDAMENTO')
                   AND ((ALERTA.STATUS = 'PENDENTE'
                         AND ALERTA.HORARIO_PREVISTO <= NOW())
                        OR (ALERTA.STATUS = 'ENVIADO'
                            AND ALERTA.REQUER_CONFIRMACAO = TRUE
                            AND ALERTA.TENTATIVAS < ALERTA.LIMITE_TENTATIVAS
                            AND ALERTA.PROXIMA_TENTATIVA <= NOW()))
                 ORDER BY ALERTA.HORARIO_PREVISTO
                 LIMIT $1
                   FOR UPDATE OF ALERTA SKIP LOCKED`;
  const LResultado = await AConexao.query(LSql, [ALimite]);
  return LResultado.rows;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:17
 * * OBJECTIVE: Marcar como enviados, dentro da transação recebida, os alertas reservados para envio: soma uma tentativa, guarda o horário do primeiro envio e, na dose 1, agenda o reenvio para 1 hora depois.
 */
async function marcarAlertasEnviados(AConexao, AIdsAlertas) {
  const LSql = `UPDATE ALERTA
                   SET STATUS = 'ENVIADO',
                       HORARIO_ENVIO = COALESCE(ALERTA.HORARIO_ENVIO, NOW()),
                       TENTATIVAS = ALERTA.TENTATIVAS + 1,
                       PROXIMA_TENTATIVA = CASE
                                             WHEN ALERTA.REQUER_CONFIRMACAO = TRUE
                                             THEN NOW() + $2::INTERVAL
                                           END
                 WHERE ALERTA.IDALERTA = ANY($1::UUID[])`;
  await AConexao.query(LSql, [AIdsAlertas, tempo.UMA_HORA]);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 19:21
 * * OBJECTIVE: Expirar, dentro da transação recebida, as doses 1 que já usaram todos os envios e passaram do prazo sem confirmação; devolve os ids dos itens dessas doses.
 */
async function expirarAlertasSemConfirmacao(AConexao) {
  const LSql = `UPDATE ALERTA
                   SET STATUS = 'EXPIRADO',
                       PROXIMA_TENTATIVA = NULL
                 WHERE ALERTA.STATUS = 'ENVIADO'
                   AND ALERTA.REQUER_CONFIRMACAO = TRUE
                   AND ALERTA.TENTATIVAS >= ALERTA.LIMITE_TENTATIVAS
                   AND ALERTA.PROXIMA_TENTATIVA <= NOW()
             RETURNING ALERTA.IDITENSRECEITA`;
  const LResultado = await AConexao.query(LSql);
  return LResultado.rows.map((ALinha) => ALinha.iditensreceita);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:34
 * * OBJECTIVE: Buscar e travar, dentro da transação recebida, a dose 1 que o paciente vai confirmar, com os dados do item, do medicamento e do paciente; outra confirmação do mesmo alerta espera esta transação terminar.
 */
async function buscarPrimeiraDoseParaConfirmacao(AConexao, AIdAlerta) {
  const LSql = `SELECT ALERTA.IDALERTA,
                       ALERTA.IDITENSRECEITA,
                       ALERTA.STATUS,
                       ALERTA.HORARIO_CONFIRMACAO,
                       ITENS_RECEITA.DOSE,
                       ITENS_RECEITA.INTERVALO_HORAS,
                       MEDICAMENTO.NOME AS NOME_MEDICAMENTO,
                       PACIENTE.NOME AS NOME_PACIENTE
                  FROM ALERTA
                  JOIN ITENS_RECEITA ON ITENS_RECEITA.IDITENSRECEITA = ALERTA.IDITENSRECEITA
                  JOIN MEDICAMENTO ON MEDICAMENTO.IDMEDICAMENTO = ITENS_RECEITA.IDMEDICAMENTO
                  JOIN RECEITA ON RECEITA.IDRECEITA = ITENS_RECEITA.IDRECEITA
                  JOIN PACIENTE ON PACIENTE.IDPACIENTE = RECEITA.IDPACIENTE
                 WHERE ALERTA.IDALERTA = $1
                   AND ALERTA.REQUER_CONFIRMACAO = TRUE
                   FOR UPDATE OF ALERTA`;
  const LResultado = await AConexao.query(LSql, [AIdAlerta]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:35
 * * OBJECTIVE: Marcar a dose 1 como confirmada, dentro da transação recebida, encerrando os reenvios; devolve o horário da confirmação.
 */
async function confirmarAlerta(AConexao, AIdAlerta) {
  const LSql = `UPDATE ALERTA
                   SET STATUS = 'CONFIRMADO',
                       HORARIO_CONFIRMACAO = NOW(),
                       PROXIMA_TENTATIVA = NULL
                 WHERE ALERTA.IDALERTA = $1
             RETURNING ALERTA.HORARIO_CONFIRMACAO`;
  const LResultado = await AConexao.query(LSql, [AIdAlerta]);
  return LResultado.rows[0].horario_confirmacao;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:36
 * * OBJECTIVE: Criar, dentro da transação recebida e num único comando, as doses 2 até a última do item, cada uma prevista para a confirmação mais (número da dose - 1) intervalos; devolve quantas foram criadas.
 */
async function cadastrarDosesSeguintes(
  AConexao,
  AIdItemReceita,
  AHorarioConfirmacao
) {
  const LSql = `INSERT INTO ALERTA (IDITENSRECEITA, NUMERO_DOSE, HORARIO_PREVISTO)
                SELECT ITENS_RECEITA.IDITENSRECEITA,
                       NUMERO_DOSE,
                       $2::TIMESTAMPTZ
                         + (NUMERO_DOSE - 1) * ITENS_RECEITA.INTERVALO_HORAS * $3::INTERVAL
                  FROM ITENS_RECEITA
                 CROSS JOIN GENERATE_SERIES(2, ITENS_RECEITA.QUANTIDADE_ALERTA) AS NUMERO_DOSE
                 WHERE ITENS_RECEITA.IDITENSRECEITA = $1`;
  const LResultado = await AConexao.query(LSql, [
    AIdItemReceita,
    AHorarioConfirmacao,
    tempo.UMA_HORA
  ]);
  return LResultado.rowCount;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 28/10/2026 21:37
 * * OBJECTIVE: Expirar sem envio as doses 2 em diante que passaram mais de 30 minutos do horário previsto (API desligada ou WhatsApp desconectado), para um lembrete atrasado não levar o paciente a tomar duas doses próximas; devolve quantas expiraram.
 */
async function expirarDosesSeguintesAtrasadas() {
  const LSql = `UPDATE ALERTA
                   SET STATUS = 'EXPIRADO'
                 WHERE ALERTA.STATUS = 'PENDENTE'
                   AND ALERTA.REQUER_CONFIRMACAO = FALSE
                   AND ALERTA.HORARIO_PREVISTO < NOW() - $1::INTERVAL`;
  const LResultado = await db.query(LSql, [tempo.TOLERANCIA_ATRASO]);
  return LResultado.rowCount;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:31
 * * OBJECTIVE: Consultar a situação atual de um alerta e o horário da confirmação, quando houver.
 */
async function buscarSituacaoAlerta(AIdAlerta) {
  const LSql = `SELECT ALERTA.STATUS,
                       ALERTA.HORARIO_CONFIRMACAO
                  FROM ALERTA
                 WHERE ALERTA.IDALERTA = $1`;
  const LResultado = await db.query(LSql, [AIdAlerta]);
  return LResultado.rows[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:32
 * * OBJECTIVE: Devolver à situação anterior o alerta reservado cujo envio falhou, para ele sair numa próxima rodada sem contar como tentativa.
 */
async function devolverAlerta(AAlerta) {
  const LSql = `UPDATE ALERTA
                   SET STATUS = $2,
                       HORARIO_ENVIO = $3,
                       TENTATIVAS = $4,
                       PROXIMA_TENTATIVA = $5
                 WHERE ALERTA.IDALERTA = $1
                   AND ALERTA.STATUS = 'ENVIADO'`;
  await db.query(LSql, [
    AAlerta.idalerta,
    AAlerta.status,
    AAlerta.horario_envio,
    AAlerta.tentativas,
    AAlerta.proxima_tentativa
  ]);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:33
 * * OBJECTIVE: Expirar a dose 2 em diante que não pôde ser enviada porque o telefone do paciente não tem WhatsApp, desfazendo o envio marcado na reserva.
 */
async function expirarAlertaSemWhatsApp(AIdAlerta) {
  const LSql = `UPDATE ALERTA
                   SET STATUS = 'EXPIRADO',
                       HORARIO_ENVIO = NULL,
                       TENTATIVAS = 0
                 WHERE ALERTA.IDALERTA = $1
                   AND ALERTA.STATUS = 'ENVIADO'
                   AND ALERTA.REQUER_CONFIRMACAO = FALSE`;
  await db.query(LSql, [AIdAlerta]);
}

module.exports = {
  cadastrarAlertaPrimeiraDose,
  cancelarAlertasReceita,
  buscarAlertasParaEnvio,
  marcarAlertasEnviados,
  expirarAlertasSemConfirmacao,
  buscarPrimeiraDoseParaConfirmacao,
  confirmarAlerta,
  cadastrarDosesSeguintes,
  expirarDosesSeguintesAtrasadas,
  buscarSituacaoAlerta,
  devolverAlerta,
  expirarAlertaSemWhatsApp
};
