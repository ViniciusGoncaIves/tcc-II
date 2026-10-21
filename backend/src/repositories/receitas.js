/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Inserir uma receita, dentro da transação recebida, e devolver o registro criado.
 */
async function cadastrarReceita(AConexao, ADados, AIdUsuario) {
  const LSql = `INSERT INTO RECEITA (IDPACIENTE, USUARIO, OBSERVACAO)
                VALUES ($1, $2, $3)
             RETURNING *`;
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
             RETURNING *`;
  const LResultado = await AConexao.query(LSql, [
    AIdReceita,
    AItem.idmedicamento,
    AItem.dose,
    AItem.intervalo_horas,
    AItem.duracao_dias
  ]);
  return LResultado.rows[0];
}

module.exports = {
  cadastrarReceita,
  cadastrarItemReceita
};
