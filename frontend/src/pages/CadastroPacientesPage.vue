<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-primary">Pacientes</div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Novo paciente"
        @click="abrirCadastro()"
      />
    </div>

    <q-table
      flat
      bordered
      row-key="idpaciente"
      :rows="LLinhas"
      :columns="COLUNAS"
      :filter="LBusca"
      :loading="LPacientes.carregando"
      :rows-per-page-options="[10, 25, 50, 0]"
      :no-data-label="LPacientes.erro || 'Nenhum paciente encontrado.'"
      no-results-label="Nenhum paciente corresponde à busca."
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
              placeholder="Buscar por nome ou telefone"
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
              {{ LEmEdicao.idpaciente ? 'Editar paciente' : 'Novo paciente' }}
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
              v-model="LEmEdicao.telefone"
              outlined
              label="Celular (WhatsApp)"
              prefix="+55"
              mask="(##) #####-####"
              unmasked-value
              hint="Com DDD. É o número que recebe os alertas."
              lazy-rules
              :rules="[
                (AValor) =>
                  AValor?.length === DIGITOS_TELEFONE ||
                  'Informe o celular completo, com DDD.'
              ]"
            />

            <q-input
              v-model="LEmEdicao.data_nascimento"
              outlined
              label="Data de nascimento"
              mask="##/##/####"
              hint="Opcional."
              lazy-rules
              :rules="[
                (AValor) =>
                  !AValor ||
                  dataValida(AValor) ||
                  'Informe uma data válida, até hoje.'
              ]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover>
                    <q-date
                      v-model="LEmEdicao.data_nascimento"
                      mask="DD/MM/YYYY"
                      default-view="Years"
                      :navigation-max-year-month="LHoje.slice(0, 7)"
                      :options="(AData) => AData <= LHoje"
                    >
                      <div class="row justify-end">
                        <q-btn
                          v-close-popup
                          flat
                          no-caps
                          color="primary"
                          label="Fechar"
                        />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
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
import { date, useQuasar } from 'quasar';
import { mostrarErro } from '@/boot/axios';
import { usePacientesStore } from '@/stores/pacientes-store';

// O campo recebe só o DDD e o número; o 55 do Brasil entra no envio.
const CODIGO_PAIS = '55';
const DIGITOS_TELEFONE = 11;
const ANO_MINIMO = 1900;

const COLUNAS = [
  {
    name: 'nome',
    label: 'Nome',
    field: 'nome',
    align: 'left',
    sortable: true
  },
  {
    name: 'telefone',
    label: 'Celular',
    field: 'telefone',
    align: 'left',
    format: formatarTelefone
  },
  {
    name: 'data_nascimento',
    label: 'Nascimento',
    field: 'data_nascimento',
    align: 'left',
    format: formatarData
  },
  {
    name: 'situacao',
    label: 'Situação',
    field: (ALinha) => {
      if (ALinha.ativo) {
        return 'Ativo';
      }
      return ALinha.motivo_inativacao === 'PEDIDO_DO_PACIENTE'
        ? 'Inativo: não quer receber alertas'
        : 'Inativo';
    },
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
const LPacientes = usePacientesStore();

// Formato das datas que o q-date passa para a função de :options.
const LHoje = date.formatDate(Date.now(), 'YYYY/MM/DD');

const LBusca = ref('');
const LSituacao = ref('ativos');
const LDialogoAberto = ref(false);
const LSalvando = ref(false);
const LEmEdicao = ref({});

const LLinhas = computed(() =>
  LPacientes.lista.filter(
    (APaciente) =>
      LSituacao.value === 'todos' ||
      APaciente.ativo === (LSituacao.value === 'ativos')
  )
);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:07
 * * OBJECTIVE: Mostrar o telefone gravado (só dígitos, com o 55) no formato +55 (49) 99999-9999.
 */
function formatarTelefone(ATelefone) {
  const LPartes = /^55(\d{2})(\d{5})(\d{4})$/.exec(ATelefone);
  return LPartes
    ? `+55 (${LPartes[1]}) ${LPartes[2]}-${LPartes[3]}`
    : ATelefone;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:08
 * * OBJECTIVE: Mostrar a data da API (AAAA-MM-DD) no formato DD/MM/AAAA.
 */
function formatarData(AData) {
  if (!AData) {
    return '';
  }
  const [LAno, LMes, LDia] = AData.split('-');
  return `${LDia}/${LMes}/${LAno}`;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:09
 * * OBJECTIVE: Converter a data digitada (DD/MM/AAAA) para o formato da API (AAAA-MM-DD).
 */
function converterDataParaApi(AData) {
  const [LDia, LMes, LAno] = AData.split('/');
  return `${LAno}-${LMes}-${LDia}`;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:10
 * * OBJECTIVE: Informar se a data digitada (DD/MM/AAAA) existe no calendário e não é futura.
 */
function dataValida(AData) {
  const [LDia, LMes, LAno] = AData.split('/').map(Number);
  const LData = new Date(LAno, LMes - 1, LDia);
  return (
    AData.length === 10 &&
    LAno >= ANO_MINIMO &&
    LData.getFullYear() === LAno &&
    LData.getMonth() === LMes - 1 &&
    LData.getDate() === LDia &&
    LData <= new Date()
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:11
 * * OBJECTIVE: Buscar a lista de pacientes, avisando o usuário quando a busca falha.
 */
async function carregarLista() {
  try {
    await LPacientes.carregar();
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:12
 * * OBJECTIVE: Abrir o formulário vazio para um novo paciente ou preenchido com o paciente escolhido.
 */
function abrirCadastro(APaciente) {
  LEmEdicao.value = APaciente
    ? {
        idpaciente: APaciente.idpaciente,
        nome: APaciente.nome,
        telefone: APaciente.telefone.replace(/^55/, ''),
        data_nascimento: formatarData(APaciente.data_nascimento)
      }
    : { idpaciente: null, nome: '', telefone: '', data_nascimento: '' };
  LDialogoAberto.value = true;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:14
 * * OBJECTIVE: Enviar o cadastro ou a alteração do paciente à API e fechar o formulário com sucesso.
 */
async function salvar() {
  const LId = LEmEdicao.value.idpaciente;
  const LDados = {
    nome: LEmEdicao.value.nome,
    telefone: CODIGO_PAIS + LEmEdicao.value.telefone,
    data_nascimento: LEmEdicao.value.data_nascimento
      ? converterDataParaApi(LEmEdicao.value.data_nascimento)
      : null
  };
  LSalvando.value = true;
  try {
    if (LId) {
      await LPacientes.atualizar(LId, LDados);
    } else {
      await LPacientes.criar(LDados);
    }
    LQuasar.notify({
      type: 'positive',
      message: LId ? 'Paciente alterado.' : 'Paciente cadastrado.'
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
 * * DATE: 25/10/2026 19:15
 * * OBJECTIVE: Pedir confirmação e inativar o paciente, sem apagar o cadastro.
 */
function inativar(APaciente) {
  LQuasar.dialog({
    title: 'Inativar paciente',
    message: `Deseja inativar o paciente ${APaciente.nome}? O cadastro não é apagado e pode ser reativado depois.`,
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
      await LPacientes.inativar(APaciente.idpaciente);
      LQuasar.notify({ type: 'positive', message: 'Paciente inativado.' });
    } catch (LErro) {
      mostrarErro(LErro);
    }
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:15
 * * OBJECTIVE: Enviar a reativação do paciente à API e avisar o resultado.
 */
async function enviarReativacao(APaciente) {
  try {
    await LPacientes.reativar(APaciente.idpaciente);
    LQuasar.notify({ type: 'positive', message: 'Paciente reativado.' });
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:16
 * * OBJECTIVE: Reativar um paciente inativado; se ele mesmo pediu pelo WhatsApp para não receber alertas, pede antes a confirmação de que autorizou.
 */
function reativar(APaciente) {
  if (APaciente.motivo_inativacao !== 'PEDIDO_DO_PACIENTE') {
    enviarReativacao(APaciente);
    return;
  }
  LQuasar.dialog({
    title: 'Reativar paciente',
    message:
      'Este paciente pediu para não receber alertas. Reative só se ele autorizou.',
    ok: {
      label: 'Reativar',
      color: 'positive',
      unelevated: true,
      noCaps: true
    },
    cancel: { label: 'Cancelar', color: 'primary', flat: true, noCaps: true },
    persistent: true
  }).onOk(() => enviarReativacao(APaciente));
}

onMounted(carregarLista);
</script>
