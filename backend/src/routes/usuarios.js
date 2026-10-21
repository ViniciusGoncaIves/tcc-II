const controller = require('../controllers/usuarios');
const { exigirAdministrador } = require('../middlewares/autenticacao');
const {
  validarId,
  validarFiltroAtivo,
  validarCadastroUsuario,
  validarAlteracaoUsuario
} = require('../middlewares/validacao');

module.exports = (app) => {
  app.get(
    '/usuarios',
    exigirAdministrador,
    validarFiltroAtivo,
    controller.buscarUsuarios
  );
  app.get(
    '/usuarios/:id',
    exigirAdministrador,
    validarId,
    controller.buscarUsuarioPorId
  );
  app.post(
    '/usuarios',
    exigirAdministrador,
    validarCadastroUsuario,
    controller.cadastrarUsuario
  );
  app.put(
    '/usuarios/:id',
    exigirAdministrador,
    validarId,
    validarAlteracaoUsuario,
    controller.alterarUsuario
  );
  app.delete(
    '/usuarios/:id',
    exigirAdministrador,
    validarId,
    controller.inativarUsuario
  );
  app.patch(
    '/usuarios/:id/reativar',
    exigirAdministrador,
    validarId,
    controller.reativarUsuario
  );
};
