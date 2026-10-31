import { defineStore } from 'pinia';
import { PainelService } from '@/services/painel';

export const usePainelStore = defineStore('painel', {
  state: () => ({
    painel: null,
    carregando: false,
    erro: null
  }),

  actions: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 30/10/2026 22:53
     * * OBJECTIVE: Buscar o painel na API, guardando um aviso quando a busca falha.
     */
    async carregar() {
      this.carregando = true;
      this.erro = null;
      try {
        this.painel = await PainelService.buscar();
      } catch (LErro) {
        this.painel = null;
        this.erro = 'Não foi possível carregar o painel.';
        throw LErro;
      } finally {
        this.carregando = false;
      }
    }
  }
});
