const service = require('../services/receitas');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Emitir uma receita em nome do usuário logado e devolver a receita criada com os itens.
 */
async function emitirReceita(req, res) {
  const LReceita = await service.emitirReceita(req.body, req.usuario.idusuario);
  return res.status(201).json(LReceita);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:29
 * * OBJECTIVE: Devolver a lista de receitas, filtrada pela situação e pelo paciente quando os parâmetros forem enviados.
 */
async function buscarReceitas(req, res) {
  const LReceitas = await service.buscarReceitas({
    status: req.query.status || null,
    idpaciente: req.query.idpaciente || null
  });
  return res.status(200).json(LReceitas);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:31
 * * OBJECTIVE: Devolver a receita do id informado, com os itens e o resumo das doses, ou 404 quando ela não existe.
 */
async function buscarReceitaPorId(req, res) {
  const LReceita = await service.buscarReceitaPorId(req.params.id);
  if (!LReceita) {
    throw new ErroApi(
      404,
      `A receita com id ${req.params.id} não foi encontrada`
    );
  }
  return res.status(200).json(LReceita);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 21:32
 * * OBJECTIVE: Cancelar a receita do id informado em nome do usuário logado, ou devolver 404 quando ela não existe.
 */
async function cancelarReceita(req, res) {
  const LReceita = await service.cancelarReceita(
    req.params.id,
    req.usuario.idusuario
  );
  if (!LReceita) {
    throw new ErroApi(
      404,
      `A receita com id ${req.params.id} não foi encontrada`
    );
  }
  return res.status(200).json(LReceita);
}

module.exports = {
  emitirReceita,
  buscarReceitas,
  buscarReceitaPorId,
  cancelarReceita
};
