// Tipos do Módulo B (vitrine de projetos autorizados a captar).
// Fonte: view `vw_aptos_vigentes` (planilha oficial "Projetos aptos à captação").

export type StatusProjeto = "autorizado" | "em_pauta";

export type Ordenacao = "recentes" | "prazo_asc" | "valor_desc" | "valor_asc";

export type StatusFator = "combina" | "parcial" | "nao_combina" | "desconhecido" | "sem_preferencia";

// Um fator da nota do matching (calculado no banco). "pontos" vai de 0 a 100; null = a empresa não preencheu.
export interface FatorMatching {
  fator: string;
  peso: number;
  pontos: number | null;
  status: StatusFator;
  detalhe: string | null;
}

export interface ProjetoAutorizado {
  id: string;
  processo: string;
  sli: string | null;
  proponente: string;
  projeto: string;
  manifestacao: string | null;
  regime: string | null;
  modalidade: string | null;
  cnpj: string | null;
  cidade: string | null;
  uf: string | null;
  valor_autorizado: number | null;
  data_publicacao: string | null; // AAAA-MM-DD
  prazo_captacao: string | null; // AAAA-MM-DD
  dias_para_vencer: number | null;
  fonte: string;

  // ── Campos futuros: ainda não existem na view. A tela já sabe exibi-los quando chegarem.
  status?: StatusProjeto; // "em_pauta" quando a pauta da Comissão entrar na view
  resumo?: string | null; // preenchido pelo proponente (Módulo A)
  valor_captado?: number | null;
  percentual_captado?: number | null;

  // ── Matching: só preenchidos quando o projeto vem da view vw_matching
  nota?: number;
  posicao?: number;
  fatores?: FatorMatching[];
  explicacao?: string | null;
}

export interface Filtros {
  busca: string;
  uf: string; // "" = todas
  manifestacao: string; // "" = todas
  valorMin: string;
  valorMax: string;
  prazoMaxDias: number | null; // null = qualquer prazo
  ordenacao: Ordenacao;
}

export type AlterarFiltro = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) => void;

export interface EstatisticasVitrine {
  totalVigentes: number;
  vencendoEm60Dias: number;
  ultimaPublicacao: string | null;
}

export interface ResultadoBusca {
  projetos: ProjetoAutorizado[];
  total: number;
}
