import { z } from 'zod'
import { DIMENSOES } from '../types/moduloA'
import type { Dimensao, PreAnalise, ProjetoGerado, ValidacaoResposta } from '../types/moduloA'

// ════════════════════════════════════════════════════════════════════════════
// Schemas das respostas da IA (versão V4.1 da especificação de prompts).
// Regra de ouro: o modelo SUGERE, o código DECIDE. Suficiência, aprovação e
// pontuação são recalculadas aqui, nunca aceitas do modelo.
// ════════════════════════════════════════════════════════════════════════════

// ─── Normalizadores tolerantes (a IA às vezes devolve array no lugar de string,
// número como texto, null no lugar de lista, etc.) ────────────────────────────
function paraTexto(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(paraTexto).filter(Boolean).join('\n')
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    for (const k of ['descricao', 'mensagem', 'texto', 'pergunta', 'item']) {
      if (typeof o[k] === 'string' && o[k]) return o[k] as string
    }
    return JSON.stringify(v)
  }
  return String(v)
}

export function paraNumero(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v !== 'string') return 0
  let s = v.replace(/[^\d.,-]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.') // 1.500,50 -> 1500.50
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const texto = z.preprocess(paraTexto, z.string())
const numero = z.preprocess(paraNumero, z.number())
const booleano = z.preprocess(
  (v) => v === true || (typeof v === 'string' && v.trim().toLowerCase() === 'true'),
  z.boolean(),
)
const lista = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v === null || v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(item))

const status = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  z.enum(['presente', 'parcial', 'ausente']),
)

// ─── 1. Pré-análise (analisarIdeia) ──────────────────────────────────────────
const Topico = z.object({
  status,
  informacaoIdentificada: texto,
  observacao: texto,
})

export const PreAnaliseIASchema = z.object({
  ehTextoValido: booleano,
  suficiente: booleano, // ignorado: recalculado em consolidarPreAnalise
  topicos: z.object({
    modalidadeEsportiva: Topico,
    manifestacaoEsportiva: Topico,
    publicoAlvo: Topico,
    localExecucao: Topico,
    quantidadeParticipantes: Topico,
    duracao: Topico,
    justificativa: Topico,
    formaExecucao: Topico,
  }),
  inconsistencias: lista(texto),
  informacoesPendentes: lista(texto),
  perguntasComplementares: lista(texto),
  orientacaoUsuario: texto,
})
export type PreAnaliseIA = z.output<typeof PreAnaliseIASchema>

// Rótulos usados pela interface atual (tags "falta: ...")
const ROTULOS: Record<Dimensao, string> = {
  modalidadeEsportiva: 'modalidade',
  manifestacaoEsportiva: 'manifestação',
  publicoAlvo: 'público',
  localExecucao: 'local',
  quantidadeParticipantes: 'participantes',
  duracao: 'duração',
  justificativa: 'justificativa',
  formaExecucao: 'execução',
}

/**
 * Regras do backend (especificação V4.1):
 *   suficiente = ehTextoValido && 8 dimensões "presente" && sem inconsistências
 *   pontuação  = 12,5 × presentes + 6,25 × parciais   (completude, não mérito)
 * Também gera os campos legados (topicosCobertos, topicosFaltantes, mensagem).
 */
export function consolidarPreAnalise(ia: PreAnaliseIA): PreAnalise {
  const presentes = DIMENSOES.filter((d) => ia.topicos[d].status === 'presente')
  const parciais = DIMENSOES.filter((d) => ia.topicos[d].status === 'parcial')
  const pendentes = DIMENSOES.filter((d) => ia.topicos[d].status !== 'presente')
  const inconsistencias = ia.inconsistencias.map((s) => s.trim()).filter(Boolean)

  const suficiente = ia.ehTextoValido && pendentes.length === 0 && inconsistencias.length === 0
  const pontuacao = ia.ehTextoValido ? Math.round(12.5 * presentes.length + 6.25 * parciais.length) : 0

  let mensagem: string
  if (!ia.ehTextoValido) {
    mensagem = 'O texto não parece descrever um projeto. Escreva sua ideia com suas palavras.'
  } else if (suficiente) {
    mensagem = 'Tudo certo: as 8 informações essenciais foram identificadas. Podemos gerar o rascunho.'
  } else {
    mensagem =
      ia.orientacaoUsuario.trim() ||
      inconsistencias[0] ||
      `Faltam ${pendentes.length} informação(ões): ${pendentes.map((d) => ROTULOS[d]).join(', ')}.`
  }

  return {
    suficiente,
    pontuacao,
    topicosCobertos: ia.ehTextoValido ? presentes.map((d) => ROTULOS[d]) : [],
    topicosFaltantes: ia.ehTextoValido ? pendentes.map((d) => ROTULOS[d]) : [],
    mensagem,
    ehTextoValido: ia.ehTextoValido,
    topicos: ia.topicos,
    inconsistencias,
    informacoesPendentes: ia.informacoesPendentes.map((s) => s.trim()).filter(Boolean),
    perguntasComplementares: ia.perguntasComplementares.map((s) => s.trim()).filter(Boolean).slice(0, 8),
    orientacaoUsuario: ia.orientacaoUsuario.trim(),
  }
}

// ─── 2. Validação por etapa (validarResposta) ────────────────────────────────
export const ValidacaoRespostaIASchema = z.object({
  status,
  aprovada: booleano, // ignorado: recalculado em consolidarValidacao
  mensagem: texto,
  sugestao: texto,
  perguntaComplementar: texto,
  inconsistencia: texto,
})
export type ValidacaoRespostaIA = z.output<typeof ValidacaoRespostaIASchema>

/** aprovada = status "presente" E nenhuma inconsistência (decisão do código). */
export function consolidarValidacao(ia: ValidacaoRespostaIA): ValidacaoResposta {
  const inconsistencia = ia.inconsistencia.trim()
  const aprovada = ia.status === 'presente' && inconsistencia === ''
  const mensagem =
    ia.mensagem.trim() ||
    (aprovada
      ? ''
      : ia.status === 'ausente'
        ? 'Essa informação ainda não foi dada.'
        : 'Essa resposta está genérica — acrescente um detalhe.')
  return {
    aprovada,
    status: ia.status,
    mensagem,
    sugestao: aprovada ? '' : ia.sugestao.trim(),
    perguntaComplementar: aprovada ? '' : ia.perguntaComplementar.trim(),
    inconsistencia,
  }
}

// ─── 3. Rascunho do projeto (gerarProjeto / refazerProjeto) ──────────────────
// Mesma forma de ProjetoGerado usada pela interface hoje. Campos ausentes ou
// com tipo errado são normalizados em vez de quebrar a tela.
const MetaSchema = z.object({
  descricao: texto,
  indicador: texto,
  verificador: texto,
  prazo: texto,
})

const ItemOrcamentoSchema = z.object({
  bloco: z.enum(['Atividade Fim', 'Atividade Meio', 'Elaboração e Captação de Recursos']).catch('Atividade Fim'),
  categoria: texto,
  item: texto,
  especificacao: texto,
  quantidade: numero,
  unidade: texto,
  valorUnitario: numero,
  valorTotal: numero,
})

const SugestaoMelhoriaSchema = z.object({
  campo: texto,
  campoLabel: texto,
  mensagem: texto,
  sugestao: texto,
})

const confianca = z.preprocess((v) => Math.min(100, Math.max(0, paraNumero(v))), z.number())
const confiancaCampos = z.preprocess(
  (v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, paraNumero(x)]))
      : {},
  z.record(z.string(), z.number()),
)

export const ProjetoGeradoSchema = z.object({
  nome: texto,
  manifestacao: z
    .enum(['Formação Esportiva', 'Esporte para Toda a Vida', 'Excelência Esportiva', ''])
    .catch(''),
  adequacaoManifestacao: texto,
  objeto: texto,
  objetivoGeral: texto,
  objetivosEspecificos: texto,
  justificativa: texto,
  metodologia: texto,
  publicoBeneficiario: texto,
  quantidadeBeneficiarios: numero,
  faixaEtaria: texto,
  criteriosSelecao: texto,
  atendePCD: booleano,
  locaisExecucao: texto,
  cronograma: texto,
  resultadosEsperados: texto,
  acessibilidade: texto,
  metasQualitativas: lista(MetaSchema),
  metasQuantitativas: lista(MetaSchema),
  orcamento: lista(ItemOrcamentoSchema),
  confiancaGeral: confianca,
  confiancaCampos,
  avisos: lista(texto),
  perguntasAdicionais: lista(texto),
  pedirMaisContexto: booleano,
  sugestoesMelhoria: lista(SugestaoMelhoriaSchema),
  sugestoesNome: lista(texto),
})

/** Valida e normaliza o JSON bruto da IA no formato que a tela espera. */
export function normalizarProjeto(bruto: unknown): ProjetoGerado {
  return ProjetoGeradoSchema.parse(bruto)
}
