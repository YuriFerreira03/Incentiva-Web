import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ProjetoGerado } from '../types/moduloA'

// ─── Paleta INCENTIVA (RGB para jsPDF) ────────────────────────────────────────
const NAVY: [number, number, number] = [11, 42, 74]      // #0B2A4A
const BLUE: [number, number, number] = [12, 93, 165]     // #0C5DA5
const CYAN: [number, number, number] = [6, 182, 212]     // #06B6D4
const GREEN: [number, number, number] = [16, 185, 129]   // #10B981
const GOLD: [number, number, number] = [245, 158, 11]    // #F59E0B
const INK: [number, number, number] = [31, 42, 63]       // #1F2A3F
const MUTED: [number, number, number] = [91, 102, 120]   // #5B6678
const LINE: [number, number, number] = [203, 213, 225]   // #CBD5E1

const MARGIN = 15
const PAGE_W = 210 // A4 mm

// ─── Desenha o símbolo INCENTIVA (nós conectados) vetorialmente ──────────────
function desenharLogo(doc: jsPDF, x: number, y: number, escala = 1) {
  const pts: { dx: number; dy: number; cor: [number, number, number]; r: number }[] = [
    { dx: 0, dy: 8, cor: BLUE, r: 0.9 },
    { dx: 4, dy: 5.2, cor: CYAN, r: 0.9 },
    { dx: 7.5, dy: 6.4, cor: [20, 200, 184], r: 0.9 },
    { dx: 11, dy: 1.8, cor: GREEN, r: 1.3 },
  ]
  doc.setDrawColor(...CYAN)
  doc.setLineWidth(0.6)
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(x + pts[i].dx * escala, y + pts[i].dy * escala, x + pts[i + 1].dx * escala, y + pts[i + 1].dy * escala)
  }
  pts.forEach((p) => {
    doc.setFillColor(...p.cor)
    doc.circle(x + p.dx * escala, y + p.dy * escala, p.r * escala, 'F')
  })
}

// ─── Cabeçalho e rodapé em toda página ────────────────────────────────────────
function cabecalho(doc: jsPDF) {
  desenharLogo(doc, MARGIN, 10, 1)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...NAVY)
  doc.text('INCENTIVA', MARGIN + 16, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('Lei de Incentivo ao Esporte · Documento gerado para revisão técnica', MARGIN + 16, 17)

  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, 21, PAGE_W - MARGIN, 21)
}

function rodape(doc: jsPDF, pagina: number, totalPaginas: number) {
  const h = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, h - 15, PAGE_W - MARGIN, h - 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('Documento estruturado pela plataforma INCENTIVA · rascunho sujeito a revisão técnica antes da submissão ao SLI', MARGIN, h - 10)
  doc.text(`Página ${pagina} de ${totalPaginas}`, PAGE_W - MARGIN, h - 10, { align: 'right' })
}

// ─── Título de seção no padrão numeração romana do SLI ────────────────────────
function tituloSecao(doc: jsPDF, numero: string, texto: string, y: number): number {
  doc.setFillColor(...NAVY)
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(`${numero}. ${texto}`, MARGIN + 3, y + 5)
  return y + 11
}

// ─── Parágrafo com quebra automática de linha ────────────────────────────────
// ─── Normaliza campos que a IA às vezes retorna como array em vez de string ──
function paraTexto(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join('\n')
  if (v === null || v === undefined) return ''
  return String(v)
}

// ─── Normaliza campos numéricos que a IA às vezes retorna como string ────────
function paraNumero(v: unknown): number {
  if (typeof v === 'number' && !isNaN(v)) return v
  const n = Number(String(v ?? '0').replace(/[^\d.-]/g, ''))
  return isNaN(n) ? 0 : n
}

function moeda(v: unknown): string {
  return paraNumero(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function paragrafo(doc: jsPDF, texto: unknown, y: number, opts?: { size?: number; color?: [number, number, number]; bold?: boolean }): number {
  const size = opts?.size ?? 9.5
  const color = opts?.color ?? INK
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...color)
  const largura = PAGE_W - MARGIN * 2
  const linhas = doc.splitTextToSize(paraTexto(texto) || '—', largura)
  doc.text(linhas, MARGIN, y)
  return y + linhas.length * (size * 0.42) + 3
}

function precisaNovaPagina(doc: jsPDF, y: number, margemInferior = 30): boolean {
  return y > doc.internal.pageSize.getHeight() - margemInferior
}

// ─── Função principal: gera e baixa o PDF ────────────────────────────────────
export function gerarPDFProjeto(projeto: ProjetoGerado, opts?: { nomeProponente?: string }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 28

  const novaPagina = () => {
    doc.addPage()
    cabecalho(doc)
    y = 28
  }

  cabecalho(doc)

  // ── Capa resumida ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...NAVY)
  const linhasNome = doc.splitTextToSize(projeto.nome, PAGE_W - MARGIN * 2)
  doc.text(linhasNome, MARGIN, y)
  y += linhasNome.length * 7 + 2

  doc.setFillColor(...CYAN)
  doc.roundedRect(MARGIN, y, 55, 7, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(projeto.manifestacao || 'Não classificado', MARGIN + 27.5, y + 4.7, { align: 'center' })
  y += 13

  if (opts?.nomeProponente) {
    y = paragrafo(doc, `Proponente: ${opts.nomeProponente}`, y, { size: 9, color: MUTED })
  }
  y += 2

  // ── I. IDENTIFICAÇÃO DO PROJETO ─────────────────────────────────────────────
  y = tituloSecao(doc, 'I', 'IDENTIFICAÇÃO DO PROJETO', y)
  y = paragrafo(doc, `Título: ${projeto.nome}`, y, { bold: true })
  y = paragrafo(doc, `Nível de prática esportiva: ${projeto.manifestacao}`, y)
  y += 1
  y = paragrafo(doc, 'Adequação ao nível de prática:', y, { bold: true, size: 9 })
  y = paragrafo(doc, projeto.adequacaoManifestacao || '—', y)
  y += 2

  // ── II. OBJETO E OBJETIVOS ───────────────────────────────────────────────────
  if (precisaNovaPagina(doc, y)) novaPagina()
  y = tituloSecao(doc, 'II', 'OBJETO E OBJETIVOS', y)
  y = paragrafo(doc, 'Objeto:', y, { bold: true, size: 9 })
  y = paragrafo(doc, projeto.objeto, y)
  y = paragrafo(doc, 'Objetivo Geral:', y, { bold: true, size: 9 })
  y = paragrafo(doc, projeto.objetivoGeral, y)
  y = paragrafo(doc, 'Objetivos Específicos:', y, { bold: true, size: 9 })
  const objEspecificos = paraTexto(projeto.objetivosEspecificos).split('\n').filter(Boolean)
  objEspecificos.forEach((o) => {
    y = paragrafo(doc, `• ${o.replace(/^[-•]\s*/, '')}`, y, { size: 9.5 })
  })
  y += 2

  // ── III. JUSTIFICATIVA ───────────────────────────────────────────────────────
  if (precisaNovaPagina(doc, y, 60)) novaPagina()
  y = tituloSecao(doc, 'III', 'JUSTIFICATIVA', y)
  y = paragrafo(doc, projeto.justificativa, y)
  y += 2

  // ── IV. METODOLOGIA ──────────────────────────────────────────────────────────
  if (precisaNovaPagina(doc, y, 60)) novaPagina()
  y = tituloSecao(doc, 'IV', 'METODOLOGIA', y)
  y = paragrafo(doc, projeto.metodologia, y)
  y += 2

  // ── V. PÚBLICO BENEFICIÁRIO ───────────────────────────────────────────────────
  if (precisaNovaPagina(doc, y, 50)) novaPagina()
  y = tituloSecao(doc, 'V', 'PÚBLICO BENEFICIÁRIO', y)
  y = paragrafo(doc, `Descrição: ${projeto.publicoBeneficiario}`, y)
  y = paragrafo(doc, `Quantidade estimada: ${projeto.quantidadeBeneficiarios}  ·  Faixa etária: ${projeto.faixaEtaria}`, y, { bold: true })
  y = paragrafo(doc, 'Critérios de seleção:', y, { bold: true, size: 9 })
  y = paragrafo(doc, projeto.criteriosSelecao || '—', y)
  y += 2

  // ── VI. ACESSIBILIDADE ───────────────────────────────────────────────────────
  if (projeto.acessibilidade) {
    if (precisaNovaPagina(doc, y, 40)) novaPagina()
    y = tituloSecao(doc, 'VI', 'ACESSIBILIDADE (OBRIGATÓRIO POR LEI)', y)
    y = paragrafo(doc, projeto.acessibilidade, y)
    y += 2
  }

  // ── VII. LOCAIS E CRONOGRAMA ─────────────────────────────────────────────────
  if (precisaNovaPagina(doc, y, 50)) novaPagina()
  y = tituloSecao(doc, 'VII', 'LOCAIS DE EXECUÇÃO E CRONOGRAMA', y)
  y = paragrafo(doc, 'Locais de execução:', y, { bold: true, size: 9 })
  y = paragrafo(doc, projeto.locaisExecucao, y)
  y = paragrafo(doc, 'Cronograma resumido:', y, { bold: true, size: 9 })
  y = paragrafo(doc, projeto.cronograma, y)
  y += 2

  // ── VIII. RESULTADOS ESPERADOS ───────────────────────────────────────────────
  if (precisaNovaPagina(doc, y, 40)) novaPagina()
  y = tituloSecao(doc, 'VIII', 'RESULTADOS ESPERADOS', y)
  y = paragrafo(doc, projeto.resultadosEsperados, y)
  y += 2

  // ── IX. METAS QUALITATIVAS E QUANTITATIVAS (tabelas) ─────────────────────────
  if (precisaNovaPagina(doc, y, 60)) novaPagina()
  y = tituloSecao(doc, 'IX', 'METAS QUALITATIVAS E QUANTITATIVAS', y)

  if (projeto.metasQualitativas.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...BLUE)
    doc.text('Metas Qualitativas', MARGIN, y)
    y += 4
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Descrição', 'Indicador', 'Verificador', 'Prazo']],
      body: projeto.metasQualitativas.map((m) => [paraTexto(m.descricao), paraTexto(m.indicador), paraTexto(m.verificador), paraTexto(m.prazo)]),
      styles: { fontSize: 8, cellPadding: 2, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 251] },
      columnStyles: { 0: { cellWidth: 60 } },
    })
    // @ts-expect-error lastAutoTable is injected by the plugin
    y = doc.lastAutoTable.finalY + 6
  }

  if (precisaNovaPagina(doc, y, 50)) { novaPagina() }
  if (projeto.metasQuantitativas.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...BLUE)
    doc.text('Metas Quantitativas', MARGIN, y)
    y += 4
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Descrição', 'Indicador', 'Verificador', 'Prazo']],
      body: projeto.metasQuantitativas.map((m) => [paraTexto(m.descricao), paraTexto(m.indicador), paraTexto(m.verificador), paraTexto(m.prazo)]),
      styles: { fontSize: 8, cellPadding: 2, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 251] },
      columnStyles: { 0: { cellWidth: 60 } },
    })
    // @ts-expect-error lastAutoTable is injected by the plugin
    y = doc.lastAutoTable.finalY + 8
  }

  // ── X. ORÇAMENTO ANALÍTICO (agrupado por bloco, com totais) ──────────────────
  novaPagina()
  y = tituloSecao(doc, 'X', 'ORÇAMENTO ANALÍTICO', y)

  const total = projeto.orcamento.reduce((s, it) => s + paraNumero(it.valorTotal), 0)
  const blocos: Array<typeof projeto.orcamento[number]['bloco']> = ['Atividade Fim', 'Atividade Meio', 'Elaboração e Captação de Recursos']

  blocos.forEach((bloco) => {
    const itens = projeto.orcamento.filter((it) => it.bloco === bloco)
    if (itens.length === 0) return
    const subtotal = itens.reduce((s, it) => s + paraNumero(it.valorTotal), 0)
    const pct = total > 0 ? (subtotal / total) * 100 : 0

    if (precisaNovaPagina(doc, y, 50)) novaPagina()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...CYAN)
    doc.text(bloco, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text(
      `${moeda(subtotal)}  ·  ${pct.toFixed(1)}% do total`,
      PAGE_W - MARGIN, y, { align: 'right' }
    )
    y += 4

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Categoria', 'Item', 'Especificação', 'Qtd', 'Unid.', 'Vlr. Unit.', 'Total']],
      body: itens.map((it) => [
        paraTexto(it.categoria),
        paraTexto(it.item),
        paraTexto(it.especificacao),
        String(paraNumero(it.quantidade)),
        paraTexto(it.unidade),
        moeda(it.valorUnitario),
        moeda(it.valorTotal),
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.8, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [245, 248, 251] },
      columnStyles: {
        0: { cellWidth: 24 }, 1: { cellWidth: 30 }, 2: { cellWidth: 45 },
        3: { cellWidth: 10, halign: 'right' }, 4: { cellWidth: 14 },
        5: { cellWidth: 22, halign: 'right' }, 6: { cellWidth: 22, halign: 'right' },
      },
    })
    // @ts-expect-error lastAutoTable is injected by the plugin
    y = doc.lastAutoTable.finalY + 6
  })

  if (precisaNovaPagina(doc, y, 30)) novaPagina()
  doc.setFillColor(...NAVY)
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL GERAL DO PROJETO', MARGIN + 3, y + 6)
  doc.text(moeda(total), PAGE_W - MARGIN - 3, y + 6, { align: 'right' })
  y += 14

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...GOLD)
  y = paragrafo(doc, 'ATENÇÃO: Valores apresentados são estimativas preliminares geradas com apoio de IA e devem ser revisados conforme cotações reais de mercado e as regras vigentes da Lei de Incentivo ao Esporte antes da submissão ao SLI.', y, { size: 8, color: GOLD })

  // ── XI. AVISOS E PENDÊNCIAS (transparência sobre o que a IA sinalizou) ───────
  if (projeto.avisos.length > 0) {
    if (precisaNovaPagina(doc, y, 40)) novaPagina()
    y = tituloSecao(doc, 'XI', 'AVISOS E PONTOS PARA REVISÃO TÉCNICA', y)
    projeto.avisos.forEach((a) => {
      y = paragrafo(doc, `ATENÇÃO: ${a}`, y, { size: 8.5, color: MUTED })
    })
  }

  // ── Numeração de páginas e rodapé em todas as páginas ────────────────────────
  const totalPaginas = doc.getNumberOfPages()
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p)
    rodape(doc, p, totalPaginas)
  }

  const nomeArquivo = `INCENTIVA_${projeto.nome.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 60)}.pdf`
  doc.save(nomeArquivo)
}
