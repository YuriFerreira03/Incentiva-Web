export type StatusCaptacao =
  | "recem_autorizado_aguardando_captacao"
  | "em_captacao"
  | "encerrado";

export interface ProjetoCaptacao {
  id: string;
  processo: string;
  sli: string | null;
  proponente: string;
  projeto: string;
  status: StatusCaptacao;
  valor_autorizado: number | null;
  valor_captado: number;
  percentual_captado: number;
  valor_faltante: number | null;
  modalidade: string | null;
  regiao: string | null;
  resumo: string | null;
  fonte: string;
  disponivel_para_match: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type OrdenacaoVitrine = "valor_faltante_desc" | "valor_faltante_asc" | "mais_recente";
