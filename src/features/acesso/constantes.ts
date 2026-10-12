import type { Papel, PreferenciasForm } from "./types";

export const PAPEL_ROTULO: Record<Papel, string> = {
  proponente: "Proponente",
  incentivador: "Empresa incentivadora",
};

export const TIPOS_ENTIDADE = [
  { valor: "associacao", rotulo: "Associação" },
  { valor: "instituto", rotulo: "Instituto" },
  { valor: "fundacao", rotulo: "Fundação" },
  { valor: "federacao", rotulo: "Federação" },
  { valor: "confederacao", rotulo: "Confederação" },
  { valor: "clube", rotulo: "Clube" },
  { valor: "prefeitura", rotulo: "Prefeitura" },
  { valor: "outro", rotulo: "Outro" },
] as const;

export const PORTES = [
  { valor: "mei", rotulo: "MEI" },
  { valor: "micro", rotulo: "Microempresa" },
  { valor: "pequena", rotulo: "Pequena empresa" },
  { valor: "media", rotulo: "Média empresa" },
  { valor: "grande", rotulo: "Grande empresa" },
] as const;

export const REGIMES_TRIBUTARIOS = [
  { valor: "lucro_real", rotulo: "Lucro real" },
  { valor: "lucro_presumido", rotulo: "Lucro presumido" },
  { valor: "simples", rotulo: "Simples Nacional" },
  { valor: "nao_sei", rotulo: "Não sei" },
] as const;

export const FAIXAS_ANUAIS = [
  { valor: "ate_100k", rotulo: "Até R$ 100 mil" },
  { valor: "100k_500k", rotulo: "R$ 100 mil a R$ 500 mil" },
  { valor: "500k_1m", rotulo: "R$ 500 mil a R$ 1 milhão" },
  { valor: "1m_5m", rotulo: "R$ 1 milhão a R$ 5 milhões" },
  { valor: "acima_5m", rotulo: "Acima de R$ 5 milhões" },
] as const;

export const TEMAS = [
  { valor: "base", rotulo: "Esporte de base" },
  { valor: "paradesporto", rotulo: "Paradesporto" },
  { valor: "esporte_feminino", rotulo: "Esporte feminino" },
  { valor: "inclusao_social", rotulo: "Inclusão social" },
  { valor: "outros", rotulo: "Outros" },
] as const;

// Grupos de modalidade. A planilha oficial tem ~1.100 grafias de modalidade ("Futebol/Futsal", "Thiathlon"...),
// então as preferências usam estes grupos. A regra que liga o texto da planilha a cada grupo entra no passo do matching.
// Em 12/10/2026 estes 20 grupos cobriam 78% dos projetos com prazo aberto (18,7% vêm como "Outros" na própria planilha).
export const GRUPOS_MODALIDADE = [
  { valor: "futebol", rotulo: "Futebol" },
  { valor: "futsal", rotulo: "Futsal" },
  { valor: "basquete", rotulo: "Basquete" },
  { valor: "volei", rotulo: "Vôlei e futevôlei" },
  { valor: "handebol", rotulo: "Handebol" },
  { valor: "atletismo", rotulo: "Atletismo" },
  { valor: "corrida", rotulo: "Corrida e caminhada" },
  { valor: "natacao", rotulo: "Natação e aquáticos" },
  { valor: "lutas", rotulo: "Lutas e artes marciais" },
  { valor: "raquetes", rotulo: "Tênis e raquetes" },
  { valor: "automobilismo", rotulo: "Automobilismo e kart" },
  { valor: "ciclismo", rotulo: "Ciclismo e bike" },
  { valor: "triathlon", rotulo: "Triathlon e multiesporte" },
  { valor: "ginastica", rotulo: "Ginástica" },
  { valor: "agua_vela", rotulo: "Vela, remo e surf" },
  { valor: "radicais", rotulo: "Skate e radicais" },
  { valor: "para", rotulo: "Paradesporto (modalidades)" },
  { valor: "mente", rotulo: "Xadrez e e-sports" },
  { valor: "rugby_bat", rotulo: "Rugby, beisebol e futebol americano" },
  { valor: "outras_modalidades", rotulo: "Golfe, hipismo, tiro e outras" },
] as const;

export const PREFERENCIAS_VAZIAS: PreferenciasForm = {
  manifestacoes: [],
  modalidades: [],
  ufs: [],
  valorMin: "",
  valorMax: "",
  faixaAnual: "",
  temas: [],
  impacto: "",
};

export const LIMITE_IMPACTO = 1000;
