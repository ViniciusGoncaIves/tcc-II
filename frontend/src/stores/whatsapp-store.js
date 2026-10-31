import { defineStore } from 'pinia';
import { WhatsappService } from '@/services/whatsapp';

export const useWhatsappStore = defineStore('whatsapp', {
  state: () => ({
    conexao: null,
    erro: null
  }),

  actions: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 30/10/2026 21:16
     * * OBJECTIVE: Buscar a situação da conexão; se a busca falhar, tira a situação antiga da tela e guarda um aviso, sem repetir notificações a cada consulta.
     */
    async carregar() {
      try {
        this.conexao = await WhatsappService.consultar();
        this.erro = null;
      } catch {
        this.conexao = null;
        this.erro = 'Não foi possível consultar a conexão do WhatsApp.';
      }
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 30/10/2026 21:17
     * * OBJECTIVE: Desconectar o número atual e mostrar a situação nova que a API devolve.
     */
    async desconectar() {
      this.conexao = await WhatsappService.desconectar();
    }
  }
});
