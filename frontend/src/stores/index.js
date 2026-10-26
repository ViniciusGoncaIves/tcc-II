import { defineStore } from '#q-app';
import { createPinia } from 'pinia';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 26/10/2026 19:28
 * * OBJECTIVE: Criar o Pinia, que guarda o estado das telas (login, listas e filtros).
 */
export default defineStore(() => {
  const LPinia = createPinia();
  return LPinia;
});
