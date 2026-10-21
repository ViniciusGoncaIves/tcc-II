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
};
