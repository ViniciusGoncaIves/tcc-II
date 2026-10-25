<template>
  <q-page padding>
    <div class="text-h5 text-primary">Olá, {{ LPrimeiroNome }}!</div>

    <q-card flat bordered class="q-mt-md">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-icon name="medication" size="48px" color="primary" />
        <div>
          <div class="text-subtitle1">Bem-vindo ao DoseCerta.</div>
          <div class="text-grey-7">
            Alertas de medicação pelo WhatsApp, a partir das receitas emitidas.
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from 'vue';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';

const LAutenticacao = useAutenticacaoStore();

const LPrimeiroNome = computed(
  () => LAutenticacao.usuario?.nome.split(' ')[0] || ''
);
</script>
