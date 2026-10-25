<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        color="primary"
        aria-label="Voltar"
        class="q-mr-sm"
        to="/receitas"
      />
      <div class="text-h5 text-primary">Emitir receita</div>
    </div>

    <q-form @submit="confirmarEmissao">
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="q-gutter-md">
          <q-select
            v-model="LPaciente"
            outlined
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            label="Paciente"
            option-label="nome"
            :options="LOpcoesPacientes"
            lazy-rules
            :rules="[(AValor) => !!AValor || 'Escolha o paciente.']"
            @filter="filtrarPacientes"
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey-7">
                  Nenhum paciente ativo encontrado.
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-model="LObservacao"
            outlined
            autogrow
            type="textarea"
            label="Observação"
            hint="Opcional."
          />
        </q-card-section>
      </q-card>

      <div class="text-subtitle1 text-primary q-mb-sm">Medicamentos</div>

      <q-card
        v-for="(LItem, LIndice) in LItens"
        :key="LItem.chave"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle2">Medicamento {{ LIndice + 1 }}</div>
            <q-space />
            <q-btn
              v-if="LItens.length > 1"
              flat
              dense
              round
              icon="delete"
              color="negative"
              aria-label="Remover"
              @click="removerItem(LIndice)"
            >
              <q-tooltip>Remover</q-tooltip>
            </q-btn>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select
                v-model="LItem.medicamento"
                outlined
                use-input
                fill-input
                hide-selected
                input-debounce="0"
                label="Medicamento"
                option-label="nome"
                :options="LOpcoesMedicamentos"
                lazy-rules
                :rules="[(AValor) => !!AValor || 'Escolha o medicamento.']"
                @filter="filtrarMedicamentos"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey-7">
                      Nenhum medicamento ativo encontrado.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model="LItem.dose"
                outlined
                label="Dose"
                maxlength="50"
                hint="Ex.: 1 comprimido, 10 ml."
                lazy-rules
                :rules="[
                  (AValor) => !!AValor?.trim() || 'Informe a dose.',
                  () =>
                    !itemRepetido(LIndice) ||
                    'Esse medicamento já está na receita com a mesma dose.'
                ]"
              />
            </div>

            <div class="col-6 col-md-2">
              <q-input
                v-model.number="LItem.intervalo_horas"
                outlined
                type="number"
                label="A cada"
                suffix="horas"
                lazy-rules
                :rules="[
                  (AValor) =>
                    inteiroEntre(AValor, 1, INTERVALO_HORAS_MAXIMO) ||
                    `De 1 a ${INTERVALO_HORAS_MAXIMO} horas.`
                ]"
              />
            </div>

            <div class="col-6 col-md-2">
              <q-input
                v-model.number="LItem.duracao_dias"
                outlined
                type="number"
                label="Durante"
                suffix="dias"
                lazy-rules
                :rules="[
                  (AValor) =>
                    inteiroEntre(AValor, 1, DURACAO_DIAS_MAXIMO) ||
                    `De 1 a ${DURACAO_DIAS_MAXIMO} dias.`
                ]"
              />
            </div>
          </div>

          <div v-if="totalDoses(LItem)" class="text-caption text-grey-7">
            Total de {{ totalDoses(LItem) }}
            {{ totalDoses(LItem) === 1 ? 'dose' : 'doses' }}.
          </div>
        </q-card-section>
      </q-card>

      <q-btn
        flat
        no-caps
        color="primary"
        icon="add"
        label="Adicionar medicamento"
        class="q-mb-md"
        @click="adicionarItem"
      />

      <q-banner rounded class="bg-green-1 text-grey-9 q-mb-md">
        <template #avatar>
          <q-icon name="info" color="primary" />
        </template>
        A primeira dose de cada medicamento é enviada pelo WhatsApp assim que a
        receita é emitida, e o paciente confirma que tomou. As doses seguintes
        são agendadas a partir dessa confirmação. A receita não pode ser
        alterada depois: para mudar algo, cancele e emita outra.
      </q-banner>

      <div class="row justify-end q-gutter-sm">
        <q-btn flat no-caps color="primary" label="Voltar" to="/receitas" />
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="primary"
          icon="send"
          label="Emitir receita"
          :loading="LEmitindo"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { mostrarErro } from '@/boot/axios';
import { useMedicamentosStore } from '@/stores/medicamentos-store';
import { usePacientesStore } from '@/stores/pacientes-store';
import { useReceitasStore } from '@/stores/receitas-store';
import { filtrarPorNome } from '@/utils/receitas';

// Mesmos limites da API.
const INTERVALO_HORAS_MAXIMO = 168;
const DURACAO_DIAS_MAXIMO = 365;

const LQuasar = useQuasar();
const LRouter = useRouter();
const LPacientes = usePacientesStore();
const LMedicamentos = useMedicamentosStore();
const LReceitas = useReceitasStore();

const LPaciente = ref(null);
const LObservacao = ref('');
const LItens = ref([]);
const LOpcoesPacientes = ref([]);
const LOpcoesMedicamentos = ref([]);
const LEmitindo = ref(false);

// Chave de cada item na tela, para o Vue não confundir os itens ao remover um.
let LUltimaChave = 0;

const LPacientesAtivos = computed(() =>
  LPacientes.lista.filter((APaciente) => APaciente.ativo)
);
const LMedicamentosAtivos = computed(() =>
  LMedicamentos.lista.filter((AMedicamento) => AMedicamento.ativo)
);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:30
 * * OBJECTIVE: Informar se o valor é um número inteiro entre o mínimo e o máximo, inclusive.
 */
function inteiroEntre(AValor, AMinimo, AMaximo) {
  return Number.isInteger(AValor) && AValor >= AMinimo && AValor <= AMaximo;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:30
 * * OBJECTIVE: Calcular quantas doses o item terá, como o banco calcula (duração em horas dividida pelo intervalo, arredondada para cima).
 */
function totalDoses(AItem) {
  if (
    !inteiroEntre(AItem.intervalo_horas, 1, INTERVALO_HORAS_MAXIMO) ||
    !inteiroEntre(AItem.duracao_dias, 1, DURACAO_DIAS_MAXIMO)
  ) {
    return 0;
  }
  return Math.ceil((AItem.duracao_dias * 24) / AItem.intervalo_horas);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:31
 * * OBJECTIVE: Informar se um item anterior já tem o mesmo medicamento com a mesma dose, ignorando maiúsculas e espaços, como a API confere.
 */
function itemRepetido(AIndice) {
  const LItem = LItens.value[AIndice];
  if (!LItem.medicamento || !LItem.dose) {
    return false;
  }
  const LDose = LItem.dose.replace(/\s+/g, '').toUpperCase();
  return LItens.value
    .slice(0, AIndice)
    .some(
      (AAnterior) =>
        AAnterior.medicamento?.idmedicamento ===
          LItem.medicamento.idmedicamento &&
        AAnterior.dose.replace(/\s+/g, '').toUpperCase() === LDose
    );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:31
 * * OBJECTIVE: Acrescentar um item vazio na receita.
 */
function adicionarItem() {
  LUltimaChave += 1;
  LItens.value.push({
    chave: LUltimaChave,
    medicamento: null,
    dose: '',
    intervalo_horas: '',
    duracao_dias: ''
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:31
 * * OBJECTIVE: Tirar um item da receita.
 */
function removerItem(AIndice) {
  LItens.value.splice(AIndice, 1);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:32
 * * OBJECTIVE: Mostrar na escolha do paciente só os ativos cujo nome contém o texto digitado.
 */
function filtrarPacientes(ATexto, AAtualizar) {
  AAtualizar(() => {
    LOpcoesPacientes.value = filtrarPorNome(LPacientesAtivos.value, ATexto);
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:32
 * * OBJECTIVE: Mostrar na escolha do medicamento só os ativos cujo nome contém o texto digitado.
 */
function filtrarMedicamentos(ATexto, AAtualizar) {
  AAtualizar(() => {
    LOpcoesMedicamentos.value = filtrarPorNome(
      LMedicamentosAtivos.value,
      ATexto
    );
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:32
 * * OBJECTIVE: Buscar os pacientes e os medicamentos para as escolhas do formulário.
 */
async function carregarOpcoes() {
  try {
    await Promise.all([LPacientes.carregar(), LMedicamentos.carregar()]);
  } catch (LErro) {
    mostrarErro(LErro);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:33
 * * OBJECTIVE: Montar os dados da receita no formato que a API recebe.
 */
function montarDados() {
  return {
    idpaciente: LPaciente.value.idpaciente,
    observacao: LObservacao.value.trim() || null,
    itens: LItens.value.map((AItem) => ({
      idmedicamento: AItem.medicamento.idmedicamento,
      dose: AItem.dose.trim(),
      intervalo_horas: AItem.intervalo_horas,
      duracao_dias: AItem.duracao_dias
    }))
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:33
 * * OBJECTIVE: Enviar a receita à API e, com sucesso, abrir o detalhe dela.
 */
async function emitir() {
  LEmitindo.value = true;
  try {
    const LReceita = await LReceitas.emitir(montarDados());
    LQuasar.notify({ type: 'positive', message: 'Receita emitida.' });
    LRouter.replace(`/receitas/${LReceita.idreceita}`);
  } catch (LErro) {
    mostrarErro(LErro);
  } finally {
    LEmitindo.value = false;
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:33
 * * OBJECTIVE: Mostrar o resumo da receita e emitir só depois da confirmação, porque a primeira dose sai na hora e a receita não pode ser alterada.
 */
function confirmarEmissao() {
  const LQuantidade = LItens.value.length;
  const LNomes = LItens.value.map((AItem) => AItem.medicamento.nome);
  LQuasar.dialog({
    title: 'Emitir receita',
    message:
      `Emitir a receita de ${LPaciente.value.nome} com ` +
      `${LQuantidade} ${LQuantidade === 1 ? 'medicamento' : 'medicamentos'} ` +
      `(${LNomes.join(', ')})? A primeira dose de cada um será enviada ` +
      'agora pelo WhatsApp.',
    ok: { label: 'Emitir', color: 'primary', unelevated: true, noCaps: true },
    cancel: { label: 'Voltar', color: 'primary', flat: true, noCaps: true },
    persistent: true
  }).onOk(emitir);
}

adicionarItem();
onMounted(carregarOpcoes);
</script>
