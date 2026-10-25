<template>
  <q-layout>
    <q-page-container>
      <q-page class="bg-green-1 row items-center justify-center q-pa-md">
        <div class="col-12 col-sm-7 col-md-5 col-lg-4">
          <q-card flat bordered class="q-pa-md">
            <q-card-section>
              <div class="text-h6 text-primary">Trocar senha</div>

              <q-banner
                v-if="LAutenticacao.precisaTrocarSenha"
                rounded
                class="bg-green-1 text-grey-9 q-mt-md"
              >
                <template #avatar>
                  <q-icon name="info" color="primary" />
                </template>
                Sua senha é provisória. Para continuar, defina uma nova senha.
              </q-banner>
            </q-card-section>

            <q-form @submit="salvar">
              <q-card-section class="q-gutter-md">
                <q-input
                  v-model="LSenhaAtual"
                  outlined
                  type="password"
                  label="Senha atual"
                  autocomplete="current-password"
                  lazy-rules
                  :rules="[(AValor) => !!AValor || 'Informe a senha atual.']"
                />

                <q-input
                  v-model="LNovaSenha"
                  outlined
                  type="password"
                  label="Nova senha"
                  autocomplete="new-password"
                  hint="Pelo menos 8 caracteres."
                  lazy-rules
                  :rules="[
                    (AValor) =>
                      AValor.length >= TAMANHO_MINIMO_SENHA ||
                      'A nova senha deve ter pelo menos 8 caracteres.'
                  ]"
                />

                <q-input
                  v-model="LConfirmacao"
                  outlined
                  type="password"
                  label="Confirme a nova senha"
                  autocomplete="new-password"
                  lazy-rules
                  :rules="[
                    (AValor) =>
                      AValor === LNovaSenha || 'As senhas não conferem.'
                  ]"
                />
              </q-card-section>

              <q-card-actions align="right" class="q-px-md">
                <q-btn
                  v-if="LAutenticacao.precisaTrocarSenha"
                  flat
                  no-caps
                  color="primary"
                  label="Sair"
                  @click="sair"
                />
                <q-btn
                  v-else
                  flat
                  no-caps
                  color="primary"
                  label="Voltar"
                  to="/"
                />

                <q-btn
                  type="submit"
                  unelevated
                  no-caps
                  color="primary"
                  label="Salvar"
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
import { useQuasar } from 'quasar';
import { mostrarErro } from '@/boot/axios';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';

const TAMANHO_MINIMO_SENHA = 8;

const LQuasar = useQuasar();
const LRouter = useRouter();
const LAutenticacao = useAutenticacaoStore();

const LSenhaAtual = ref('');
const LNovaSenha = ref('');
const LConfirmacao = ref('');
const LCarregando = ref(false);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:33
 * * OBJECTIVE: Enviar a troca de senha à API e, com sucesso, levar o usuário ao início.
 */
async function salvar() {
  LCarregando.value = true;
  try {
    await LAutenticacao.trocarSenha(LSenhaAtual.value, LNovaSenha.value);
    LQuasar.notify({
      type: 'positive',
      message: 'Senha alterada com sucesso.'
    });
    LRouter.push('/');
  } catch (LErro) {
    mostrarErro(LErro);
  } finally {
    LCarregando.value = false;
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 18:34
 * * OBJECTIVE: Sair sem trocar a senha, voltando ao login.
 */
function sair() {
  LAutenticacao.sair();
  LRouter.push('/login');
}
</script>
