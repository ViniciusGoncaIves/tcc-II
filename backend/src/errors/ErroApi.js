/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 14:41
 * * OBJECTIVE: Representar um erro de requisição com o status HTTP e a mensagem devolvidos ao cliente.
 */
class ErroApi extends Error {
  constructor (AStatus, AMensagem) {
    super(AMensagem);
    this.status = AStatus;
  }
}

module.exports = ErroApi;
