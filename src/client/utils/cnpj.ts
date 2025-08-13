export const isValidCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let mod = sum % 11;
  const digit1 = mod < 2 ? 0 : 11 - mod;

  if (digit1 !== parseInt(cleaned[12])) return false;

  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  mod = sum % 11;
  const digit2 = mod < 2 ? 0 : 11 - mod;

  return digit2 === parseInt(cleaned[13]);
};

export const formatCNPJ = (cnpj: string): string => {
  if (!isValidCNPJ(cnpj)) return cnpj;
  
  const cleaned = cnpj.replace(/\D/g, '');
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};