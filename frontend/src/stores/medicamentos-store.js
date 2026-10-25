import { defineStore } from 'pinia';
import { MedicamentosService } from '@/services/medicamentos';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:03
 * * OBJECTIVE: Deixar a lista em ordem alfabética, como a API devolve.
 */
function ordenarPorNome(ALista) {
  ALista.sort((APrimeiro, ASegundo) =>
    APrimeiro.nome.localeCompare(ASegundo.nome, 'pt-BR')
  );
}

// A lista tem os medicamentos ativos e os inativos: a tela filtra a situação
// sem uma nova busca. Depois de cada alteração, a lista é atualizada com o
// registro que a API devolve, também sem uma nova busca.
export const useMedicamentosStore = defineStore('medicamentos', {
  state: () => ({
    lista: [],
    carregando: false,
    erro: null
  }),

  actions: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:03
     * * OBJECTIVE: Buscar todos os medicamentos na API, guardando um aviso quando a busca falha.
     */
    async carregar() {
      this.carregando = true;
      this.erro = null;
      try {
        this.lista = await MedicamentosService.listar();
      } catch (LErro) {
        this.lista = [];
        this.erro = 'Não foi possível carregar os medicamentos.';
        throw LErro;
      } finally {
        this.carregando = false;
      }
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:04
     * * OBJECTIVE: Trocar na lista o medicamento que a API devolveu alterado.
     */
    substituirNaLista(AMedicamento) {
      const LIndice = this.lista.findIndex(
        (ALinha) => ALinha.idmedicamento === AMedicamento.idmedicamento
      );
      if (LIndice !== -1) {
        this.lista[LIndice] = AMedicamento;
      }
      ordenarPorNome(this.lista);
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:04
     * * OBJECTIVE: Cadastrar um medicamento e incluí-lo na lista.
     */
    async criar(ADados) {
      const LMedicamento = await MedicamentosService.criar(ADados);
      this.lista.push(LMedicamento);
      ordenarPorNome(this.lista);
      return LMedicamento;
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:05
     * * OBJECTIVE: Alterar o nome e a descrição de um medicamento e atualizar a lista.
     */
    async atualizar(AId, ADados) {
      const LMedicamento = await MedicamentosService.atualizar(AId, ADados);
      this.substituirNaLista(LMedicamento);
      return LMedicamento;
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:05
     * * OBJECTIVE: Inativar um medicamento e atualizar a lista.
     */
    async inativar(AId) {
      this.substituirNaLista(await MedicamentosService.inativar(AId));
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:06
     * * OBJECTIVE: Reativar um medicamento e atualizar a lista.
     */
    async reativar(AId) {
      this.substituirNaLista(await MedicamentosService.reativar(AId));
    }
  }
});
