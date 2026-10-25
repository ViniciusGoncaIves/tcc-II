// meta.apenasSemLogin: só para quem não entrou (quem já entrou vai ao início).
// meta.semRestricao: abre com ou sem login.
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
        path: 'pacientes',
        component: () => import('@/pages/CadastroPacientesPage.vue')
      },
      {
        path: 'medicamentos',
        component: () => import('@/pages/CadastroMedicamentosPage.vue')
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
