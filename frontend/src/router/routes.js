// meta.apenasSemLogin: só para quem não entrou (quem já entrou vai ao início).
// meta.semRestricao: abre com ou sem login.
// meta.apenasAdministrador: só para administradores (o operador vai ao início).
const routes = [
  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { apenasSemLogin: true }
  },
  {
    path: '/trocar-senha',
    component: () => import('@/pages/TrocarSenhaPage.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/InicioPage.vue') },
      {
        path: 'receitas',
        component: () => import('@/pages/ReceitasPage.vue')
      },
      {
        path: 'receitas/nova',
        component: () => import('@/pages/EmissaoReceitaPage.vue')
      },
      {
        path: 'receitas/:id',
        component: () => import('@/pages/DetalheReceitaPage.vue')
      },
      {
        path: 'pacientes',
        component: () => import('@/pages/CadastroPacientesPage.vue')
      },
      {
        path: 'medicamentos',
        component: () => import('@/pages/CadastroMedicamentosPage.vue')
      },
      {
        path: 'usuarios',
        component: () => import('@/pages/CadastroUsuariosPage.vue'),
        meta: { apenasAdministrador: true }
      }
    ]
  },

  // Sempre a última: qualquer endereço que não existe.
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
    meta: { semRestricao: true }
  }
];

export default routes;
