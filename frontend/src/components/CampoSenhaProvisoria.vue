<template>
  <q-input
    v-model="LSenha"
    outlined
    label="Senha provisória"
    autocomplete="off"
    hint="Pelo menos 8 caracteres. A pessoa troca essa senha no primeiro acesso."
    lazy-rules
    :rules="[
      (AValor) =>
        (!!AValor?.trim() && AValor.length >= TAMANHO_MINIMO_SENHA) ||
        'A senha deve ter pelo menos 8 caracteres.'
    ]"
  >
    <template #append>
      <q-btn
        flat
        dense
        no-caps
        color="primary"
        icon="autorenew"
        label="Gerar"
        @click="gerar"
      />
      <q-btn
        flat
        dense
        round
        color="primary"
        icon="content_copy"
        aria-label="Copiar senha"
        :disable="!LSenha"
        @click="copiar"
      >
        <q-tooltip>Copiar</q-tooltip>
      </q-btn>
    </template>
  </q-input>
</template>

<script setup>
import { copyToClipboard, useQuasar } from 'quasar';

// Mesmo mínimo da API.
const TAMANHO_MINIMO_SENHA = 8;
const TAMANHO_SENHA_GERADA = 10;
// Sem letras e números que se confundem ao ditar ou copiar à mão (0/O, 1/l/I).
const CARACTERES_SENHA =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

const LSenha = defineModel({ type: String, default: '' });

const LQuasar = useQuasar();

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:14
 * * OBJECTIVE: Gerar uma senha aleatória com o gerador seguro do navegador e colocá-la no campo.
 */
function gerar() {
  const LNumeros = crypto.getRandomValues(
    new Uint32Array(TAMANHO_SENHA_GERADA)
  );
  LSenha.value = Array.from(
    LNumeros,
    (ANumero) => CARACTERES_SENHA[ANumero % CARACTERES_SENHA.length]
  ).join('');
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:14
 * * OBJECTIVE: Copiar a senha para a área de transferência, para o administrador repassá-la à pessoa.
 */
async function copiar() {
  try {
    await copyToClipboard(LSenha.value);
    LQuasar.notify({ type: 'positive', message: 'Senha copiada.' });
  } catch {
    LQuasar.notify({
      type: 'warning',
      message: 'Não foi possível copiar. Selecione a senha e copie.'
    });
  }
}
</script>
