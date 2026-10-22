const controller = require('../controllers/receitas');
const {
  validarId,
  validarReceita,
  validarFiltrosReceita
} = require('../middlewares/validacao');

module.exports = (app) => {
  app.get('/receitas', validarFiltrosReceita, controller.buscarReceitas);
  app.get('/receitas/:id', validarId, controller.buscarReceitaPorId);
  app.post('/receitas', validarReceita, controller.emitirReceita);
  app.patch('/receitas/:id/cancelar', validarId, controller.cancelarReceita);
};
