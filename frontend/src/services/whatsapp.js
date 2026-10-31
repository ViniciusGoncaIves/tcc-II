import { api } from '@/boot/axios';

export const WhatsappService = {
  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 30/10/2026 21:14
   * * OBJECTIVE: Buscar o modo, a situação da conexão, o número conectado e, enquanto espera a leitura, o QR code.
   */
  async consultar() {
    const LResposta = await api.get('/whatsapp');
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 30/10/2026 21:15
   * * OBJECTIVE: Desconectar o número atual e devolver a nova situação da conexão.
   */
  async desconectar() {
    const LResposta = await api.post('/whatsapp/desconectar');
    return LResposta.data;
  }
};
