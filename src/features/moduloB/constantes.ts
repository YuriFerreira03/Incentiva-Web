import type { Ordenacao } from "./types/projetoAutorizado";

export const VIEW_VIGENTES = "vw_aptos_vigentes";
export const TAMANHO_PAGINA = 24;

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const MANIFESTACOES = [
  "Educacional",
  "Participação",
  "Rendimento",
  "Formação Esportiva",
  "Esporte para Toda a Vida",
  "Excelência Esportiva",
  "Rendimento / Formação",
] as const;

export const ORDENACOES: { valor: Ordenacao; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "prazo_asc", rotulo: "Prazo mais curto" },
  { valor: "valor_desc", rotulo: "Maior valor autorizado" },
  { valor: "valor_asc", rotulo: "Menor valor autorizado" },
];

export const PRAZOS_RAPIDOS = [30, 60, 90] as const;
