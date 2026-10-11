const controller = require('../controllers/pacientes');

module.exports = (app) => {
  app.get('/pacientes', controller.buscarPacientes)
  app.get('/pacientes/:id([0-9a-fA-F-]{36})', controller.buscarPacientePorId)
  app.post('/pacientes', controller.cadastrarPaciente)
};
