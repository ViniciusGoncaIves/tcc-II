import { api } from '@/boot/axios';

export const PacientesService = {
  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:52
   * * OBJECTIVE: Buscar os pacientes em ordem alfabética, filtrando pela situação quando ela for informada.
   */
  async listar(AAtivo) {
    const LResposta = await api.get('/pacientes', {
      params: { ativo: AAtivo }
    });
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:52
   * * OBJECTIVE: Buscar um paciente pelo id.
   */
  async buscarPorId(AId) {
    const LResposta = await api.get(`/pacientes/${AId}`);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:53
   * * OBJECTIVE: Cadastrar um paciente e devolver o registro criado.
   */
  async criar(ADados) {
    const LResposta = await api.post('/pacientes', ADados);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:53
   * * OBJECTIVE: Alterar os dados de um paciente e devolver o registro alterado.
   */
  async atualizar(AId, ADados) {
    const LResposta = await api.put(`/pacientes/${AId}`, ADados);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:54
   * * OBJECTIVE: Inativar um paciente, sem apagar o registro, e devolver o registro alterado.
   */
  async inativar(AId) {
    const LResposta = await api.delete(`/pacientes/${AId}`);
    return LResposta.data;
  },

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:54
   * * OBJECTIVE: Reativar um paciente inativado e devolver o registro alterado.
   */
  async reativar(AId) {
    const LResposta = await api.patch(`/pacientes/${AId}/reativar`);
    return LResposta.data;
  }
};
