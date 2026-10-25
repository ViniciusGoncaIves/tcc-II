<template>
  <q-layout view="hHh Lpr lFf" class="bg-grey-1">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="alternarMenu"
        />

        <q-toolbar-title>DoseCerta</q-toolbar-title>

        <div class="q-mr-sm gt-xs">{{ LAutenticacao.usuario?.nome }}</div>

        <q-btn flat dense no-caps icon="logout" label="Sair" @click="sair" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="LMenuAberto" show-if-above bordered>
      <q-list>
        <q-item-label header>Menu</q-item-label>

        <EssentialLink
          v-for="LItem in ITENS_MENU"
          :key="LItem.to"
          v-bind="LItem"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import EssentialLink from '@/components/EssentialLink.vue';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';

const ITENS_MENU = [
  { titulo: 'Início', icone: 'home', to: '/' },
  { titulo: 'Receitas', icone: 'receipt_long', to: '/receitas' },
  { titulo: 'Pacientes', icone: 'people', to: '/pacientes' },
  { titulo: 'Medicamentos', icone: 'medication', to: '/medicamentos' }
];

const LQuasar = useQuasar();
const LRouter = useRouter();
const LAutenticacao = useAutenticacaoStore();
const LMenuAberto = ref(false);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:30
 * * OBJECTIVE: Abrir ou fechar o menu lateral.
 */
function alternarMenu() {
  LMenuAberto.value = !LMenuAberto.value;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:31
 * * OBJECTIVE: Pedir confirmação e encerrar a sessão, voltando ao login.
 */
function sair() {
  LQuasar.dialog({
    title: 'Sair',
    message: 'Deseja sair do DoseCerta?',
    ok: { label: 'Sair', color: 'primary', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', color: 'primary', flat: true, noCaps: true },
    persistent: true
  }).onOk(() => {
    LAutenticacao.sair();
    LRouter.push('/login');
  });
}
</script>
