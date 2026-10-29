<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="primary"
        aria-label="Voltar"
        to="/receitas"
      />
      <div class="text-h5 text-primary">Receita</div>
      <q-badge
        v-if="LReceita"
        :color="SITUACOES_RECEITA[LReceita.status].cor"
        :label="SITUACOES_RECEITA[LReceita.status].rotulo"
      />
      <q-space />
      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        label="Atualizar"
        :loading="LReceitas.carregando"
        @click="carregarReceita(LRota.params.id)"
      />
      <q-btn
        v-if="LReceita?.status === 'ATIVA'"
        outline
        no-caps
        color="negative"
        icon="block"
        label="Cancelar receita"
        @click="cancelar"
      />
    </div>

    <div
      v-if="!LReceita && LReceitas.carregando"
      class="row justify-center q-pa-xl"
    >
      <q-spinner color="primary" size="40px" />
    </div>

    <q-card v-else-if="!LReceita" flat bordered>
      <q-card-section class="text-grey-7">
        Não foi possível carregar a receita.
      </q-card-section>
    </q-card>

    <template v-else>
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="row q-col-gutter-md">
          <div
            v-for="LInformacao in LInformacoes"
            :key="LInformacao.rotulo"
            class="col-12 col-sm-6 col-md-3"
          >
            <div class="text-caption text-grey-7">
              {{ LInformacao.rotulo }}
            </div>
            <div>{{ LInformacao.valor }}</div>
          </div>
        </q-card-section>
      </q-card>

      <div class="text-subtitle1 text-primary q-mb-sm">Medicamentos</div>

      <div class="row q-col-gutter-md">
        <div
          v-for="LItem in LReceita.itens"
          :key="LItem.iditensreceita"
          class="col-12 col-md-6"
        >
          <q-card flat bordered class="full-height">
            <q-card-section class="row items-start no-wrap q-gutter-sm">
              <div class="col">
                <div class="text-subtitle1">{{ LItem.nome_medicamento }}</div>
                <div class="text-grey-7">
                  {{ LItem.dose }}, a cada {{ LItem.intervalo_horas }} h,
                  durante {{ LItem.duracao_dias }}
                  {{ LItem.duracao_dias === 1 ? 'dia' : 'dias' }}
                </div>
              </div>
              <q-badge
                :color="SITUACOES_ITEM[LItem.status].cor"
                :label="SITUACOES_ITEM[LItem.status].rotulo"
              />
            </q-card-section>

            <q-separator />

            <q-list dense class="q-py-sm">
              <q-item
                v-for="LLinha in descreverItem(LItem)"
                :key="LLinha.rotulo"
              >
                <q-item-section>
                  <q-item-label caption>{{ LLinha.rotulo }}</q-item-label>
                  <q-item-label>{{ LLinha.valor }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { mostrarErro } from '@/boot/axios';
import { useReceitasStore } from '@/stores/receitas-store';
import { SITUACOES_RECEITA, formatarDataHora } from '@/utils/receitas';

const SITUACOES_ITEM = {
  AGUARDANDO_CONFIRMACAO: { rotulo: 'Aguardando confirmação', cor: 'warning' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', cor: 'positive' },
  CONCLUIDO: { rotulo: 'Concluído', cor: 'info' },
  CANCELADO: { rotulo: 'Cancelado', cor: 'grey-6' }
};

const CONFLITO = 409;

const LQuasar = useQuasar();
const LRota = useRoute();
const LReceitas = useReceitasStore();

const LReceita = computed(() => LReceitas.receita);

const LInformacoes = computed(() => {
  const LDados = LReceita.value;
  const LLinhas = [
    { rotulo: 'Paciente', valor: LDados.nome_paciente },
    { rotulo: 'Emitida em', valor: formatarDataHora(LDados.data_emissao) },
    { rotulo: 'Emitida por', valor: LDados.nome_emissor }
  ];
  if (LDados.status === 'CANCELADA') {
    LLinhas.push(
      {
        rotulo: 'Cancelada em',
        valor: formatarDataHora(LDados.data_cancelamento)
      },
      {
        rotulo: 'Cancelada por',
        valor:
          LDados.nome_usuario_cancelamento ||
          'Sistema (primeira dose não confirmada)'
      }
    );
  }
  if (LDados.observacao) {
    LLinhas.push({ rotulo: 'Observação', valor: LDados.observacao });
  }
  return LLinhas;
});

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:34
 * * OBJECTIVE: Descrever em texto a situação da primeira dose do item, que é a que o paciente precisa confirmar.
 */
function descreverPrimeiraDose(AItem) {
  const LEnvios = AItem.envios_primeira_dose;
  switch (AItem.status_primeira_dose) {
    case 'PENDENTE':
      return 'Aguardando envio';
    case 'ENVIADO':
      return `Enviada ${LEnvios} ${LEnvios === 1 ? 'vez' : 'vezes'}, aguardando a confirmação do paciente`;
    case 'CONFIRMADO':
      return `Confirmada em ${formatarDataHora(AItem.horario_confirmacao)}`;
    case 'EXPIRADO':
      return 'Expirou sem confirmação';
    default:
      return 'Cancelada';
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:34
 * * OBJECTIVE: Montar o resumo das doses do item: primeira dose, doses enviadas, doses expiradas (só quando houver), próxima dose e término previsto.
 */
function descreverItem(AItem) {
  const LLinhas = [
    { rotulo: 'Primeira dose', valor: descreverPrimeiraDose(AItem) },
    {
      rotulo: 'Doses enviadas',
      valor: `${AItem.doses_enviadas} de ${AItem.quantidade_alerta}`
    }
  ];
  if (AItem.doses_expiradas > 0) {
    LLinhas.push({
      rotulo: 'Doses expiradas',
      valor: String(AItem.doses_expiradas)
    });
  }
  if (AItem.proxima_dose) {
    LLinhas.push({
      rotulo: 'Próxima dose',
      valor: formatarDataHora(AItem.proxima_dose)
    });
  }
  if (AItem.data_fim_prevista) {
    LLinhas.push({
      rotulo: 'Término previsto',
      valor: formatarDataHora(AItem.data_fim_prevista)
    });
  }
  return LLinhas;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:34
 * * OBJECTIVE: Buscar a receita do id informado, avisando o usuário quando a busca falha.
 */
async function carregarReceita(AId) {
  try {
    await LReceitas.carregarReceita(AId);
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:35
 * * OBJECTIVE: Pedir confirmação e cancelar a receita; se ela já não estava ativa, mostrar a situação atual.
 */
function cancelar() {
  LQuasar.dialog({
    title: 'Cancelar receita',
    message:
      `Cancelar a receita de ${LReceita.value.nome_paciente}? Os alertas ` +
      'que ainda não foram enviados deixam de ser enviados. Essa ação não ' +
      'pode ser desfeita.',
    ok: {
      label: 'Cancelar receita',
      color: 'negative',
      unelevated: true,
      noCaps: true
    },
    cancel: { label: 'Voltar', color: 'primary', flat: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await LReceitas.cancelar(LReceita.value.idreceita);
      LQuasar.notify({ type: 'positive', message: 'Receita cancelada.' });
    } catch (LErro) {
      mostrarErro(LErro);
      if (LErro.response?.status === CONFLITO) {
        carregarReceita(LReceita.value.idreceita);
      }
    }
  });
}

onMounted(() => carregarReceita(LRota.params.id));

// Outro id no endereço reaproveita a página: busca a nova receita.
onBeforeRouteUpdate((ADestino) => carregarReceita(ADestino.params.id));
</script>
