import { defineStore } from 'pinia';
import { PacientesService } from '@/services/pacientes';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:58
 * * OBJECTIVE: Deixar a lista em ordem alfabética, como a API devolve.
 */
function ordenarPorNome(ALista) {
  ALista.sort((APrimeiro, ASegundo) =>
    APrimeiro.nome.localeCompare(ASegundo.nome, 'pt-BR')
  );
}

// A lista tem os pacientes ativos e os inativos: a tela filtra a situação
// sem uma nova busca. Depois de cada alteração, a lista é atualizada com o
// registro que a API devolve, também sem uma nova busca.
export const usePacientesStore = defineStore('pacientes', {
  state: () => ({
    lista: [],
    carregando: false,
    erro: null
  }),

  actions: {
    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 18:59
     * * OBJECTIVE: Buscar todos os pacientes na API, guardando um aviso quando a busca falha.
     */
    async carregar() {
      this.carregando = true;
      this.erro = null;
      try {
        this.lista = await PacientesService.listar();
      } catch (LErro) {
        this.lista = [];
        this.erro = 'Não foi possível carregar os pacientes.';
        throw LErro;
      } finally {
        this.carregando = false;
      }
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:00
     * * OBJECTIVE: Trocar na lista o paciente que a API devolveu alterado.
     */
    substituirNaLista(APaciente) {
      const LIndice = this.lista.findIndex(
        (ALinha) => ALinha.idpaciente === APaciente.idpaciente
      );
      if (LIndice !== -1) {
        this.lista[LIndice] = APaciente;
      }
      ordenarPorNome(this.lista);
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:01
     * * OBJECTIVE: Cadastrar um paciente e incluí-lo na lista.
     */
    async criar(ADados) {
      const LPaciente = await PacientesService.criar(ADados);
      this.lista.push(LPaciente);
      ordenarPorNome(this.lista);
      return LPaciente;
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:01
     * * OBJECTIVE: Alterar os dados de um paciente e atualizar a lista.
     */
    async atualizar(AId, ADados) {
      const LPaciente = await PacientesService.atualizar(AId, ADados);
      this.substituirNaLista(LPaciente);
      return LPaciente;
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:02
     * * OBJECTIVE: Inativar um paciente e atualizar a lista.
     */
    async inativar(AId) {
      this.substituirNaLista(await PacientesService.inativar(AId));
    },

    /**
     * * AUTHOR: Vinícius Gonçalves
     * * DATE: 25/10/2026 19:02
     * * OBJECTIVE: Reativar um paciente e atualizar a lista.
     */
    async reativar(AId) {
      this.substituirNaLista(await PacientesService.reativar(AId));
    }
  }
});
