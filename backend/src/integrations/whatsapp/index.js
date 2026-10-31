const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

const MODO_SIMULADO = process.env.WHATSAPP_MODO === 'simulado';
const PASTA_SESSAO = process.env.WHATSAPP_PASTA_SESSAO || 'sessao-whatsapp';
const SEGUNDOS_PARA_RECONECTAR = 5;
// Só no modo simulado, para teste: telefones tratados como sem conta no WhatsApp.
const TELEFONES_SEM_CONTA_SIMULADO = (
  process.env.WHATSAPP_SIMULADO_SEM_CONTA || ''
).split(',');

// O Baileys registra detalhes das conversas no log; fica em silêncio para nada delas ser gravado.
const LOGGER_SILENCIOSO = {
  level: 'silent',
  child: () => LOGGER_SILENCIOSO,
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

let LBaileys = null;
let LSocket = null;
let LSituacao = MODO_SIMULADO ? 'CONECTADO' : 'DESCONECTADO';
let LQrCode = null;
let LReconexao = null;
let LTratadores = {};

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:39
 * * OBJECTIVE: Registrar as funções chamadas quando chega um voto ou um pedido de parada e a busca do conteúdo das enquetes enviadas.
 */
function definirTratadores(ATratadores) {
  LTratadores = ATratadores;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:40
 * * OBJECTIVE: Informar se o WhatsApp do sistema está pronto para enviar mensagens.
 */
function estaConectado() {
  return LSituacao === 'CONECTADO';
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:41
 * * OBJECTIVE: Devolver o número conectado, só com os dígitos.
 */
function numeroConectado() {
  return (LSocket?.user?.id || '').split(':')[0].split('@')[0];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:42
 * * OBJECTIVE: Devolver o modo, a situação da conexão, o número conectado e, enquanto espera a leitura, o QR code como imagem.
 */
async function consultarSituacao() {
  return {
    modo: MODO_SIMULADO ? 'SIMULADO' : 'REAL',
    situacao: LSituacao,
    numero:
      LSituacao === 'CONECTADO' && !MODO_SIMULADO ? numeroConectado() : null,
    qrcode: LQrCode ? await QRCode.toDataURL(LQrCode) : null
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:43
 * * OBJECTIVE: Apagar os arquivos da sessão, para a próxima conexão pedir um QR code novo. A pasta em si fica, porque no Docker ela é um volume montado.
 */
function apagarSessao() {
  if (!fs.existsSync(PASTA_SESSAO)) {
    return;
  }
  for (const LArquivo of fs.readdirSync(PASTA_SESSAO)) {
    fs.rmSync(path.join(PASTA_SESSAO, LArquivo), {
      recursive: true,
      force: true
    });
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:44
 * * OBJECTIVE: Agendar uma nova conexão, substituindo outra que já estivesse agendada.
 */
function agendarReconexao(ASegundos) {
  clearTimeout(LReconexao);
  LReconexao = setTimeout(() => {
    conectar().catch((LErro) => {
      console.error(`whatsapp: erro ao conectar: ${LErro.message}`);
      agendarReconexao(SEGUNDOS_PARA_RECONECTAR);
    });
  }, ASegundos * 1000);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:45
 * * OBJECTIVE: Tratar as mudanças da conexão: mostrar o QR code, avisar quando conectar e reconectar quando cair; se o aparelho foi desconectado pelo celular, apagar a sessão para gerar um QR code novo.
 */
async function tratarConexao(ASocket, AAtualizacao) {
  if (ASocket !== LSocket) {
    return;
  }
  if (AAtualizacao.qr) {
    LQrCode = AAtualizacao.qr;
    LSituacao = 'AGUARDANDO_QR';
    console.log(
      'whatsapp: leia o QR code com o celular (WhatsApp > Aparelhos conectados > Conectar um aparelho)'
    );
    console.log(
      await QRCode.toString(AAtualizacao.qr, { type: 'terminal', small: true })
    );
  }
  if (AAtualizacao.connection === 'open') {
    LSituacao = 'CONECTADO';
    LQrCode = null;
    console.log(`whatsapp: conectado ao número ${numeroConectado()}`);
  }
  if (AAtualizacao.connection === 'close') {
    LSituacao = 'DESCONECTADO';
    LQrCode = null;
    const LCodigo = AAtualizacao.lastDisconnect?.error?.output?.statusCode;
    if (LCodigo === LBaileys.DisconnectReason.loggedOut) {
      console.log(
        'whatsapp: o aparelho foi desconectado; sessão apagada, um QR code novo será gerado'
      );
      apagarSessao();
      agendarReconexao(0);
    } else if (LCodigo === LBaileys.DisconnectReason.restartRequired) {
      agendarReconexao(0);
    } else {
      console.log(
        `whatsapp: conexão encerrada (código ${LCodigo || 'desconhecido'}); nova tentativa em ${SEGUNDOS_PARA_RECONECTAR} segundos`
      );
      agendarReconexao(SEGUNDOS_PARA_RECONECTAR);
    }
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:46
 * * OBJECTIVE: Devolver o conteúdo de uma enquete enviada, quando o WhatsApp pede para reenviá-la a um aparelho do paciente.
 */
async function buscarMensagemEnviada(AChave) {
  const LConteudo = await LTratadores.buscarConteudoEnquete?.(AChave.id);
  return LConteudo
    ? LBaileys.proto.Message.decode(Buffer.from(LConteudo, 'base64'))
    : undefined;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:47
 * * OBJECTIVE: Informar se o identificador é de uma conversa individual; grupos, status e canais são ignorados.
 */
function conversaIndividual(AJid) {
  return (
    typeof AJid === 'string' &&
    (AJid.endsWith('@s.whatsapp.net') || AJid.endsWith('@lid'))
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:48
 * * OBJECTIVE: Reduzir o texto às letras, sem acento, em maiúsculas, para reconhecer "PARAR" escrito de qualquer jeito.
 */
function normalizarTexto(ATexto) {
  return ATexto.normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:49
 * * OBJECTIVE: Descobrir o identificador com o telefone de quem enviou a mensagem, convertendo o identificador novo do WhatsApp (LID) quando preciso.
 */
async function identificarRemetente(AChave) {
  const LCandidatos = [AChave.remoteJidAlt, AChave.remoteJid].filter(Boolean);
  const LTelefone = LCandidatos.find((AJid) => LBaileys.isPnUser(AJid));
  if (LTelefone) {
    return LBaileys.jidNormalizedUser(LTelefone);
  }
  const LLid = LCandidatos.find((AJid) => LBaileys.isLidUser(AJid));
  const LConvertido = LLid
    ? await LSocket.signalRepository.lidMapping.getPNForLID(LLid)
    : null;
  return LConvertido ? LBaileys.jidNormalizedUser(LConvertido) : null;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:50
 * * OBJECTIVE: Decifrar o voto com o segredo da enquete enviada e devolver os nomes das opções marcadas. A chave depende do formato do identificador de quem criou e de quem votou (telefone ou LID), por isso as combinações são testadas até uma funcionar; devolve null se nenhuma funcionar.
 */
function decifrarVoto(AChaveVoto, AIdEnquete, AConteudo, AVotoCifrado) {
  const LEnquete = LBaileys.proto.Message.decode(
    Buffer.from(AConteudo, 'base64')
  );
  const LSegredo = LEnquete.messageContextInfo?.messageSecret;
  const LCriacao =
    LEnquete.pollCreationMessage ||
    LEnquete.pollCreationMessageV2 ||
    LEnquete.pollCreationMessageV3;
  if (!LSegredo || !LCriacao || !AVotoCifrado) {
    return null;
  }
  const LNormalizar = (ALista) => [
    ...new Set(ALista.filter(Boolean).map(LBaileys.jidNormalizedUser))
  ];
  const LCriadores = LNormalizar([LSocket.user?.id, LSocket.user?.lid]);
  const LVotantes = LNormalizar([
    AChaveVoto.remoteJid,
    AChaveVoto.remoteJidAlt,
    AChaveVoto.participant,
    AChaveVoto.participantAlt
  ]);
  for (const LCriador of LCriadores) {
    for (const LVotante of LVotantes) {
      try {
        const LVoto = LBaileys.decryptPollVote(AVotoCifrado, {
          pollCreatorJid: LCriador,
          pollMsgId: AIdEnquete,
          pollEncKey: LSegredo,
          voterJid: LVotante
        });
        return LCriacao.options
          .map((AOpcao) => AOpcao.optionName)
          .filter((ANome) => {
            const LHash = crypto.createHash('sha256').update(ANome).digest();
            return LVoto.selectedOptions.some((AMarcada) =>
              LHash.equals(Buffer.from(AMarcada))
            );
          });
      } catch {
        // Chave errada para esta combinação: tenta a próxima.
      }
    }
  }
  return null;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:51
 * * OBJECTIVE: Tratar uma mensagem recebida: só interessam votos nas enquetes enviadas pelo sistema e o pedido "PARAR"; todo o resto é descartado sem registro.
 */
async function tratarMensagem(AMensagem) {
  const LChave = AMensagem.key;
  if (!LChave || LChave.fromMe || !AMensagem.message) {
    return;
  }
  if (!conversaIndividual(LChave.remoteJid)) {
    return;
  }
  const LVoto = AMensagem.message.pollUpdateMessage;
  if (LVoto) {
    const LIdEnquete = LVoto.pollCreationMessageKey?.id;
    const LConteudo =
      LIdEnquete && (await LTratadores.buscarConteudoEnquete?.(LIdEnquete));
    if (!LConteudo) {
      return;
    }
    const LOpcoes = decifrarVoto(LChave, LIdEnquete, LConteudo, LVoto.vote);
    if (!LOpcoes) {
      console.error(
        'whatsapp: não foi possível decifrar o voto de uma enquete'
      );
      return;
    }
    await LTratadores.aoVotar?.({ idMensagem: LIdEnquete, opcoes: LOpcoes });
    return;
  }
  const LTexto =
    AMensagem.message.conversation ||
    AMensagem.message.extendedTextMessage?.text;
  if (LTexto && normalizarTexto(LTexto) === 'PARAR') {
    const LRemetente = await identificarRemetente(LChave);
    if (LRemetente) {
      await LTratadores.aoPedirParada?.({
        telefone: LRemetente.split('@')[0],
        destino: LRemetente
      });
    }
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:52
 * * OBJECTIVE: Tratar as mensagens novas uma a uma; o erro de uma não impede as outras.
 */
async function tratarMensagensRecebidas(ASocket, AEvento) {
  if (ASocket !== LSocket || AEvento.type !== 'notify') {
    return;
  }
  for (const LMensagem of AEvento.messages) {
    try {
      await tratarMensagem(LMensagem);
    } catch (LErro) {
      console.error(
        `whatsapp: erro ao tratar uma mensagem recebida: ${LErro.message}`
      );
    }
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:53
 * * OBJECTIVE: Abrir a conexão com o WhatsApp usando a sessão salva na pasta; sem sessão, o WhatsApp manda um QR code para ler. Usa a versão atual do WhatsApp Web, a API não aparece como online e não baixa o histórico de conversas.
 */
async function conectar() {
  LBaileys = LBaileys || (await import('baileys'));
  const { state: LEstado, saveCreds: LSalvarCredenciais } =
    await LBaileys.useMultiFileAuthState(PASTA_SESSAO);
  // A versão embutida na biblioteca envelhece e o WhatsApp recusa conectar; se a busca falhar, usa a embutida.
  const { version: LVersao } = await LBaileys.fetchLatestWaWebVersion();
  LSituacao = 'CONECTANDO';
  const LNovoSocket = LBaileys.makeWASocket({
    version: LVersao,
    auth: LEstado,
    logger: LOGGER_SILENCIOSO,
    browser: LBaileys.Browsers.ubuntu('DoseCerta'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    getMessage: buscarMensagemEnviada
  });
  LSocket = LNovoSocket;
  LNovoSocket.ev.on('creds.update', LSalvarCredenciais);
  // Um erro dentro dos eventos é só registrado: sem isso, ele derrubaria a API inteira.
  LNovoSocket.ev.on('connection.update', (AAtualizacao) =>
    tratarConexao(LNovoSocket, AAtualizacao).catch((LErro) =>
      console.error(`whatsapp: erro ao tratar a conexão: ${LErro.message}`)
    )
  );
  LNovoSocket.ev.on('messages.upsert', (AEvento) =>
    tratarMensagensRecebidas(LNovoSocket, AEvento).catch((LErro) =>
      console.error(`whatsapp: erro ao tratar as mensagens: ${LErro.message}`)
    )
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:54
 * * OBJECTIVE: Ligar o WhatsApp ao subir a API; no modo simulado nada é conectado e as mensagens só aparecem no log.
 */
function iniciar() {
  if (MODO_SIMULADO) {
    console.log('whatsapp: modo simulado, as mensagens só aparecem no log');
    return;
  }
  agendarReconexao(0);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:55
 * * OBJECTIVE: Desconectar o aparelho e apagar a sessão, para outro celular ler um QR code novo. Conectado, só segue depois de o WhatsApp confirmar a remoção do aparelho; sem a confirmação, lança o erro e a sessão continua.
 */
async function desconectar() {
  if (LSituacao === 'CONECTADO') {
    // O logout da biblioteca fecha a conexão sem esperar a resposta, e o aparelho pode continuar no celular.
    const LResposta = await LSocket.query({
      tag: 'iq',
      attrs: { to: LBaileys.S_WHATSAPP_NET, type: 'set', xmlns: 'md' },
      content: [
        {
          tag: 'remove-companion-device',
          attrs: { jid: LSocket.user.id, reason: 'user_initiated' }
        }
      ]
    });
    // Sem resposta dentro do prazo, a biblioteca devolve vazio em vez de lançar erro.
    if (!LResposta) {
      throw new Error('o WhatsApp não confirmou a remoção do aparelho');
    }
  }
  LSocket?.end(undefined);
  apagarSessao();
  agendarReconexao(0);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:56
 * * OBJECTIVE: Conferir se o telefone tem conta no WhatsApp e devolver o identificador para o envio, que pode vir sem o nono dígito em contas antigas.
 */
async function verificarNumero(ATelefone) {
  if (MODO_SIMULADO) {
    return {
      existe: !TELEFONES_SEM_CONTA_SIMULADO.includes(ATelefone),
      destino: `${ATelefone}@s.whatsapp.net`
    };
  }
  const [LResultado] = await LSocket.onWhatsApp(ATelefone);
  return LResultado?.exists
    ? { existe: true, destino: LResultado.jid }
    : { existe: false, destino: null };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:57
 * * OBJECTIVE: Enviar uma mensagem de texto.
 */
async function enviarTexto(ADestino, ATexto) {
  if (MODO_SIMULADO) {
    console.log(`whatsapp (simulado): mensagem para ${ADestino}: ${ATexto}`);
    return;
  }
  await LSocket.sendMessage(ADestino, { text: ATexto });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 19:58
 * * OBJECTIVE: Enviar uma enquete de escolha única e devolver o id da mensagem e o conteúdo enviado, necessário para decifrar os votos.
 */
async function enviarEnquete(ADestino, APergunta, AOpcoes) {
  if (MODO_SIMULADO) {
    console.log(
      `whatsapp (simulado): enquete para ${ADestino}: ${APergunta} [${AOpcoes.join(' | ')}]`
    );
    return {
      idMensagem: `SIMULADO-${crypto.randomUUID()}`,
      conteudo: ''
    };
  }
  const LMensagem = await LSocket.sendMessage(ADestino, {
    poll: { name: APergunta, values: AOpcoes, selectableCount: 1 }
  });
  return {
    idMensagem: LMensagem.key.id,
    conteudo: Buffer.from(
      LBaileys.proto.Message.encode(LMensagem.message).finish()
    ).toString('base64')
  };
}

module.exports = {
  MODO_SIMULADO,
  definirTratadores,
  iniciar,
  estaConectado,
  consultarSituacao,
  desconectar,
  verificarNumero,
  enviarTexto,
  enviarEnquete
};
