<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-primary">Usuários</div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Novo usuário"
        @click="abrirCadastro()"
      />
    </div>

    <q-table
      flat
      bordered
      row-key="idusuario"
      :rows="LLinhas"
      :columns="COLUNAS"
      :filter="LBusca"
      :filter-method="filtrarPorNomeOuEmail"
      :loading="LUsuarios.carregando"
      :rows-per-page-options="[10, 25, 50, 0]"
      :no-data-label="LUsuarios.erro || 'Nenhum usuário encontrado.'"
      no-results-label="Nenhum usuário corresponde à busca."
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
              placeholder="Buscar por nome ou e-mail"
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

      <template #body-cell-nome="AProps">
        <q-td :props="AProps">
          <div>
            {{ AProps.value }}
            <span v-if="ehProprioUsuario(AProps.row)" class="text-grey-7">
              (você)
            </span>
          </div>
          <div class="text-caption text-grey-7">{{ AProps.row.email }}</div>
        </q-td>
      </template>

      <template #body-cell-situacao="AProps">
        <q-td :props="AProps">
          <q-badge
            :color="AProps.row.ativo ? 'positive' : 'grey-6'"
            :label="AProps.value"
          />
          <q-badge
            v-if="AProps.row.trocar_senha"
            color="warning"
            label="Senha provisória"
            class="q-ml-xs"
          >
            <q-tooltip>A pessoa ainda não trocou a senha provisória.</q-tooltip>
          </q-badge>
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
            v-if="!ehProprioUsuario(AProps.row)"
            flat
            dense
            round
            icon="lock_reset"
            color="primary"
            aria-label="Redefinir senha"
            @click="abrirRedefinicaoSenha(AProps.row)"
          >
            <q-tooltip>Redefinir senha</q-tooltip>
          </q-btn>

          <q-btn
            v-if="AProps.row.ativo && !ehProprioUsuario(AProps.row)"
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
            v-if="!AProps.row.ativo"
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
              {{ LEmEdicao.idusuario ? 'Editar usuário' : 'Novo usuário' }}
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
              v-model="LEmEdicao.email"
              outlined
              inputmode="email"
              label="E-mail"
              maxlength="150"
              autocomplete="off"
              lazy-rules
              :rules="[
                (AValor) =>
                  FORMATO_EMAIL.test(AValor?.trim() || '') ||
                  'Informe um e-mail válido.'
              ]"
            />

            <q-select
              v-model="LEmEdicao.tipo_usuario"
              outlined
              emit-value
              map-options
              label="Perfil"
              :options="OPCOES_PERFIL"
              :disable="LEditandoProprio"
              :hint="
                LEditandoProprio
                  ? 'Você não pode mudar o seu próprio perfil.'
                  : 'O administrador também cuida dos usuários.'
              "
            />

            <CampoSenhaProvisoria
              v-if="!LEmEdicao.idusuario"
              v-model="LEmEdicao.senha"
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

    <q-dialog v-model="LRedefinicaoAberta" persistent>
      <q-card class="full-width">
        <q-form @submit="salvarNovaSenha">
          <q-card-section>
            <div class="text-h6 text-primary">Redefinir senha</div>
            <div class="text-grey-8 q-mt-sm">
              A senha atual de {{ LUsuarioSenha?.nome }} deixa de valer. A
              pessoa entra com a senha provisória abaixo e escolhe uma nova no
              primeiro acesso.
            </div>
          </q-card-section>

          <q-card-section>
            <CampoSenhaProvisoria v-model="LNovaSenha" />
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
              label="Redefinir"
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
import CampoSenhaProvisoria from '@/components/CampoSenhaProvisoria.vue';
import { useAutenticacaoStore } from '@/stores/autenticacao-store';
import { useUsuariosStore } from '@/stores/usuarios-store';

// Mesmo formato que a API confere.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERFIS = { ADMIN: 'Administrador', OPERADOR: 'Operador' };

const OPCOES_PERFIL = [
  { label: PERFIS.OPERADOR, value: 'OPERADOR' },
  { label: PERFIS.ADMIN, value: 'ADMIN' }
];

const COLUNAS = [
  // O e-mail aparece embaixo do nome, para a tabela caber na tela.
  {
    name: 'nome',
    label: 'Usuário',
    field: 'nome',
    align: 'left',
    sortable: true
  },
  {
    name: 'perfil',
    label: 'Perfil',
    field: (ALinha) => PERFIS[ALinha.tipo_usuario],
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
const LAutenticacao = useAutenticacaoStore();
const LUsuarios = useUsuariosStore();

const LBusca = ref('');
const LSituacao = ref('ativos');
const LDialogoAberto = ref(false);
const LRedefinicaoAberta = ref(false);
const LSalvando = ref(false);
const LEmEdicao = ref({});
const LUsuarioSenha = ref(null);
const LNovaSenha = ref('');

const LLinhas = computed(() =>
  LUsuarios.lista.filter(
    (AUsuario) =>
      LSituacao.value === 'todos' ||
      AUsuario.ativo === (LSituacao.value === 'ativos')
  )
);

// O administrador não muda o próprio perfil: virar operador o tiraria
// desta tela na hora, e só outro administrador poderia desfazer.
const LEditandoProprio = computed(() => ehProprioUsuario(LEmEdicao.value));

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:14
 * * OBJECTIVE: Informar se o usuário é o próprio administrador logado.
 */
function ehProprioUsuario(AUsuario) {
  return (
    !!AUsuario?.idusuario &&
    AUsuario.idusuario === LAutenticacao.usuario?.idusuario
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:15
 * * OBJECTIVE: Filtrar a tabela pelo texto da busca, no nome ou no e-mail, sem diferenciar maiúsculas.
 */
function filtrarPorNomeOuEmail(ALinhas, ATexto) {
  const LTexto = ATexto.toLowerCase();
  return ALinhas.filter(
    (AUsuario) =>
      AUsuario.nome.toLowerCase().includes(LTexto) ||
      AUsuario.email.toLowerCase().includes(LTexto)
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:15
 * * OBJECTIVE: Buscar a lista de usuários, avisando o administrador quando a busca falha.
 */
async function carregarLista() {
  try {
    await LUsuarios.carregar();
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:15
 * * OBJECTIVE: Abrir o formulário vazio para um novo usuário ou preenchido com o usuário escolhido.
 */
function abrirCadastro(AUsuario) {
  LEmEdicao.value = AUsuario
    ? {
        idusuario: AUsuario.idusuario,
        nome: AUsuario.nome,
        email: AUsuario.email,
        tipo_usuario: AUsuario.tipo_usuario
      }
    : {
        idusuario: null,
        nome: '',
        email: '',
        tipo_usuario: 'OPERADOR',
        senha: ''
      };
  LDialogoAberto.value = true;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:15
 * * OBJECTIVE: Enviar o cadastro ou a alteração do usuário à API; se for o próprio administrador, atualizar o nome no cabeçalho.
 */
async function salvar() {
  const LId = LEmEdicao.value.idusuario;
  const LDados = {
    nome: LEmEdicao.value.nome,
    email: LEmEdicao.value.email,
    tipo_usuario: LEmEdicao.value.tipo_usuario
  };
  LSalvando.value = true;
  try {
    if (LId) {
      const LUsuario = await LUsuarios.atualizar(LId, LDados);
      if (ehProprioUsuario(LUsuario)) {
        LAutenticacao.atualizarUsuarioLogado(LUsuario);
      }
    } else {
      await LUsuarios.criar({ ...LDados, senha: LEmEdicao.value.senha });
    }
    LQuasar.notify({
      type: 'positive',
      message: LId
        ? 'Usuário alterado.'
        : 'Usuário cadastrado. Passe a senha provisória para a pessoa.'
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
 * * DATE: 25/10/2026 20:16
 * * OBJECTIVE: Abrir a janela de nova senha provisória para o usuário escolhido.
 */
function abrirRedefinicaoSenha(AUsuario) {
  LUsuarioSenha.value = AUsuario;
  LNovaSenha.value = '';
  LRedefinicaoAberta.value = true;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:16
 * * OBJECTIVE: Enviar a nova senha provisória à API, que obriga a pessoa a trocá-la no próximo acesso.
 */
async function salvarNovaSenha() {
  LSalvando.value = true;
  try {
    await LUsuarios.redefinirSenha(LUsuarioSenha.value, LNovaSenha.value);
    LQuasar.notify({
      type: 'positive',
      message: 'Senha redefinida. Passe a senha provisória para a pessoa.'
    });
    LRedefinicaoAberta.value = false;
  } catch (LErro) {
    mostrarErro(LErro);
  } finally {
    LSalvando.value = false;
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:16
 * * OBJECTIVE: Pedir confirmação e inativar o usuário, bloqueando o acesso dele sem apagar o cadastro.
 */
function inativar(AUsuario) {
  LQuasar.dialog({
    title: 'Inativar usuário',
    message: `Deseja inativar o usuário ${AUsuario.nome}? O acesso ao sistema é bloqueado na hora. O cadastro não é apagado e pode ser reativado depois.`,
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
      await LUsuarios.inativar(AUsuario.idusuario);
      LQuasar.notify({ type: 'positive', message: 'Usuário inativado.' });
    } catch (LErro) {
      mostrarErro(LErro);
    }
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 20:17
 * * OBJECTIVE: Reativar um usuário inativado.
 */
async function reativar(AUsuario) {
  try {
    await LUsuarios.reativar(AUsuario.idusuario);
    LQuasar.notify({ type: 'positive', message: 'Usuário reativado.' });
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

onMounted(carregarLista);
</script>
