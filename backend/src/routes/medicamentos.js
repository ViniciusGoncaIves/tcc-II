const controller = require('../controllers/medicamentos');
const {
  validarId,
  validarFiltroAtivo,
  validarMedicamento
} = require('../middlewares/validacao');

module.exports = (app) => {
  app.get('/medicamentos', validarFiltroAtivo, controller.buscarMedicamentos);
  app.get('/medicamentos/:id', validarId, controller.buscarMedicamentoPorId);
  app.post(
    '/medicamentos',
    validarMedicamento,
    controller.cadastrarMedicamento
  );
  app.put(
    '/medicamentos/:id',
    validarId,
    validarMedicamento,
    controller.alterarMedicamento
  );
  app.delete('/medicamentos/:id', validarId, controller.inativarMedicamento);
  app.patch(
    '/medicamentos/:id/reativar',
    validarId,
    controller.reativarMedicamento
  );
};
