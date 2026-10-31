const controller = require('../controllers/painel');

module.exports = (app) => {
  app.get('/painel', controller.buscarPainel);
};
