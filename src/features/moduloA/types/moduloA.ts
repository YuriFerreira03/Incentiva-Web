export interface Meta {
  descricao: string
  tipo: 'Quantitativa' | 'Qualitativa' | ''
  indicador: string
  verificador: string
  prazo: string
}

export interface ItemOrcamento {
  categoria: string
  descricao: string
  valor: number
}

export type Manifestacao =
  | 'Esporte Educacional'
  | 'Esporte de Participação'
  | 'Esporte de Rendimento'
  | 'Esporte para Toda a Vida'
  | ''

export interface ProjetoGerado {
  nome: string
  manifestacao: Manifestacao
  objeto: string
  objetivoGeral: string
  objetivosEspecificos: string
  justificativa: string
  metodologia: string
  publicoBeneficiario: string
  quantidadeBeneficiarios: number
  faixaEtaria: string
  atendePCD: boolean
  locaisExecucao: string
  cronograma: string
  resultadosEsperados: string
  metas: Meta[]
  orcamento: ItemOrcamento[]
  confiancaGeral: number
  confiancaCampos: Record<string, number>
  avisos: string[]
  perguntasAdicionais: string[]
  pedirMaisContexto: boolean
}

export type StatusProjeto =
  | 'rascunho'
  | 'em_revisao'
  | 'aprovado'
  | 'rejeitado'

export type TelaModuloA = 'ideia' | 'gerando' | 'revisao' | 'enviando' | 'enviado'
