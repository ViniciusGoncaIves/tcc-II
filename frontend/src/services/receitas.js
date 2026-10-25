import { api } from '@/boot/axios';

export const ReceitasService = {
  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 19:26
   * * OBJECTIVE: Buscar as receitas, das mais recentes para as mais antigas, filtrando pela situação e pelo paciente quando forem informados.
   */
  async listar(AFiltros) {
    const LResposta = await api.get('/receitas', { params: AFiltros });
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 19:26
   * * OBJECTIVE: Buscar uma receita com os itens e o resumo das doses de cada item.
   */
  async buscarPorId(AId) {
    const LResposta = await api.get(`/receitas/${AId}`);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 19:26
   * * OBJECTIVE: Emitir uma receita e devolver o registro criado com os itens.
   */
  async emitir(ADados) {
    const LResposta = await api.post('/receitas', ADados);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 19:26
   * * OBJECTIVE: Cancelar uma receita ativa e devolver a receita atualizada, com os itens.
   */
  async cancelar(AId) {
    const LResposta = await api.patch(`/receitas/${AId}/cancelar`);
    return LResposta.data;
  }
};
