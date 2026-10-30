const db = require('../configs');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:34
 * * OBJECTIVE: Guardar a enquete enviada, com o conteúdo necessário para decifrar os votos que chegarem depois.
 */
async function cadastrarEnquete(ADados) {
  const LSql = `INSERT INTO ENQUETE_WHATSAPP (ID_MENSAGEM, TIPO, IDPACIENTE,
                                             IDALERTA, DESTINO, CONTEUDO)
                VALUES ($1, $2, $3, $4, $5, $6)`;
  await db.query(LSql, [
    ADados.id_mensagem,
    ADados.tipo,
    ADados.idpaciente,
    ADados.idalerta,
    ADados.destino,
    ADados.conteudo
  ]);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:35
 * * OBJECTIVE: Consultar a enquete pelo id da mensagem do WhatsApp.
 */
async function buscarEnquetePorMensagem(AIdMensagem) {
  const LSql = `SELECT ENQUETE_WHATSAPP.IDENQUETE,
                       ENQUETE_WHATSAPP.ID_MENSAGEM,
                       ENQUETE_WHATSAPP.TIPO,
                       ENQUETE_WHATSAPP.IDPACIENTE,
                       ENQUETE_WHATSAPP.IDALERTA,
                       ENQUETE_WHATSAPP.DESTINO,
                       ENQUETE_WHATSAPP.CONTEUDO
                  FROM ENQUETE_WHATSAPP
                 WHERE ENQUETE_WHATSAPP.ID_MENSAGEM = $1`;
  const LResultado = await db.query(LSql, [AIdMensagem]);
  return LResultado.rows[0];
}

module.exports = {
  cadastrarEnquete,
  buscarEnquetePorMensagem
};
