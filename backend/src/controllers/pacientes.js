const service = require('../services/pacientes');

const TELEFONE_DUPLICADO = '23505';

async function buscarPacientes (req, res) {
  try {
    const pacientes = await service.buscarPacientes();
    return res.status(200).json(pacientes);
  } catch (erro) {
    return res.status(500).json({ erro: erro.message });
  }
}

async function buscarPacientePorId (req, res) {
  try {
    const paciente = await service.buscarPacientePorId(req.params.id);
    if (!paciente) {
      return res.status(404).json({
        erro: `O paciente com id ${req.params.id} não foi encontrado`
      })
    }
    return res.status(200).json(paciente);
  } catch (erro) {
    return res.status(500).json({ erro: erro.message });
  }
}

async function cadastrarPaciente (req, res) {
  try {
    const data = req.body;
    if (!data.nome || !data.telefone) {
      return res.status(400).json({
        erro: 'campos obrigatórios faltando'
      })
    }
    const paciente = await service.cadastrarPaciente(data);
    return res.status(201).json(paciente);
  } catch (erro) {
    if (erro.code === TELEFONE_DUPLICADO) {
      return res.status(409).json({
        erro: 'já existe um paciente com esse telefone'
      })
    }
    return res.status(500).json({ erro: erro.message });
  }
}

module.exports = {
  buscarPacientes,
  buscarPacientePorId,
  cadastrarPaciente
}
