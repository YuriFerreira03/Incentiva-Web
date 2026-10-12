import { z } from "zod";
import { LIMITE_IMPACTO } from "../constantes";
import type { PreferenciasForm } from "../types";
import { cnpjValido } from "../utils/cnpj";

const cnpjCampo = z
  .string()
  .min(1, "CNPJ é obrigatório")
  .refine(cnpjValido, "CNPJ inválido. Confira os números e as letras.");

const ufCampo = z.string().regex(/^[A-Z]{2}$/, "Selecione o estado");

const obrigatorio = (rotulo: string, min = 2) =>
  z.string().trim().min(min, `${rotulo} é obrigatório`);

export const entidadeSchema = z.object({
  cnpj: cnpjCampo,
  razao_social: obrigatorio("Razão social", 3),
  tipo: z.string().min(1, "Selecione o tipo da entidade"),
  uf: ufCampo,
  municipio: obrigatorio("Município"),
  responsavel_nome: obrigatorio("Nome do responsável"),
  responsavel_cargo: z.string(),
  responsavel_telefone: z.string(),
});
export type EntidadeFormData = z.infer<typeof entidadeSchema>;

export const empresaSchema = z.object({
  cnpj: cnpjCampo,
  razao_social: obrigatorio("Razão social", 3),
  uf: ufCampo,
  municipio: obrigatorio("Município"),
  porte: z.string().min(1, "Selecione o porte da empresa"),
  setor: z.string(),
  regime_tributario: z.string(),
  responsavel_nome: obrigatorio("Nome do responsável"),
  responsavel_cargo: z.string(),
  responsavel_email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
  responsavel_telefone: z.string(),
  aceite_termos: z.boolean().refine((v) => v, "É necessário aceitar os termos de uso"),
  aceite_lgpd: z
    .boolean()
    .refine((v) => v, "É necessário autorizar o tratamento dos dados (LGPD)"),
});
export type EmpresaFormData = z.infer<typeof empresaSchema>;

// Campos validados em cada passo do cadastro da empresa
export const CAMPOS_PASSO_EMPRESA: (keyof EmpresaFormData)[] = [
  "cnpj",
  "razao_social",
  "uf",
  "municipio",
  "porte",
  "setor",
  "regime_tributario",
];
export const CAMPOS_PASSO_RESPONSAVEL: (keyof EmpresaFormData)[] = [
  "responsavel_nome",
  "responsavel_cargo",
  "responsavel_email",
  "responsavel_telefone",
];

export function lerValor(texto: string): number | null {
  const t = texto.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Preferências não usam o react-hook-form (são listas); validação manual.
export function validarPreferencias(p: PreferenciasForm): string | null {
  const min = lerValor(p.valorMin);
  const max = lerValor(p.valorMax);
  if (p.valorMin.trim() && min === null) return "O valor mínimo é inválido.";
  if (p.valorMax.trim() && max === null) return "O valor máximo é inválido.";
  if (min !== null && max !== null && min > max) {
    return "O valor mínimo não pode ser maior que o máximo.";
  }
  if (p.impacto.length > LIMITE_IMPACTO) {
    return `O texto sobre impacto passa de ${LIMITE_IMPACTO} caracteres.`;
  }
  return null;
}
