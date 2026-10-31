<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm q-mb-md">
      <div class="text-h5 text-primary">Conexão do WhatsApp</div>
      <q-badge
        v-if="LConexao"
        :color="LSituacao.cor"
        :label="LSituacao.rotulo"
      />
    </div>

    <q-card v-if="LWhatsapp.erro" flat bordered>
      <q-card-section class="text-grey-7">
        {{ LWhatsapp.erro }} Nova tentativa em instantes.
      </q-card-section>
    </q-card>

    <div v-else-if="!LConexao" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <q-banner
      v-else-if="LConexao.modo === 'SIMULADO'"
      rounded
      class="bg-green-1 text-grey-9"
    >
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>
      O WhatsApp está em modo simulado: nenhuma mensagem é enviada de verdade.
      As mensagens só aparecem no log da API.
    </q-banner>

    <q-card v-else-if="LConexao.situacao === 'CONECTADO'" flat bordered>
      <q-card-section>
        <div class="text-caption text-grey-7">Número conectado</div>
        <div class="text-h6">{{ formatarNumero(LConexao.numero) }}</div>
        <div class="text-grey-7 q-mt-sm">
          Os alertas são enviados por este número.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          outline
          no-caps
          color="negative"
          icon="link_off"
          label="Desconectar"
          :loading="LDesconectando"
          @click="desconectar"
        />
      </q-card-actions>
    </q-card>

    <q-card v-else-if="LConexao.situacao === 'AGUARDANDO_QR'" flat bordered>
      <q-card-section class="row items-center q-col-gutter-lg">
        <div class="col-12 col-md-auto row justify-center">
          <q-img
            :src="LConexao.qrcode"
            alt="QR code para conectar o WhatsApp"
            width="292px"
            ratio="1"
            no-spinner
            no-transition
          />
        </div>

        <div class="col-12 col-md">
          <div class="text-subtitle1 q-mb-sm">
            Conecte o celular que enviará os alertas
          </div>
          <ol class="q-pl-md q-my-none">
            <li>Abra o WhatsApp no celular.</li>
            <li>Entre em Aparelhos conectados.</li>
            <li>Toque em Conectar um aparelho.</li>
            <li>Aponte a câmera para o código.</li>
          </ol>
          <div class="text-grey-7 q-mt-sm">
            O código muda sozinho de tempos em tempos. Enquanto nenhum celular
            estiver conectado, os alertas ficam parados.
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-else-if="LConexao.situacao === 'CONECTANDO'" flat bordered>
      <q-card-section class="row items-center q-gutter-md">
        <q-spinner color="primary" size="24px" />
        <div>Conectando ao WhatsApp.</div>
      </q-card-section>
    </q-card>

    <q-card v-else flat bordered>
      <q-card-section class="text-grey-7">
        O WhatsApp está desconectado e os alertas estão parados. O sistema tenta
        reconectar sozinho.
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { mostrarErro } from '@/boot/axios';
import { useWhatsappStore } from '@/stores/whatsapp-store';

const SITUACOES_CONEXAO = {
  CONECTADO: { rotulo: 'Conectado', cor: 'positive' },
  AGUARDANDO_QR: { rotulo: 'Aguardando leitura', cor: 'warning' },
  CONECTANDO: { rotulo: 'Conectando', cor: 'info' },
  DESCONECTADO: { rotulo: 'Desconectado', cor: 'grey-6' }
};
const MODO_SIMULADO = { rotulo: 'Modo simulado', cor: 'info' };

// O QR code muda a cada 20 segundos, por isso a consulta é mais frequente.
const INTERVALO_CONSULTA_MS = 5000;

const LQuasar = useQuasar();
const LWhatsapp = useWhatsappStore();
const LDesconectando = ref(false);
let LConsultaPeriodica = null;

const LConexao = computed(() => LWhatsapp.conexao);

const LSituacao = computed(() =>
  LConexao.value.modo === 'SIMULADO'
    ? MODO_SIMULADO
    : SITUACOES_CONEXAO[LConexao.value.situacao]
);

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 30/10/2026 21:18
 * * OBJECTIVE: Mostrar o número conectado no formato +55 (49) 99999-9999; contas antigas podem vir sem o nono dígito.
 */
function formatarNumero(ANumero) {
  const LPartes = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(ANumero);
  return LPartes ? `+55 (${LPartes[1]}) ${LPartes[2]}-${LPartes[3]}` : ANumero;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 30/10/2026 21:19
 * * OBJECTIVE: Pedir confirmação e desconectar o número atual; depois disso, a consulta periódica mostra o QR code novo.
 */
function desconectar() {
  LQuasar.dialog({
    title: 'Desconectar WhatsApp',
    message:
      `Desconectar o número ${formatarNumero(LConexao.value.numero)}? ` +
      'Os alertas param de sair até um número ser conectado.',
    ok: {
      label: 'Desconectar',
      color: 'negative',
      unelevated: true,
      noCaps: true
    },
    cancel: { label: 'Voltar', color: 'primary', flat: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    LDesconectando.value = true;
    try {
      await LWhatsapp.desconectar();
      LQuasar.notify({ type: 'positive', message: 'Número desconectado.' });
    } catch (LErro) {
      mostrarErro(LErro);
    } finally {
      LDesconectando.value = false;
    }
  });
}

onMounted(() => {
  LWhatsapp.carregar();
  LConsultaPeriodica = setInterval(LWhatsapp.carregar, INTERVALO_CONSULTA_MS);
});

onBeforeUnmount(() => {
  clearInterval(LConsultaPeriodica);
  LWhatsapp.$reset();
});
</script>
