import { defineBoot } from '#q-app';
import axios from 'axios';
import { Notify } from 'quasar';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';

const MENSAGEM_SENHA_PROVISORIA =
  'é necessário redefinir a senha antes de continuar';

// Conexão com a API. O endereço vem do .env (QCLI_API_URL).
const api = axios.create({
  baseURL: import.meta.env.QCLI_API_URL
});

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:09
 * * OBJECTIVE: Montar a mensagem de erro para o usuário a partir da resposta da API.
 */
function extrairMensagemErro(AErro) {
  if (!AErro.response) {
    return 'Não foi possível conectar ao servidor. Tente novamente.';
  }
  const LMensagem = AErro.response.data?.erro || 'ocorreu um erro inesperado';
  return LMensagem.charAt(0).toUpperCase() + LMensagem.slice(1);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:11
 * * OBJECTIVE: Ligar a conexão com a API ao login: enviar o token em toda requisição e tratar os erros de acesso.
 */
export default defineBoot(({ router, store }) => {
  const LAutenticacao = useAutenticacaoStore(store);

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:12
   * * OBJECTIVE: Acrescentar o token do usuário logado no cabeçalho de cada requisição.
   */
  function adicionarToken(AConfiguracao) {
    if (LAutenticacao.token) {
      AConfiguracao.headers.Authorization = `Bearer ${LAutenticacao.token}`;
    }
    return AConfiguracao;
  }

  /**
   * * AUTHOR: Vinícius Gonçalves
   * * DATE: 25/10/2026 18:14
   * * OBJECTIVE: Tratar os erros de acesso: sessão vencida volta ao login e senha provisória leva à troca de senha.
   */
  function tratarErroAcesso(AErro) {
    const LStatus = AErro.response?.status;
    if (LStatus === 401 && LAutenticacao.estaLogado) {
      AErro.tratado = true;
      LAutenticacao.sair();
      Notify.create({
        type: 'warning',
        message: 'Sua sessão expirou. Entre novamente.'
      });
      router.push('/login');
    } else if (
      LStatus === 403 &&
      AErro.response.data?.erro === MENSAGEM_SENHA_PROVISORIA
    ) {
      AErro.tratado = true;
      router.push('/trocar-senha');
    }
    return Promise.reject(AErro);
  }

  api.interceptors.request.use(adicionarToken);
  api.interceptors.response.use(null, tratarErroAcesso);
});

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:38
 * * OBJECTIVE: Mostrar ao usuário o erro de uma requisição, menos os que a conexão já tratou (sessão vencida e senha provisória).
 */
function mostrarErro(AErro) {
  if (AErro.tratado) {
    return;
  }
  Notify.create({ type: 'negative', message: extrairMensagemErro(AErro) });
}

export { api, mostrarErro };
