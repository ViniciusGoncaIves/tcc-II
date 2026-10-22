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

module.exports = {
  cadastrarAlertaPrimeiraDose
};
