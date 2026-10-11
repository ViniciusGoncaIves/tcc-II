const pacientesRoute = require('./pacientes');

module.exports = (app) => {
  pacientesRoute(app);
};
