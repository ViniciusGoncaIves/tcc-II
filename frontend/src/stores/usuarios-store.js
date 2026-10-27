import { defineStore } from 'pinia';
import { UsuariosService } from '@/services/usuarios';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:11
 * * OBJECTIVE: Deixar a lista em ordem alfabética, como a API devolve.
 */
function ordenarPorNome(ALista) {
  ALista.sort((APrimeiro, ASegundo) =>
    APrimeiro.nome.localeCompare(ASegundo.nome, 'pt-BR')
  );
}

// Guarda ativos e inativos: a tela filtra sem buscar de novo na API.
export const useUsuariosStore = defineStore('usuarios', {
  state: () => ({
    lista: [],
    carregando: false,
    erro: null
  }),

  actions: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:11
     * * OBJECTIVE: Buscar todos os usuários na API, guardando um aviso quando a busca falha.
     */
    async carregar() {
      this.carregando = true;
      this.erro = null;
      try {
        this.lista = await UsuariosService.listar();
      } catch (LErro) {
        this.lista = [];
        this.erro = 'Não foi possível carregar os usuários.';
        throw LErro;
      } finally {
        this.carregando = false;
      }
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:12
     * * OBJECTIVE: Trocar na lista o usuário que a API devolveu alterado.
     */
    substituirNaLista(AUsuario) {
      const LIndice = this.lista.findIndex(
        (ALinha) => ALinha.idusuario === AUsuario.idusuario
      );
      if (LIndice !== -1) {
        this.lista[LIndice] = AUsuario;
      }
      ordenarPorNome(this.lista);
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:12
     * * OBJECTIVE: Cadastrar um usuário e incluí-lo na lista.
     */
    async criar(ADados) {
      const LUsuario = await UsuariosService.criar(ADados);
      this.lista.push(LUsuario);
      ordenarPorNome(this.lista);
      return LUsuario;
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:12
     * * OBJECTIVE: Alterar nome, e-mail e perfil de um usuário e atualizar a lista.
     */
    async atualizar(AId, ADados) {
      const LUsuario = await UsuariosService.atualizar(AId, ADados);
      this.substituirNaLista(LUsuario);
      return LUsuario;
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:13
     * * OBJECTIVE: Definir uma nova senha provisória para o usuário, que deverá trocá-la no próximo acesso.
     */
    async redefinirSenha(AUsuario, ASenha) {
      // A API altera a senha pela mesma rota da edição, que exige nome e e-mail.
      const LUsuario = await UsuariosService.atualizar(AUsuario.idusuario, {
        nome: AUsuario.nome,
        email: AUsuario.email,
        tipo_usuario: AUsuario.tipo_usuario,
        senha: ASenha
      });
      this.substituirNaLista(LUsuario);
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:13
     * * OBJECTIVE: Inativar um usuário e atualizar a lista.
     */
    async inativar(AId) {
      this.substituirNaLista(await UsuariosService.inativar(AId));
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:13
     * * OBJECTIVE: Reativar um usuário e atualizar a lista.
     */
    async reativar(AId) {
      this.substituirNaLista(await UsuariosService.reativar(AId));
    }
  }
});
