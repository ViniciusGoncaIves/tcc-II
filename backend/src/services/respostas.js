const alertasService = require('./alertas');
const pacientesService = require('./pacientes');
const alertasRepository = require('../repositories/alertas');
const enquetesRepository = require('../repositories/enquetes');
const pacientesRepository = require('../repositories/pacientes');
const whatsapp = require('../integrations/whatsapp');

const [OPCAO_TOMEI, OPCAO_AINDA_NAO, OPCAO_PARAR] =
  alertasService.OPCOES_PRIMEIRA_DOSE;
const PERGUNTA_PARADA = 'Deseja mesmo parar de receber todos os lembretes?';
const OPCAO_CONFIRMAR_PARADA = 'Sim, parar';
const OPCAO_CONTINUAR = 'Não, continuar';
const MENSAGEM_INDISPONIVEL = 'Esta dose não está mais aguardando confirmação.';

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:03
 * * OBJECTIVE: Escrever um horário no fuso de Brasília para as respostas: "às 18:05" se for hoje, ou "no dia 30/10, às 02:05".
 */
function formatarHorario(AData) {
  const LOpcoes = { timeZone: 'America/Sao_Paulo' };
  const LDia = (AValor) =>
    new Date(AValor).toLocaleDateString('pt-BR', {
      ...LOpcoes,
      day: '2-digit',
      month: '2-digit'
    });
  const LHora = new Date(AData).toLocaleTimeString('pt-BR', {
    ...LOpcoes,
    hour: '2-digit',
    minute: '2-digit'
  });
  return LDia(AData) === LDia(Date.now())
    ? `às ${LHora}`
    : `no dia ${LDia(AData)}, às ${LHora}`;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:04
 * * OBJECTIVE: Enviar a enquete que confirma o pedido de parada, para um toque sem querer não cancelar os alertas.
 */
async function enviarConfirmacaoParada(AIdPaciente, ADestino) {
  const LEnquete = await whatsapp.enviarEnquete(ADestino, PERGUNTA_PARADA, [
    OPCAO_CONFIRMAR_PARADA,
    OPCAO_CONTINUAR
  ]);
  await enquetesRepository.cadastrarEnquete({
    id_mensagem: LEnquete.idMensagem,
    tipo: 'CONFIRMACAO_PARADA',
    idpaciente: AIdPaciente,
    idalerta: null,
    destino: ADestino,
    conteudo: LEnquete.conteudo
  });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:05
 * * OBJECTIVE: Responder ao voto na enquete da dose 1: "Sim, tomei" confirma a dose; "Ainda não" só orienta (ou avisa que já foi confirmada); "Parar de receber alertas" pede a confirmação da parada.
 */
async function responderVotoPrimeiraDose(AEnquete, AOpcao) {
  if (AOpcao === OPCAO_TOMEI) {
    const LResultado = await alertasService.confirmarPrimeiraDose(
      AEnquete.idalerta
    );
    if (LResultado.situacao === 'INDISPONIVEL') {
      await whatsapp.enviarTexto(AEnquete.destino, MENSAGEM_INDISPONIVEL);
    }
    if (LResultado.situacao === 'CONFIRMADA') {
      const LNome = LResultado.nome_paciente.split(' ')[0];
      const LMedicamento = `${LResultado.nome_medicamento} ${LResultado.dose}`;
      await whatsapp.enviarTexto(
        AEnquete.destino,
        LResultado.proxima_dose
          ? `Obrigado, ${LNome}! Primeira dose de ${LMedicamento} confirmada. A próxima será ${formatarHorario(LResultado.proxima_dose)}.`
          : `Obrigado, ${LNome}! Dose de ${LMedicamento} confirmada.`
      );
    }
    return;
  }
  if (AOpcao === OPCAO_AINDA_NAO) {
    const LSituacao = await alertasRepository.buscarSituacaoAlerta(
      AEnquete.idalerta
    );
    let LTexto = MENSAGEM_INDISPONIVEL;
    if (LSituacao?.status === 'CONFIRMADO') {
      LTexto = `Sua primeira dose já foi confirmada ${formatarHorario(LSituacao.horario_confirmacao)}. Se houve engano, procure a unidade de saúde.`;
    } else if (LSituacao?.status === 'ENVIADO') {
      LTexto = `Tudo bem! Quando tomar, é só marcar '${OPCAO_TOMEI}' nesta enquete.`;
    }
    await whatsapp.enviarTexto(AEnquete.destino, LTexto);
    return;
  }
  if (AOpcao === OPCAO_PARAR) {
    await enviarConfirmacaoParada(AEnquete.idpaciente, AEnquete.destino);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:06
 * * OBJECTIVE: Responder ao voto na enquete de confirmação da parada: "Sim, parar" cancela as receitas ativas e inativa o paciente; "Não, continuar" mantém tudo como está.
 */
async function responderVotoParada(AEnquete, AOpcao) {
  if (AOpcao === OPCAO_CONFIRMAR_PARADA) {
    await pacientesService.pararAlertasDoPaciente(AEnquete.idpaciente);
    await whatsapp.enviarTexto(
      AEnquete.destino,
      'Pronto, você não receberá mais lembretes. Se quiser voltar a receber, procure a unidade de saúde.'
    );
    return;
  }
  if (AOpcao === OPCAO_CONTINUAR) {
    await whatsapp.enviarTexto(
      AEnquete.destino,
      'Certo, você continuará recebendo os lembretes normalmente.'
    );
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:07
 * * OBJECTIVE: Tratar o voto decifrado de uma enquete enviada pelo sistema; voto desmarcado (nenhuma opção) não muda nada.
 */
async function tratarVoto(AVoto) {
  const LEnquete = await enquetesRepository.buscarEnquetePorMensagem(
    AVoto.idMensagem
  );
  if (!LEnquete || AVoto.opcoes.length === 0) {
    return;
  }
  if (LEnquete.tipo === 'CONFIRMACAO_DOSE') {
    await responderVotoPrimeiraDose(LEnquete, AVoto.opcoes[0]);
  } else {
    await responderVotoParada(LEnquete, AVoto.opcoes[0]);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:08
 * * OBJECTIVE: Montar as formas do telefone que podem estar no cadastro: o WhatsApp devolve contas antigas sem o nono dígito.
 */
function variacoesTelefone(ATelefone) {
  return ATelefone.length === 12
    ? [ATelefone, `${ATelefone.slice(0, 4)}9${ATelefone.slice(4)}`]
    : [ATelefone];
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:09
 * * OBJECTIVE: Tratar o "PARAR" escrito: se vier de um paciente ativo cadastrado, envia a enquete de confirmação; de qualquer outro número, é ignorado.
 */
async function tratarPedidoParada(APedido) {
  const LPaciente = await pacientesRepository.buscarPacienteAtivoPorTelefones(
    variacoesTelefone(APedido.telefone)
  );
  if (LPaciente) {
    await enviarConfirmacaoParada(LPaciente.idpaciente, APedido.destino);
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 29/10/2026 20:10
 * * OBJECTIVE: Devolver o conteúdo guardado de uma enquete enviada, usado para decifrar os votos.
 */
async function buscarConteudoEnquete(AIdMensagem) {
  const LEnquete =
    await enquetesRepository.buscarEnquetePorMensagem(AIdMensagem);
  return LEnquete?.conteudo || null;
}

module.exports = {
  tratadores: {
    aoVotar: tratarVoto,
    aoPedirParada: tratarPedidoParada,
    buscarConteudoEnquete
  },
  tratarVoto,
  tratarPedidoParada
};
