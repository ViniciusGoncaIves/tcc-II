const controller = require('../controllers/pacientes');
const { validarId, validarPaciente } = require('../middlewares/validacao');

module.exports = (app) => {
  app.get('/pacientes', controller.buscarPacientes);
  app.get('/pacientes/:id', validarId, controller.buscarPacientePorId);
  app.post('/pacientes', validarPaciente, controller.cadastrarPaciente);
  app.put(
    '/pacientes/:id',
    validarId,
    validarPaciente,
    controller.alterarPaciente
  );
};
