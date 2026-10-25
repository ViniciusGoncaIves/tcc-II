<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-primary">Medicamentos</div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Novo medicamento"
        @click="abrirCadastro()"
      />
    </div>

    <q-table
      flat
      bordered
      wrap-cells
      row-key="idmedicamento"
      :rows="LLinhas"
      :columns="COLUNAS"
      :filter="LBusca"
      :loading="LMedicamentos.carregando"
      :rows-per-page-options="[10, 25, 50, 0]"
      :no-data-label="LMedicamentos.erro || 'Nenhum medicamento encontrado.'"
      no-results-label="Nenhum medicamento corresponde à busca."
    >
      <template #top>
        <div class="row items-center q-col-gutter-sm full-width">
          <div class="col-12 col-sm-6 col-md-5">
            <q-input
              v-model="LBusca"
              dense
              outlined
              clearable
              debounce="300"
              placeholder="Buscar por nome ou descrição"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-auto">
            <q-btn-toggle
              v-model="LSituacao"
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
            :color="AProps.row.ativo ? 'positive' : 'grey-6'"
            :label="AProps.value"
          />
        </q-td>
      </template>

      <template #body-cell-acoes="AProps">
        <q-td :props="AProps">
          <q-btn
            flat
            dense
            round
            icon="edit"
            color="primary"
            aria-label="Editar"
            @click="abrirCadastro(AProps.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>

          <q-btn
            v-if="AProps.row.ativo"
            flat
            dense
            round
            icon="block"
            color="negative"
            aria-label="Inativar"
            @click="inativar(AProps.row)"
          >
            <q-tooltip>Inativar</q-tooltip>
          </q-btn>

          <q-btn
            v-else
            flat
            dense
            round
            icon="restore"
            color="positive"
            aria-label="Reativar"
            @click="reativar(AProps.row)"
          >
            <q-tooltip>Reativar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="LDialogoAberto" persistent>
      <q-card class="full-width">
        <q-form @submit="salvar">
          <q-card-section>
            <div class="text-h6 text-primary">
              {{
                LEmEdicao.idmedicamento
                  ? 'Editar medicamento'
                  : 'Novo medicamento'
              }}
            </div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input
              v-model="LEmEdicao.nome"
              outlined
              autofocus
              label="Nome"
              maxlength="150"
              lazy-rules
              :rules="[(AValor) => !!AValor?.trim() || 'Informe o nome.']"
            />

            <q-input
              v-model="LEmEdicao.descricao"
              outlined
              autogrow
              type="textarea"
              label="Descrição"
              hint="Opcional."
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn
              v-close-popup
              flat
              no-caps
              color="primary"
              label="Cancelar"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Salvar"
              :loading="LSalvando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { mostrarErro } from '@/boot/axios';
import { useMedicamentosStore } from '@/stores/medicamentos-store';

const COLUNAS = [
  {
    name: 'nome',
    label: 'Nome',
    field: 'nome',
    align: 'left',
    sortable: true
  },
  {
    name: 'descricao',
    label: 'Descrição',
    field: (ALinha) => ALinha.descricao || '',
    align: 'left'
  },
  {
    name: 'situacao',
    label: 'Situação',
    field: (ALinha) => (ALinha.ativo ? 'Ativo' : 'Inativo'),
    align: 'left'
  },
  { name: 'acoes', label: 'Ações', field: () => '', align: 'right' }
];

const OPCOES_SITUACAO = [
  { label: 'Ativos', value: 'ativos' },
  { label: 'Inativos', value: 'inativos' },
  { label: 'Todos', value: 'todos' }
];

const LQuasar = useQuasar();
const LMedicamentos = useMedicamentosStore();

const LBusca = ref('');
const LSituacao = ref('ativos');
const LDialogoAberto = ref(false);
const LSalvando = ref(false);
const LEmEdicao = ref({});

const LLinhas = computed(() =>
  LMedicamentos.lista.filter(
    (AMedicamento) =>
      LSituacao.value === 'todos' ||
      AMedicamento.ativo === (LSituacao.value === 'ativos')
  )
);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:18
 * * OBJECTIVE: Buscar a lista de medicamentos, avisando o usuário quando a busca falha.
 */
async function carregarLista() {
  try {
    await LMedicamentos.carregar();
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:19
 * * OBJECTIVE: Abrir o formulário vazio para um novo medicamento ou preenchido com o medicamento escolhido.
 */
function abrirCadastro(AMedicamento) {
  LEmEdicao.value = AMedicamento
    ? {
        idmedicamento: AMedicamento.idmedicamento,
        nome: AMedicamento.nome,
        descricao: AMedicamento.descricao || ''
      }
    : { idmedicamento: null, nome: '', descricao: '' };
  LDialogoAberto.value = true;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:21
 * * OBJECTIVE: Enviar o cadastro ou a alteração do medicamento à API e fechar o formulário com sucesso.
 */
async function salvar() {
  const LId = LEmEdicao.value.idmedicamento;
  const LDados = {
    nome: LEmEdicao.value.nome,
    descricao: LEmEdicao.value.descricao?.trim() || null
  };
  LSalvando.value = true;
  try {
    if (LId) {
      await LMedicamentos.atualizar(LId, LDados);
    } else {
      await LMedicamentos.criar(LDados);
    }
    LQuasar.notify({
      type: 'positive',
      message: LId ? 'Medicamento alterado.' : 'Medicamento cadastrado.'
    });
    LDialogoAberto.value = false;
  } catch (LErro) {
    mostrarErro(LErro);
  } finally {
    LSalvando.value = false;
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:22
 * * OBJECTIVE: Pedir confirmação e inativar o medicamento, sem apagar o cadastro.
 */
function inativar(AMedicamento) {
  LQuasar.dialog({
    title: 'Inativar medicamento',
    message: `Deseja inativar o medicamento ${AMedicamento.nome}? O cadastro não é apagado e pode ser reativado depois.`,
    ok: {
      label: 'Inativar',
      color: 'negative',
      unelevated: true,
      noCaps: true
    },
    cancel: { label: 'Cancelar', color: 'primary', flat: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await LMedicamentos.inativar(AMedicamento.idmedicamento);
      LQuasar.notify({ type: 'positive', message: 'Medicamento inativado.' });
    } catch (LErro) {
      mostrarErro(LErro);
    }
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:23
 * * OBJECTIVE: Reativar um medicamento inativado.
 */
async function reativar(AMedicamento) {
  try {
    await LMedicamentos.reativar(AMedicamento.idmedicamento);
    LQuasar.notify({ type: 'positive', message: 'Medicamento reativado.' });
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

onMounted(carregarLista);
</script>
