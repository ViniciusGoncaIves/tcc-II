import { api } from '@/boot/axios';

export const AutenticacaoService = {
  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:15
   * * OBJECTIVE: Enviar e-mail e senha à API e devolver o token com os dados do usuário.
   */
  async entrar(AEmail, ASenha) {
    const LResposta = await api.post('/login', {
      email: AEmail,
      senha: ASenha
    });
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:17
   * * OBJECTIVE: Trocar a senha do usuário logado e devolver os dados atualizados dele.
   */
  async trocarSenha(ASenhaAtual, ANovaSenha) {
    const LResposta = await api.patch('/usuarios/minha-senha', {
      senha_atual: ASenhaAtual,
      nova_senha: ANovaSenha
    });
    return LResposta.data;
  }
};
