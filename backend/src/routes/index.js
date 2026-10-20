const pacientesRoute = require('./pacientes');
const medicamentosRoute = require('./medicamentos');

module.exports = (app) => {
  pacientesRoute(app);
  medicamentosRoute(app);
};
