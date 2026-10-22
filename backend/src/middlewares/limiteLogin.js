const { rateLimit } = require('express-rate-limit');

const JANELA_LOGIN_MINUTOS = 15;
const TENTATIVAS_LOGIN_ERRADAS = 10;

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 22/10/2026 20:39
 * * OBJECTIVE: Limitar as tentativas de login erradas de cada IP (10 a cada 15 minutos), contra quem tenta descobrir senhas por tentativa e erro; o login certo não conta.
 */
const limitarTentativasLogin = rateLimit({
  windowMs: JANELA_LOGIN_MINUTOS * 60 * 1000,
  limit: TENTATIVAS_LOGIN_ERRADAS,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    erro: 'muitas tentativas de login, tente novamente em alguns minutos'
  }
});

module.exports = {
  limitarTentativasLogin
};
