import { date } from 'quasar';

// Rótulo e cor de cada situação da receita, com os valores do banco.
export const SITUACOES_RECEITA = {
  ATIVA: { rotulo: 'Ativa', cor: 'positive' },
  CONCLUIDA: { rotulo: 'Concluída', cor: 'info' },
  CANCELADA: { rotulo: 'Cancelada', cor: 'grey-6' }
};

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:27
 * * OBJECTIVE: Mostrar uma data e hora da API no formato DD/MM/AAAA HH:mm, no fuso do navegador.
 */
export function formatarDataHora(AData) {
  return AData ? date.formatDate(AData, 'DD/MM/YYYY HH:mm') : '';
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:27
 * * OBJECTIVE: Deixar o texto em minúsculas e sem acentos, para a busca achar "Antônio" digitando "antonio".
 */
function normalizarTexto(ATexto) {
  // NFD separa a letra do acento, e \p{M} apaga os acentos separados.
  return ATexto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * * AUTHOR: Vinícius Gonçalves
 * * DATE: 25/10/2026 19:27
 * * OBJECTIVE: Filtrar os registros cujo nome contém o texto digitado, sem diferenciar maiúsculas nem acentos.
 */
export function filtrarPorNome(ALista, ATexto) {
  const LTexto = normalizarTexto(ATexto);
  return ALista.filter((ARegistro) =>
    normalizarTexto(ARegistro.nome).includes(LTexto)
  );
}
