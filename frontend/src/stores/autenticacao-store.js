import { defineStore } from 'pinia';
import { AutenticacaoService } from '@/services/autenticacao';

// Token e dados básicos no sessionStorage, que se apaga ao fechar a aba.
const CHAVE_TOKEN = 'dosecerta_token';
const CHAVE_USUARIO = 'dosecerta_usuario';
const TIPO_ADMINISTRADOR = 'ADMIN';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:18
 * * OBJECTIVE: Ler do sessionStorage o usuário guardado no login, se houver.
 */
function lerUsuarioGuardado() {
  const LUsuario = sessionStorage.getItem(CHAVE_USUARIO);
  return LUsuario ? JSON.parse(LUsuario) : null;
}

export const useAutenticacaoStore = defineStore('autenticacao', {
  state: () => ({
    token: sessionStorage.getItem(CHAVE_TOKEN),
    usuario: lerUsuarioGuardado()
  }),

  getters: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:20
     * * OBJECTIVE: Informar se há um usuário logado.
     */
    estaLogado(AEstado) {
      return Boolean(AEstado.token);
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:21
     * * OBJECTIVE: Informar se o usuário logado é administrador.
     */
    ehAdministrador(AEstado) {
      return AEstado.usuario?.tipo_usuario === TIPO_ADMINISTRADOR;
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:22
     * * OBJECTIVE: Informar se o usuário precisa trocar a senha provisória antes de continuar.
     */
    precisaTrocarSenha(AEstado) {
      return AEstado.usuario?.trocar_senha === true;
    }
  },

  actions: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:24
     * * OBJECTIVE: Guardar o token e os dados básicos do usuário no estado e no sessionStorage.
     */
    guardarSessao(AToken, AUsuario) {
      this.token = AToken;
      this.usuario = AUsuario;
      sessionStorage.setItem(CHAVE_TOKEN, AToken);
      sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(AUsuario));
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:25
     * * OBJECTIVE: Fazer o login na API e guardar a sessão.
     */
    async entrar(AEmail, ASenha) {
      const LResultado = await AutenticacaoService.entrar(AEmail, ASenha);
      this.guardarSessao(LResultado.token, LResultado.usuario);
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:27
     * * OBJECTIVE: Trocar a senha na API e marcar no usuário guardado que ela já é definitiva.
     */
    async trocarSenha(ASenhaAtual, ANovaSenha) {
      const LUsuario = await AutenticacaoService.trocarSenha(
        ASenhaAtual,
        ANovaSenha
      );
      this.guardarSessao(this.token, {
        ...this.usuario,
        trocar_senha: LUsuario.trocar_senha
      });
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 20:13
     * * OBJECTIVE: Atualizar o nome e o e-mail guardados quando o usuário logado altera o próprio cadastro.
     */
    atualizarUsuarioLogado(AUsuario) {
      this.guardarSessao(this.token, {
        ...this.usuario,
        nome: AUsuario.nome,
        email: AUsuario.email
      });
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:28
     * * OBJECTIVE: Encerrar a sessão, apagando o token e os dados do usuário.
     */
    sair() {
      this.token = null;
      this.usuario = null;
      sessionStorage.removeItem(CHAVE_TOKEN);
      sessionStorage.removeItem(CHAVE_USUARIO);
    }
  }
});
