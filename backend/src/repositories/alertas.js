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

module.exports = {
  cadastrarAlertaPrimeiraDose,
  cancelarAlertasReceita
};
