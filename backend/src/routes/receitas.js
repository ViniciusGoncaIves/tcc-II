const controller = require('../controllers/receitas');
const { validarReceita } = require('../middlewares/validacao');

module.exports = (app) => {
  app.post('/receitas', validarReceita, controller.emitirReceita);
};
