// CNPJ numérico e alfanumérico (vigente desde 31/07/2026).
// Regra da Receita (IN RFB 2.229/2024): módulo 11; valor do caractere = código ASCII - 48 (A vale 17).
// As 12 primeiras posições podem ter letras; as 2 últimas (dígitos verificadores) são sempre números.

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizarCnpj(valor: string): string {
  return valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function digito(base: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < base.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(valor: string): boolean {
  const c = normalizarCnpj(valor);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return false;
  if (/^(\d)\1{13}$/.test(c)) return false;
  const d1 = digito(c.slice(0, 12), PESOS_1);
  const d2 = digito(c.slice(0, 12) + String(d1), PESOS_2);
  return c.endsWith(`${d1}${d2}`);
}

// Máscara progressiva para o campo: XX.XXX.XXX/XXXX-DD
export function mascaraCnpj(valor: string): string {
  const c = normalizarCnpj(valor).slice(0, 14);
  let saida = "";
  for (let i = 0; i < c.length; i++) {
    if (i === 2 || i === 5) saida += ".";
    if (i === 8) saida += "/";
    if (i === 12) saida += "-";
    saida += c[i];
  }
  return saida;
}
