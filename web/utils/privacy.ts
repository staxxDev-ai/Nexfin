/**
 * Substitui todos os dígitos de uma string por asteriscos para o modo de privacidade.
 * Preserva símbolos como 'R$', ',', '.', etc.
 */
export const maskValue = (value: string | number, isPrivate: boolean): string => {
  const strValue = typeof value === 'number' ? value.toString() : value;
  if (!isPrivate) return strValue;

  // Substitui apenas números por *, mantendo a pontuação e símbolos de moeda
  return strValue.replace(/[0-9]/g, '*');
};
