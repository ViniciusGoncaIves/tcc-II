const controller = require('../controllers/pacientes');
const { validarId } = require('../middlewares/validacao');

module.exports = (app) => {
  app.get('/pacientes', controller.buscarPacientes)
  app.get('/pacientes/:id', validarId, controller.buscarPacientePorId)
  app.post('/pacientes', controller.cadastrarPaciente)
};
