const controller = require('../controllers/autenticacao');
const { validarLogin, validarNovaSenha } = require('../middlewares/validacao');
const { autenticarParaTrocarSenha } = require('../middlewares/autenticacao');

module.exports = (app) => {
  app.post('/login', validarLogin, controller.entrar);
  app.patch(
    '/usuarios/minha-senha',
    autenticarParaTrocarSenha,
    validarNovaSenha,
    controller.alterarMinhaSenha
  );
};
