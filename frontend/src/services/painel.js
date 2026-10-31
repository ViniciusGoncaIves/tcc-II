import { api } from '@/boot/axios';

export const PainelService = {
  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 30/10/2026 22:51
   * * OBJECTIVE: Buscar os números do dia, a situação do WhatsApp e as doses que esperam confirmação.
   */
  async buscar() {
    const LResposta = await api.get('/painel');
    return LResposta.data;
  }
};
