const { autenticar } = require('../middlewares/autenticacao');
const autenticacaoRoute = require('./autenticacao');
const pacientesRoute = require('./pacientes');
const medicamentosRoute = require('./medicamentos');
const usuariosRoute = require('./usuarios');
const receitasRoute = require('./receitas');
const whatsappRoute = require('./whatsapp');
const painelRoute = require('./painel');

module.exports = (app) => {
  autenticacaoRoute(app);
  app.use(autenticar);
  pacientesRoute(app);
  medicamentosRoute(app);
  usuariosRoute(app);
  receitasRoute(app);
  whatsappRoute(app);
  painelRoute(app);
};
