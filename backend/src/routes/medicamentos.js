const controller = require('../controllers/medicamentos');
const { validarMedicamento } = require('../middlewares/validacao');

module.exports = (app) => {
  app.post(
    '/medicamentos',
    validarMedicamento,
    controller.cadastrarMedicamento
  );
};
