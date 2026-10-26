<template>
  <q-layout>
    <q-page-container>
      <q-page class="bg-green-1 row items-center justify-center q-pa-md">
        <div class="col-12 col-sm-7 col-md-5 col-lg-4">
          <q-card flat bordered class="q-pa-md">
            <q-card-section class="text-center">
              <q-icon name="medication" size="56px" color="primary" />
              <div class="text-h5 text-primary q-mt-sm">DoseCerta</div>
              <div class="text-grey-7">Alertas de medicação pelo WhatsApp</div>
            </q-card-section>

            <q-form @submit="entrar">
              <q-card-section class="q-gutter-md">
                <q-input
                  v-model="LEmail"
                  outlined
                  inputmode="email"
                  label="E-mail"
                  autocomplete="username"
                  lazy-rules
                  :rules="[
                    (AValor) => !!AValor?.trim() || 'Informe o e-mail.',
                    (AValor) =>
                      FORMATO_EMAIL.test(AValor.trim()) ||
                      'Informe um e-mail válido.'
                  ]"
                >
                  <template #prepend>
                    <q-icon name="mail" />
                  </template>
                </q-input>

                <q-input
                  v-model="LSenha"
                  outlined
                  :type="LMostrarSenha ? 'text' : 'password'"
                  label="Senha"
                  autocomplete="current-password"
                  lazy-rules
                  :rules="[(AValor) => !!AValor || 'Informe a senha.']"
                >
                  <template #prepend>
                    <q-icon name="lock" />
                  </template>
                  <template #append>
                    <q-icon
                      :name="LMostrarSenha ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="LMostrarSenha = !LMostrarSenha"
                    />
                  </template>
                </q-input>
              </q-card-section>

              <q-card-actions class="q-px-md">
                <q-btn
                  type="submit"
                  label="Entrar"
                  color="primary"
                  unelevated
                  no-caps
                  class="full-width"
                  :loading="LCarregando"
                />
              </q-card-actions>
            </q-form>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { mostrarErro } from '@/boot/axios';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';

// Mesmo formato que a API confere no cadastro de usuários.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LRouter = useRouter();
const LAutenticacao = useAutenticacaoStore();

const LEmail = ref('');
const LSenha = ref('');
const LMostrarSenha = ref(false);
const LCarregando = ref(false);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:32
 * * OBJECTIVE: Fazer o login e levar o usuário ao início ou à troca da senha provisória.
 */
async function entrar() {
  LCarregando.value = true;
  try {
    await LAutenticacao.entrar(LEmail.value, LSenha.value);
    LRouter.push(LAutenticacao.precisaTrocarSenha ? '/trocar-senha' : '/');
  } catch (LErro) {
    mostrarErro(LErro);
  } finally {
    LCarregando.value = false;
  }
}
</script>
