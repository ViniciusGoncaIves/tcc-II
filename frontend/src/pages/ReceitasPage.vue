<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-primary">Receitas</div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Emitir receita"
        to="/receitas/nova"
      />
    </div>

    <q-table
      flat
      bordered
      row-key="idreceita"
      :rows="LReceitas.lista"
      :columns="COLUNAS"
      :loading="LReceitas.carregando"
      :rows-per-page-options="[10, 25, 50, 0]"
      :no-data-label="LReceitas.erro || 'Nenhuma receita encontrada.'"
      @row-click="(AEvento, ALinha) => abrirReceita(ALinha)"
    >
      <template #top>
        <div class="row items-center q-col-gutter-sm full-width">
          <div class="col-12 col-sm-6 col-md-5">
            <q-select
              v-model="LReceitas.filtros.paciente"
              dense
              outlined
              clearable
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              label="Paciente"
              option-label="nome"
              :options="LOpcoesPacientes"
              @filter="filtrarPacientes"
            >
              <template #prepend>
                <q-icon name="person" />
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-7">
                    Nenhum paciente encontrado.
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-auto">
            <q-btn-toggle
              v-model="LReceitas.filtros.status"
              spread
              no-caps
              unelevated
              color="grey-3"
              text-color="grey-9"
              toggle-color="primary"
              :options="OPCOES_SITUACAO"
            />
          </div>
        </div>
      </template>

      <template #body-cell-situacao="AProps">
        <q-td :props="AProps">
          <q-badge
            :color="SITUACOES_RECEITA[AProps.row.status].cor"
            :label="AProps.value"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { mostrarErro } from '@/boot/axios';
import { usePacientesStore } from '@/stores/pacientes-store';
import { useReceitasStore } from '@/stores/receitas-store';
import {
  SITUACOES_RECEITA,
  filtrarPorNome,
  formatarDataHora
} from '@/utils/receitas';

const COLUNAS = [
  {
    name: 'data_emissao',
    label: 'Emissão',
    field: 'data_emissao',
    align: 'left',
    sortable: true,
    format: formatarDataHora
  },
  {
    name: 'nome_paciente',
    label: 'Paciente',
    field: 'nome_paciente',
    align: 'left',
    sortable: true
  },
  {
    name: 'nome_emissor',
    label: 'Emitida por',
    field: 'nome_emissor',
    align: 'left'
  },
  {
    name: 'quantidade_itens',
    label: 'Itens',
    field: 'quantidade_itens',
    align: 'center'
  },
  {
    name: 'situacao',
    label: 'Situação',
    field: (ALinha) => SITUACOES_RECEITA[ALinha.status].rotulo,
    align: 'left'
  }
];

const OPCOES_SITUACAO = [
  { label: 'Ativas', value: 'ATIVA' },
  { label: 'Concluídas', value: 'CONCLUIDA' },
  { label: 'Canceladas', value: 'CANCELADA' },
  { label: 'Todas', value: 'TODAS' }
];

const LRouter = useRouter();
const LReceitas = useReceitasStore();
const LPacientes = usePacientesStore();

const LOpcoesPacientes = ref([]);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:29
 * * OBJECTIVE: Buscar as receitas dos filtros escolhidos, avisando o usuário quando a busca falha.
 */
async function carregarLista() {
  try {
    await LReceitas.carregar();
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:29
 * * OBJECTIVE: Buscar os pacientes, ativos e inativos, para o filtro por paciente.
 */
async function carregarPacientes() {
  try {
    await LPacientes.carregar();
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:30
 * * OBJECTIVE: Mostrar no filtro só os pacientes cujo nome contém o texto digitado.
 */
function filtrarPacientes(ATexto, AAtualizar) {
  AAtualizar(() => {
    LOpcoesPacientes.value = filtrarPorNome(LPacientes.lista, ATexto);
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:30
 * * OBJECTIVE: Abrir o detalhe da receita clicada na lista.
 */
function abrirReceita(AReceita) {
  LRouter.push(`/receitas/${AReceita.idreceita}`);
}

watch(() => LReceitas.filtros, carregarLista, { deep: true });

onMounted(() => {
  carregarLista();
  carregarPacientes();
});
</script>
