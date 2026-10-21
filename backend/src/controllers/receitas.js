const service = require('../services/receitas');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Emitir uma receita em nome do usuário logado e devolver a receita criada com os itens.
 */
async function emitirReceita(req, res) {
  const LReceita = await service.emitirReceita(req.body, req.usuario.idusuario);
  return res.status(201).json(LReceita);
}

module.exports = {
  emitirReceita
};
