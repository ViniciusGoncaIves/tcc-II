const db = require('../configs');
const repository = require('../repositories/receitas');
const alertasRepository = require('../repositories/alertas');
const pacientesRepository = require('../repositories/pacientes');
const medicamentosRepository = require('../repositories/medicamentos');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Tirar os espaços das pontas da observação e das doses e tratar observação vazia como não informada.
 */
function normalizarReceita(ADados) {
  return {
    idpaciente: ADados.idpaciente,
    observacao: (ADados.observacao || '').trim() || null,
    itens: ADados.itens.map((AItem) => ({
      idmedicamento: AItem.idmedicamento,
      dose: AItem.dose.trim(),
      intervalo_horas: AItem.intervalo_horas,
      duracao_dias: AItem.duracao_dias
    }))
  };
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Garantir que o paciente da receita existe (404) e está ativo (409).
 */
async function conferirPaciente(AIdPaciente) {
  const LPaciente = await pacientesRepository.buscarPacientePorId(AIdPaciente);
  if (!LPaciente) {
    throw new ErroApi(
      404,
      `O paciente com id ${AIdPaciente} não foi encontrado`
    );
  }
  if (!LPaciente.ativo) {
    throw new ErroApi(409, 'o paciente está inativo');
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Garantir que todos os medicamentos da receita existem (404) e estão ativos (409).
 */
async function conferirMedicamentos(AItens) {
  for (const LItem of AItens) {
    const LMedicamento = await medicamentosRepository.buscarMedicamentoPorId(
      LItem.idmedicamento
    );
    if (!LMedicamento) {
      throw new ErroApi(
        404,
        `O medicamento com id ${LItem.idmedicamento} não foi encontrado`
      );
    }
    if (!LMedicamento.ativo) {
      throw new ErroApi(409, `o medicamento ${LMedicamento.nome} está inativo`);
    }
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Emitir a receita em uma única transação: grava a receita, os itens e o alerta da dose 1 de cada item, ou nada em caso de erro.
 */
async function emitirReceita(ADados, AIdUsuario) {
  const LDados = normalizarReceita(ADados);
  await conferirPaciente(LDados.idpaciente);
  await conferirMedicamentos(LDados.itens);
  return db.transacao(async (AConexao) => {
    const LReceita = await repository.cadastrarReceita(
      AConexao,
      LDados,
      AIdUsuario
    );
    LReceita.itens = [];
    for (const LItem of LDados.itens) {
      const LItemReceita = await repository.cadastrarItemReceita(
        AConexao,
        LReceita.idreceita,
        LItem
      );
      await alertasRepository.cadastrarAlertaPrimeiraDose(
        AConexao,
        LItemReceita.iditensreceita
      );
      LReceita.itens.push(LItemReceita);
    }
    return LReceita;
  });
}

module.exports = {
  emitirReceita
};
