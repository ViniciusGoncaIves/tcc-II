const controller = require('../controllers/autenticacao');
const { validarLogin, validarNovaSenha } = require('../middlewares/validacao');
const { autenticarParaTrocarSenha } = require('../middlewares/autenticacao');
const { limitarTentativasLogin } = require('../middlewares/limiteLogin');

module.exports = (app) => {
  app.post('/login', limitarTentativasLogin, validarLogin, controller.entrar);
  app.patch(
    '/usuarios/minha-senha',
    autenticarParaTrocarSenha,
    validarNovaSenha,
    controller.alterarMinhaSenha
  );
};
