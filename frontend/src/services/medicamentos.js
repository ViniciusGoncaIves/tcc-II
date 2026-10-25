import { api } from '@/boot/axios';

export const MedicamentosService = {
  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:55
   * * OBJECTIVE: Buscar os medicamentos em ordem alfabética, filtrando pela situação quando ela for informada.
   */
  async listar(AAtivo) {
    const LResposta = await api.get('/medicamentos', {
      params: { ativo: AAtivo }
    });
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:55
   * * OBJECTIVE: Buscar um medicamento pelo id.
   */
  async buscarPorId(AId) {
    const LResposta = await api.get(`/medicamentos/${AId}`);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:56
   * * OBJECTIVE: Cadastrar um medicamento e devolver o registro criado.
   */
  async criar(ADados) {
    const LResposta = await api.post('/medicamentos', ADados);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:56
   * * OBJECTIVE: Alterar o nome e a descrição de um medicamento e devolver o registro alterado.
   */
  async atualizar(AId, ADados) {
    const LResposta = await api.put(`/medicamentos/${AId}`, ADados);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:57
   * * OBJECTIVE: Inativar um medicamento, sem apagar o registro, e devolver o registro alterado.
   */
  async inativar(AId) {
    const LResposta = await api.delete(`/medicamentos/${AId}`);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:57
   * * OBJECTIVE: Reativar um medicamento inativado e devolver o registro alterado.
   */
  async reativar(AId) {
    const LResposta = await api.patch(`/medicamentos/${AId}/reativar`);
    return LResposta.data;
  }
};
