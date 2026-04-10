/**
 * Substitui todos os dígitos de uma string por asteriscos para o modo de privacidade.
 * Preserva símbolos como 'R$', ',', '.', etc.
 */
export const maskValue = (value: string | number, isPrivate: boolean): string => {
  const strValue = typeof value === 'number' ? value.toString() : value;
  if (!isPrivate) return strValue;

  // Substitui números, pontos e vírgulas por *, mantendo apenas símbolos de moeda e espaços
  return strValue.replace(/[0-9.,]/g, '*');
};
