// Tipos do controle de acesso (perfis) — espelham as tabelas do Supabase:
// perfis_acesso, entidades, empresas e incentivador_preferencias.

export type Papel = "proponente" | "incentivador";

export interface Entidade {
  id: string;
  user_id: string;
  cnpj: string;
  razao_social: string;
  tipo: string | null;
  uf: string;
  municipio: string;
  responsavel_nome: string;
  responsavel_cargo: string | null;
  responsavel_telefone: string | null;
  verificada: boolean;
}

export interface Empresa {
  id: string;
  user_id: string;
  cnpj: string;
  razao_social: string;
  uf: string;
  municipio: string;
  porte: string;
  setor: string | null;
  regime_tributario: string | null;
  responsavel_nome: string;
  responsavel_cargo: string | null;
  responsavel_email: string;
  responsavel_telefone: string | null;
  verificada: boolean;
}

export interface Preferencias {
  empresa_id: string;
  manifestacoes: string[];
  modalidades: string[]; // slugs dos grupos de modalidade (ver constantes.ts)
  ufs: string[];
  valor_min_projeto: number | null;
  valor_max_projeto: number | null;
  faixa_anual: string | null;
  temas: string[];
  impacto_texto: string | null;
}

export interface PerfilCarregado {
  papeis: Papel[];
  entidade: Entidade | null;
  empresa: Empresa | null;
  preferencias: Preferencias | null;
}

// Formato usado nos formulários (tudo texto/lista; a conversão para o banco fica no serviço).
export interface PreferenciasForm {
  manifestacoes: string[];
  modalidades: string[];
  ufs: string[];
  valorMin: string;
  valorMax: string;
  faixaAnual: string;
  temas: string[];
  impacto: string;
}
