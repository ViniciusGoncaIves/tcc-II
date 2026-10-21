const ErroApi = require('../errors/ErroApi');

const REGISTRO_DUPLICADO = '23505';
const TEXTO_MUITO_LONGO = '22001';
const JSON_INVALIDO = 'entity.parse.failed';

const MENSAGENS_DUPLICIDADE = {
  paciente_telefone_key: 'já existe um paciente com esse telefone',
  medicamento_nome_key: 'já existe um medicamento com esse nome'
};

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 14:41
 * * OBJECTIVE: Responder 404 no formato padrão quando nenhuma rota atende a requisição.
 */
function rotaNaoEncontrada(req, res) {
  return res.status(404).json({ erro: 'rota não encontrada' });
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 14:41
 * * OBJECTIVE: Converter qualquer erro da API em uma resposta no formato padrão { erro }.
 */
function tratarErros(AErro, req, res, next) {
  if (res.headersSent) {
    return next(AErro);
  }
  if (AErro instanceof ErroApi) {
    return res.status(AErro.status).json({ erro: AErro.message });
  }
  if (AErro.type === JSON_INVALIDO) {
    return res
      .status(400)
      .json({ erro: 'o corpo da requisição não é um JSON válido' });
  }
  if (AErro.code === REGISTRO_DUPLICADO) {
    const LMensagem =
      MENSAGENS_DUPLICIDADE[AErro.constraint] || 'registro já cadastrado';
    return res.status(409).json({ erro: LMensagem });
  }
  if (AErro.code === TEXTO_MUITO_LONGO) {
    return res
      .status(400)
      .json({ erro: 'um dos campos excede o tamanho máximo permitido' });
  }
  console.error(AErro);
  return res.status(500).json({ erro: 'erro interno do servidor' });
}

module.exports = {
  rotaNaoEncontrada,
  tratarErros
};
