const controller = require('../controllers/pacientes');
const {
  validarId,
  validarPaciente,
  validarFiltroAtivo
} = require('../middlewares/validacao');

module.exports = (app) => {
  app.get('/pacientes', validarFiltroAtivo, controller.buscarPacientes);
  app.get('/pacientes/:id', validarId, controller.buscarPacientePorId);
  app.post('/pacientes', validarPaciente, controller.cadastrarPaciente);
  app.put(
    '/pacientes/:id',
    validarId,
    validarPaciente,
    controller.alterarPaciente
  );
  app.delete('/pacientes/:id', validarId, controller.inativarPaciente);
  app.patch('/pacientes/:id/reativar', validarId, controller.reativarPaciente);
};
