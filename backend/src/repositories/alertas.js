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
                                             THEN NOW() + INTERVAL '1 hour'
                                           END
                 WHERE ALERTA.IDALERTA = ANY($1::UUID[])`;
  await AConexao.query(LSql, [AIdsAlertas]);
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

module.exports = {
  cadastrarAlertaPrimeiraDose,
  cancelarAlertasReceita,
  buscarAlertasParaEnvio,
  marcarAlertasEnviados,
  expirarAlertasSemConfirmacao
};
