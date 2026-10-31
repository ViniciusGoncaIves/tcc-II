<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm">
      <div class="text-h5 text-primary">Olá, {{ LPrimeiroNome }}!</div>
      <q-space />
      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        label="Atualizar"
        :loading="LPainel.carregando"
        @click="carregar"
      />
    </div>

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

    <div
      v-if="!LDados && LPainel.carregando"
      class="row justify-center q-pa-xl"
    >
      <q-spinner color="primary" size="40px" />
    </div>

    <q-card v-else-if="!LDados" flat bordered class="q-mt-md">
      <q-card-section class="text-grey-7">{{ LPainel.erro }}</q-card-section>
    </q-card>

    <template v-else>
      <q-banner
        v-if="!LDados.whatsapp_conectado"
        rounded
        class="bg-orange-1 text-grey-9 q-mt-md"
      >
        <template #avatar>
          <q-icon name="warning" color="warning" />
        </template>
        O WhatsApp está desconectado: os alertas estão parados.
        <template v-if="!LAutenticacao.ehAdministrador">
          Avise um administrador.
        </template>
        <template v-if="LAutenticacao.ehAdministrador" #action>
          <q-btn flat no-caps color="primary" label="Conectar" to="/whatsapp" />
        </template>
      </q-banner>

      <div class="row q-col-gutter-md q-mt-none">
        <div
          v-for="LCartao in LCartoes"
          :key="LCartao.rotulo"
          class="col-6 col-md-3"
        >
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon :name="LCartao.icone" size="24px" color="primary" />
                <div class="text-h4">{{ LCartao.valor }}</div>
              </div>
              <div class="text-grey-7 q-mt-xs">{{ LCartao.rotulo }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="text-subtitle1 text-primary q-mt-lg q-mb-sm">
        Aguardando confirmação
      </div>

      <q-card flat bordered>
        <q-list v-if="LDados.doses_aguardando.length > 0" separator>
          <q-item
            v-for="LDose in LDados.doses_aguardando"
            :key="LDose.idalerta"
            clickable
            :to="`/receitas/${LDose.idreceita}`"
          >
            <q-item-section>
              <q-item-label>{{ LDose.nome_paciente }}</q-item-label>
              <q-item-label caption>
                {{ LDose.nome_medicamento }} ({{ LDose.dose }})
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>
                Envio {{ LDose.tentativas }} de {{ LDose.limite_tentativas }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-grey-7">
          Nenhuma dose aguardando confirmação.
        </q-card-section>
      </q-card>

      <div
        v-if="LDados.aguardando_confirmacao > LDados.doses_aguardando.length"
        class="text-caption text-grey-7 q-mt-sm"
      >
        Mostrando as {{ LDados.doses_aguardando.length }} mais antigas.
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { mostrarErro } from '@/boot/axios';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';
import { usePainelStore } from '@/stores/painel-store';

const LAutenticacao = useAutenticacaoStore();
const LPainel = usePainelStore();

const LPrimeiroNome = computed(
  () => LAutenticacao.usuario?.nome.split(' ')[0] || ''
);

const LDados = computed(() => LPainel.painel);

const LCartoes = computed(() => [
  {
    rotulo: 'Receitas ativas',
    icone: 'receipt_long',
    valor: LDados.value.receitas_ativas
  },
  {
    rotulo: 'Aguardando confirmação',
    icone: 'hourglass_empty',
    valor: LDados.value.aguardando_confirmacao
  },
  {
    rotulo: 'Confirmadas hoje',
    icone: 'check_circle',
    valor: LDados.value.confirmadas_hoje
  },
  {
    rotulo: 'Doses enviadas hoje',
    icone: 'send',
    valor: LDados.value.doses_enviadas_hoje
  }
]);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 30/10/2026 22:54
 * * OBJECTIVE: Buscar o painel, avisando o usuário quando a busca falha.
 */
async function carregar() {
  try {
    await LPainel.carregar();
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

onMounted(carregar);
</script>
