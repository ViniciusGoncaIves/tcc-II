const ErroApi = require('../errors/ErroApi');

const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const VALORES_FILTRO_ATIVO = ['true', 'false'];
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANHO_MINIMO_SENHA = 8;
const TIPOS_USUARIO = ['ADMIN', 'OPERADOR'];
const INTERVALO_HORAS_MAXIMO = 168;
const DURACAO_DIAS_MAXIMO = 365;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 14:41
 * * OBJECTIVE: Barrar a requisição quando o id da rota não está no formato UUID.
 */
function validarId(req, res, next) {
  if (!FORMATO_UUID.test(req.params.id)) {
    throw new ErroApi(400, 'o id informado é inválido');
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 16:51
 * * OBJECTIVE: Informar se o texto é uma data existente no formato AAAA-MM-DD.
 */
function dataValida(AData) {
  if (!FORMATO_DATA.test(AData)) {
    return false;
  }
  const LData = new Date(`${AData}T00:00:00Z`);
  return (
    !Number.isNaN(LData.getTime()) && LData.toISOString().startsWith(AData)
  );
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 20:57
 * * OBJECTIVE: Informar se o valor é um texto com algum conteúdo além de espaços.
 */
function textoPreenchido(AValor) {
  return typeof AValor === 'string' && AValor.trim() !== '';
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 11/10/2026 16:51
 * * OBJECTIVE: Barrar a requisição quando os dados do paciente estão incompletos ou inválidos.
 */
function validarPaciente(req, res, next) {
  const LDados = req.body || {};
  if (!textoPreenchido(LDados.nome) || !textoPreenchido(LDados.telefone)) {
    throw new ErroApi(400, 'campos obrigatórios faltando');
  }
  if (LDados.data_nascimento && !dataValida(LDados.data_nascimento)) {
    throw new ErroApi(
      400,
      'a data de nascimento é inválida, use o formato AAAA-MM-DD'
    );
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 19:31
 * * OBJECTIVE: Barrar a requisição quando o filtro ativo não for true ou false.
 */
function validarFiltroAtivo(req, res, next) {
  const LAtivo = req.query.ativo;
  if (LAtivo !== undefined && !VALORES_FILTRO_ATIVO.includes(LAtivo)) {
    throw new ErroApi(400, 'o filtro ativo deve ser true ou false');
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 20/10/2026 20:49
 * * OBJECTIVE: Barrar a requisição quando o nome do medicamento não foi informado.
 */
function validarMedicamento(req, res, next) {
  const LDados = req.body || {};
  if (!textoPreenchido(LDados.nome)) {
    throw new ErroApi(400, 'campos obrigatórios faltando');
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Informar se o campo foi enviado com algum valor.
 */
function informado(AValor) {
  return AValor !== undefined && AValor !== null && AValor !== '';
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Informar se a senha tem o tamanho mínimo e não é formada só por espaços.
 */
function senhaValida(ASenha) {
  return textoPreenchido(ASenha) && ASenha.length >= TAMANHO_MINIMO_SENHA;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Conferir nome, e-mail, senha e tipo do usuário, lançando 400 no primeiro problema encontrado.
 */
function conferirDadosUsuario(ADados, ASenhaObrigatoria) {
  if (!textoPreenchido(ADados.nome) || !textoPreenchido(ADados.email)) {
    throw new ErroApi(400, 'campos obrigatórios faltando');
  }
  if (!FORMATO_EMAIL.test(ADados.email.trim())) {
    throw new ErroApi(400, 'o e-mail informado é inválido');
  }
  if (
    (ASenhaObrigatoria || informado(ADados.senha)) &&
    !senhaValida(ADados.senha)
  ) {
    throw new ErroApi(
      400,
      `a senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`
    );
  }
  if (
    informado(ADados.tipo_usuario) &&
    !TIPOS_USUARIO.includes(ADados.tipo_usuario)
  ) {
    throw new ErroApi(400, 'o tipo de usuário deve ser ADMIN ou OPERADOR');
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Barrar o cadastro de usuário com dados incompletos ou inválidos; a senha é obrigatória.
 */
function validarCadastroUsuario(req, res, next) {
  conferirDadosUsuario(req.body || {}, true);
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Barrar a alteração de usuário com dados incompletos ou inválidos; a senha é opcional.
 */
function validarAlteracaoUsuario(req, res, next) {
  conferirDadosUsuario(req.body || {}, false);
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Barrar o login quando e-mail ou senha não foram informados.
 */
function validarLogin(req, res, next) {
  const LDados = req.body || {};
  if (!textoPreenchido(LDados.email) || !textoPreenchido(LDados.senha)) {
    throw new ErroApi(400, 'e-mail e senha são obrigatórios');
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 12:29
 * * OBJECTIVE: Barrar a troca de senha sem a senha atual, com nova senha curta ou igual à atual.
 */
function validarNovaSenha(req, res, next) {
  const LDados = req.body || {};
  if (!textoPreenchido(LDados.senha_atual)) {
    throw new ErroApi(400, 'a senha atual é obrigatória');
  }
  if (!senhaValida(LDados.nova_senha)) {
    throw new ErroApi(
      400,
      `a nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`
    );
  }
  if (LDados.nova_senha === LDados.senha_atual) {
    throw new ErroApi(400, 'a nova senha deve ser diferente da atual');
  }
  return next();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Informar se o valor é um texto no formato UUID.
 */
function uuidValido(AValor) {
  return typeof AValor === 'string' && FORMATO_UUID.test(AValor);
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Informar se o valor é um número inteiro entre o mínimo e o máximo, inclusive.
 */
function inteiroEntre(AValor, AMinimo, AMaximo) {
  return Number.isInteger(AValor) && AValor >= AMinimo && AValor <= AMaximo;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Conferir os dados de um item da receita, lançando 400 com a posição do item no primeiro problema encontrado.
 */
function conferirItemReceita(AItem, APosicao) {
  if (!uuidValido(AItem.idmedicamento)) {
    throw new ErroApi(400, `item ${APosicao}: o id do medicamento é inválido`);
  }
  if (!textoPreenchido(AItem.dose)) {
    throw new ErroApi(400, `item ${APosicao}: a dose é obrigatória`);
  }
  if (!inteiroEntre(AItem.intervalo_horas, 1, INTERVALO_HORAS_MAXIMO)) {
    throw new ErroApi(
      400,
      `item ${APosicao}: o intervalo deve ser um número inteiro de 1 a ${INTERVALO_HORAS_MAXIMO} horas`
    );
  }
  if (!inteiroEntre(AItem.duracao_dias, 1, DURACAO_DIAS_MAXIMO)) {
    throw new ErroApi(
      400,
      `item ${APosicao}: a duração deve ser um número inteiro de 1 a ${DURACAO_DIAS_MAXIMO} dias`
    );
  }
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Montar a chave de medicamento e dose do item, ignorando maiúsculas e espaços, para encontrar itens repetidos na receita.
 */
function chaveItemReceita(AItem) {
  const LDose = AItem.dose.replace(/\s+/g, '').toUpperCase();
  return `${AItem.idmedicamento.toLowerCase()}|${LDose}`;
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 21/10/2026 19:32
 * * OBJECTIVE: Barrar a emissão de receita com paciente, observação ou itens inválidos, ou com o mesmo medicamento repetido na mesma dose.
 */
function validarReceita(req, res, next) {
  const LDados = req.body || {};
  if (!uuidValido(LDados.idpaciente)) {
    throw new ErroApi(400, 'o id do paciente é inválido');
  }
  if (informado(LDados.observacao) && typeof LDados.observacao !== 'string') {
    throw new ErroApi(400, 'a observação deve ser um texto');
  }
  if (!Array.isArray(LDados.itens) || LDados.itens.length === 0) {
    throw new ErroApi(400, 'a receita deve ter pelo menos um item');
  }
  const LChaves = new Set();
  for (const [LIndice, LItem] of LDados.itens.entries()) {
    const LPosicao = LIndice + 1;
    conferirItemReceita(LItem || {}, LPosicao);
    const LChave = chaveItemReceita(LItem);
    if (LChaves.has(LChave)) {
      throw new ErroApi(
        400,
        `item ${LPosicao}: o medicamento já foi incluído nesta receita com a mesma dose`
      );
    }
    LChaves.add(LChave);
  }
  return next();
}

module.exports = {
  validarId,
  validarPaciente,
  validarFiltroAtivo,
  validarMedicamento,
  validarCadastroUsuario,
  validarAlteracaoUsuario,
  validarLogin,
  validarNovaSenha,
  validarReceita
};
