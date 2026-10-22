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

module.exports = {
  cadastrarReceita,
  cadastrarItemReceita,
  contarReceitasAtivasPorPaciente
};
