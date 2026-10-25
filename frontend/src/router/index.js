import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';

import routes from './routes.js';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:29
 * * OBJECTIVE: Decidir para onde o usuário pode ir, conforme o login, a senha provisória e o perfil.
 */
function conferirAcesso(ADestino, AAutenticacao) {
  if (ADestino.meta.semRestricao) {
    return true;
  }
  if (ADestino.meta.apenasSemLogin) {
    return AAutenticacao.estaLogado ? '/' : true;
  }
  if (!AAutenticacao.estaLogado) {
    return '/login';
  }
  if (AAutenticacao.precisaTrocarSenha && ADestino.path !== '/trocar-senha') {
    return '/trocar-senha';
  }
  if (ADestino.meta.apenasAdministrador && !AAutenticacao.ehAdministrador) {
    return '/';
  }
  return true;
}

export default defineRouter(({ store }) => {
  const LCriarHistorico = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const LRouter = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // O modo e o caminho base vêm do quasar.config.js (build).
    history: LCriarHistorico(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  });

  const LAutenticacao = useAutenticacaoStore(store);
  LRouter.beforeEach((ADestino) => conferirAcesso(ADestino, LAutenticacao));

  return LRouter;
});
