// Duração da "hora" usada nas regras de tempo (reenvio, intervalo entre doses, tolerância de atraso).
// Só em teste, e nunca em produção, MINUTOS_POR_HORA_TESTE encolhe essa hora para acelerar os ciclos.
const MINUTOS_POR_HORA_TESTE = Number(process.env.MINUTOS_POR_HORA_TESTE) || 0;
const TESTE_ACELERADO =
  process.env.NODE_ENV !== 'production' && MINUTOS_POR_HORA_TESTE > 0;
const SEGUNDOS_POR_HORA = TESTE_ACELERADO ? MINUTOS_POR_HORA_TESTE * 60 : 3600;

module.exports = {
  TESTE_ACELERADO,
  MINUTOS_POR_HORA_TESTE,
  MILISSEGUNDOS_POR_HORA: SEGUNDOS_POR_HORA * 1000,
  // Valores no formato INTERVAL do PostgreSQL.
  UMA_HORA: `${SEGUNDOS_POR_HORA} seconds`,
  TOLERANCIA_ATRASO: `${SEGUNDOS_POR_HORA / 2} seconds`,
  // Com a hora encolhida, o agendador confere com mais frequência para manter a precisão.
  SEGUNDOS_ENTRE_RODADAS: TESTE_ACELERADO
    ? Math.max(2, Math.min(15, Math.round(SEGUNDOS_POR_HORA / 6)))
    : 60
};
