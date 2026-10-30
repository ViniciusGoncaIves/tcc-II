const controller = require('../controllers/whatsapp');
const { exigirAdministrador } = require('../middlewares/autenticacao');

module.exports = (app) => {
  app.get('/whatsapp', exigirAdministrador, controller.consultarSituacao);
  app.post(
    '/whatsapp/desconectar',
    exigirAdministrador,
    controller.desconectar
  );
};
