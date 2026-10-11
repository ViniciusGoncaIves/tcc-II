const service = require('../services/pacientes');
const ErroApi = require('../errors/ErroApi');

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Devolver a lista de pacientes cadastrados.
 */
async function buscarPacientes (req, res) {
  const LPacientes = await service.buscarPacientes();
  return res.status(200).json(LPacientes);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Devolver o paciente do id informado ou 404 quando ele não existe.
 */
async function buscarPacientePorId (req, res) {
  const LPaciente = await service.buscarPacientePorId(req.params.id);
  if (!LPaciente) {
    throw new ErroApi(404, `O paciente com id ${req.params.id} não foi encontrado`);
  }
  return res.status(200).json(LPaciente);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 13:26
 * * OBJECTIVE: Validar os campos obrigatórios e cadastrar um novo paciente.
 */
async function cadastrarPaciente (req, res) {
  const LDados = req.body || {};
  if (!LDados.nome || !LDados.telefone) {
    throw new ErroApi(400, 'campos obrigatórios faltando');
  }
  const LPaciente = await service.cadastrarPaciente(LDados);
  return res.status(201).json(LPaciente);
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente
}
