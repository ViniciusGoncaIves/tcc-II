import { defineStore } from 'pinia';
import { ReceitasService } from '@/services/receitas';

// Opção do filtro de situação que traz as receitas de qualquer situação.
const TODAS = 'TODAS';

// As receitas nunca são apagadas, então a lista só cresce: cada troca de
// filtro busca na API só as receitas pedidas. Os filtros ficam guardados
// aqui para continuarem iguais ao voltar do detalhe para a lista.
export const useReceitasStore = defineStore('receitas', {
  state: () => ({
    lista: [],
    carregando: false,
    erro: null,
    filtros: { status: 'ATIVA', paciente: null },
    receita: null
  }),

  actions: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:28
     * * OBJECTIVE: Buscar na API as receitas dos filtros escolhidos, guardando um aviso quando a busca falha.
     */
    async carregar() {
      this.carregando = true;
      this.erro = null;
      try {
        this.lista = await ReceitasService.listar({
          status:
            this.filtros.status === TODAS ? undefined : this.filtros.status,
          idpaciente: this.filtros.paciente?.idpaciente
        });
      } catch (LErro) {
        this.lista = [];
        this.erro = 'Não foi possível carregar as receitas.';
        throw LErro;
      } finally {
        this.carregando = false;
      }
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:28
     * * OBJECTIVE: Buscar a receita aberta no detalhe, mantendo a que já está na tela enquanto ela é atualizada.
     */
    async carregarReceita(AId) {
      if (this.receita?.idreceita !== AId) {
        this.receita = null;
      }
      this.carregando = true;
      try {
        this.receita = await ReceitasService.buscarPorId(AId);
      } finally {
        this.carregando = false;
      }
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:28
     * * OBJECTIVE: Emitir uma receita e devolver o registro criado.
     */
    async emitir(ADados) {
      return ReceitasService.emitir(ADados);
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:29
     * * OBJECTIVE: Cancelar a receita aberta no detalhe e mostrar a situação nova que a API devolve.
     */
    async cancelar(AId) {
      this.receita = await ReceitasService.cancelar(AId);
    }
  }
});
