// ─── Metas (separadas por natureza, como no modelo oficial do SLI) ───────────
export interface Meta {
  descricao: string
  indicador: string    // como será medido (indicador de verificação)
  verificador: string  // meio de verificação (documento/registro que comprova)
  prazo: string
}

// ─── Orçamento granular: item por item, com quantidade × valor unitário ──────
export type BlocoOrcamentario =
  | 'Atividade Fim'
  | 'Atividade Meio'
  | 'Elaboração e Captação de Recursos'

export interface ItemOrcamento {
  bloco: BlocoOrcamentario
  categoria: string       // ex: "Recursos Humanos", "Material Esportivo"
  item: string            // ex: "Professor de Educação Física"
  especificacao: string   // detalhe técnico do item/serviço
  quantidade: number
  unidade: string         // ex: "Unidade", "Refeição", "Mês"
  valorUnitario: number
  valorTotal: number      // quantidade × valorUnitario (a IA deve calcular)
}

export type Manifestacao =
  | 'Formação Esportiva'
  | 'Esporte para Toda a Vida'
  | 'Excelência Esportiva'
  | ''

export interface ProjetoGerado {
  nome: string
  manifestacao: Manifestacao
  adequacaoManifestacao: string  // por que o projeto se encaixa nesse nível
  objeto: string
  objetivoGeral: string
  objetivosEspecificos: string
  justificativa: string
  metodologia: string
  publicoBeneficiario: string
  quantidadeBeneficiarios: number
  faixaEtaria: string
  criteriosSelecao: string  // como os beneficiários são selecionados
  atendePCD: boolean
  locaisExecucao: string
  cronograma: string
  resultadosEsperados: string
  acessibilidade?: string
  metasQualitativas: Meta[]
  metasQuantitativas: Meta[]
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

// ─── Pré-análise da ideia (antes de gerar) ───────────────────────────────────
export interface PreAnalise {
  suficiente: boolean          // true = pode gerar o projeto
  pontuacao: number            // 0 a 100
  topicosCobertos: string[]    // ex: ["modalidade", "público"]
  topicosFaltantes: string[]   // ex: ["local", "duração"]
  mensagem: string             // feedback curto e humano para o usuário
  ehTextoValido: boolean       // false = texto sem sentido / aleatório
}
