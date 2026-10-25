import { api } from '@/boot/axios';

export const UsuariosService = {
  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 20:10
   * * OBJECTIVE: Buscar os usuários em ordem alfabética, filtrando pela situação quando ela for informada.
   */
  async listar(AAtivo) {
    const LResposta = await api.get('/usuarios', {
      params: { ativo: AAtivo }
    });
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 20:10
   * * OBJECTIVE: Buscar um usuário pelo id.
   */
  async buscarPorId(AId) {
    const LResposta = await api.get(`/usuarios/${AId}`);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 20:10
   * * OBJECTIVE: Cadastrar um usuário com senha provisória e devolver o registro criado.
   */
  async criar(ADados) {
    const LResposta = await api.post('/usuarios', ADados);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 20:10
   * * OBJECTIVE: Alterar um usuário e devolver o registro alterado; com senha, ela passa a ser provisória.
   */
  async atualizar(AId, ADados) {
    const LResposta = await api.put(`/usuarios/${AId}`, ADados);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 20:11
   * * OBJECTIVE: Inativar um usuário, sem apagar o registro, e devolver o registro alterado.
   */
  async inativar(AId) {
    const LResposta = await api.delete(`/usuarios/${AId}`);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 20:11
   * * OBJECTIVE: Reativar um usuário inativado e devolver o registro alterado.
   */
  async reativar(AId) {
    const LResposta = await api.patch(`/usuarios/${AId}/reativar`);
    return LResposta.data;
  }
};
