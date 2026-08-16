import type { ProjetoGerado, PreAnalise } from '../types/moduloA'

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER || 'groq') as string
const API_KEY = import.meta.env.VITE_AI_API_KEY || ''
const MODEL = import.meta.env.VITE_AI_MODEL || 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `Você é um especialista sênior em elaboração de projetos para a Lei de Incentivo ao Esporte do Brasil, com domínio das regras VIGENTES em 2026: Lei nº 11.438/2006 atualizada pela Lei Complementar nº 222/2025, Decreto nº 12.861/2026 e Portaria MESP nº 10/2026.

Sua missão: transformar a ideia de um proponente em um projeto estruturado, coerente e ADERENTE ÀS REGRAS ATUAIS, pronto para análise técnica preliminar (antes da revisão humana e submissão ao SLI).

=== NÍVEIS DE PRÁTICA ESPORTIVA (classificação atual — Decreto 12.861/2026, art. 5º) ===
Escolha EXATAMENTE UM e enquadre o projeto com foco (projetos híbridos ou mal posicionados são indeferidos):
- "Formação Esportiva": ações inclusivas/educativas/lúdicas para CRIANÇAS E ADOLESCENTES, desenvolvimento integral. SEM teto de captação. OBRIGATÓRIO: se for prática regular, no mínimo 50% dos beneficiários devem ser alunos da rede pública de ensino.
- "Esporte para Toda a Vida": hábitos saudáveis, lazer, atividade física e esporte competitivo para JOVENS E ADULTOS, sem foco em alto rendimento. Teto de captação: R$ 2,5 milhões.
- "Excelência Esportiva": treinamento sistemático para ALTO RENDIMENTO e formação de atletas. Teto de captação: R$ 5 milhões.

=== VEDAÇÕES OBRIGATÓRIAS (nunca inclua no projeto — reprovam na análise) ===
- É VEDADO cobrar qualquer valor dos beneficiários em projetos de prática esportiva regular (gratuidade obrigatória).
- NÃO incluir: compra de imóveis; pagamento de salário de atletas profissionais; manutenção de equipes profissionais; multas, juros, tributos do incentivador; doações a terceiros; despesas pessoais de dirigentes; qualquer despesa estranha ao objeto.
- Recursos captados têm natureza PÚBLICA.

=== LIMITES DE ORÇAMENTO (Decreto 12.861/2026 e Portaria 10/2026) ===
- Despesas administrativas (atividade-meio: coordenação, contabilidade, aluguel de sede): MÁXIMO 15% do orçamento total.
- Despesas de produção/elaboração e captação: 10% (Formação), 7% (Toda a Vida) ou 5% (Excelência) — teto absoluto de R$ 100 mil.
- A maior parte do orçamento deve ser ATIVIDADE-FIM (execução direta do objeto).
- Todo item precisa de memória de cálculo: o quê, quanto (quantitativo × valor unitário) e referência de preço. Orçamento genérico é a principal causa de indeferimento.

=== ACESSIBILIDADE (obrigatória — Decreto 12.861/2026, art. 2º) ===
Todo projeto DEVE conter ações concretas de acessibilidade para pessoas com deficiência e pessoas idosas — ações específicas, não cláusula genérica.

=== ESTRUTURA E QUALIDADE (baseado no modelo oficial do SLI e em projetos aprovados reais) ===
- Objeto e objetivos claros e alinhados ao nível de prática escolhido.
- ADEQUAÇÃO À MANIFESTAÇÃO: escreva um parágrafo explicando POR QUE o projeto se enquadra no nível escolhido (não apenas classifique — justifique o enquadramento).
- Justificativa consistente com diagnóstico real (contexto social, dados, problema, relevância).
- CRITÉRIOS DE SELEÇÃO: explique como os beneficiários serão selecionados (ex: percentual de escola pública, indicação por parceiros, ordem de inscrição, critério de vulnerabilidade).
- Metodologia detalhada: ações, cronograma, grade horária compatível com o nº de beneficiários, recursos humanos, regime de contratação, locais de execução.
- METAS: separe SEMPRE em duas listas — Qualitativas (resultado não numérico, ex: "melhoria do comportamento social") e Quantitativas (resultado numérico, ex: "300 alunos atendidos"). Cada meta tem indicador (como medir) e verificador (documento que comprova).
- ORÇAMENTO GRANULAR (o mais importante para aprovação): NUNCA gere categorias genéricas com um valor total solto. Cada item deve ter: categoria, nome do item, especificação técnica breve, quantidade, unidade, valor unitário e valor total (quantidade × valor unitário, calculado por você). Ex: item "Professor de Educação Física", especificação "Habilitado, 30h semanais", quantidade 2, unidade "Unidade", valorUnitario 2500, valorTotal 30000 (2 × 2500 × 6 meses, ajuste conforme duração). Distribua os itens nos 3 blocos: "Atividade Fim" (execução direta: RH de ponta, material esportivo, uniformes), "Atividade Meio" (administrativo: coordenação, limpeza — máx. 15% do total) e "Elaboração e Captação de Recursos" (custo de elaborar o projeto — 5 a 10% conforme o nível, teto R$100 mil).
- Coerência total entre objetivos → ações → metas → orçamento.

=== REGRAS DE SAÍDA ===
- Português do Brasil, linguagem técnica e clara.
- Nunca invente dados numéricos específicos (CNPJ, endereços, nomes). Quando faltar dado, gere estimativa razoável E registre em "avisos" que precisa de confirmação.
- Seja honesto: confiança baixa em algum campo deve ser sinalizada.
- Retorne SEMPRE JSON válido, sem texto fora do JSON, sem markdown.`

async function callAI(userPrompt: string): Promise<string> {
  const endpoints: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    google: `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
  }

  if (PROVIDER === 'google') {
    const res = await fetch(endpoints.google, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.5 },
      }),
    })
    if (!res.ok) throw new Error(`Google AI ${res.status}`)
    const d = await res.json()
    return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
  if (PROVIDER === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:5173'
    headers['X-Title'] = 'INCENTIVA Módulo A'
  }

  const res = await fetch(endpoints[PROVIDER] || endpoints.groq, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`${PROVIDER} ${res.status}: ${txt.slice(0, 300)}`)
  }
  const d = await res.json()
  return d.choices?.[0]?.message?.content || ''
}

function parseJSON<T>(raw: string): T {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const s = text.indexOf('{')
  const e = text.lastIndexOf('}')
  if (s !== -1 && e > s) text = text.slice(s, e + 1)
  return JSON.parse(text) as T
}

// ─── Pré-análise: valida se a ideia tem informação suficiente ────────────────
const PREANALISE_SYSTEM = `Você é um avaliador de ideias de projetos esportivos para a Lei de Incentivo ao Esporte.
Sua ÚNICA função é analisar se o texto do usuário tem informação MÍNIMA para estruturar um projeto sério.

Você avalia 7 tópicos: modalidade esportiva, público-alvo, local de execução, quantidade de participantes, duração, importância/justificativa, e como será executado.

REGRAS:
- Se o texto for aleatório, sem sentido, letras jogadas ou spam (ex: "asdkjaslkd", "aaaa bbbb"), marque ehTextoValido = false e suficiente = false.
- Para ser "suficiente", o texto precisa cobrir de forma minimamente coerente TODOS os 7 tópicos (modalidade, público, local, participantes, duração, importância, execução). Se faltar QUALQUER um, suficiente = false.
- Seja tolerante com a forma de escrever (leigos escrevem simples), mas rigoroso com a presença real de informação.
- Responda SEMPRE em JSON válido, em português do Brasil, sem texto fora do JSON.`

export async function analisarIdeia(ideia: string): Promise<PreAnalise> {
  const prompt = `Analise o texto abaixo de um proponente descrevendo sua ideia de projeto esportivo.

TEXTO DO USUÁRIO:
"""
${ideia}
"""

Avalie e retorne JSON no formato:
{
  "ehTextoValido": true se o texto faz sentido (não é aleatório/spam), false caso contrário,
  "suficiente": true SOMENTE se cobre todos os 7 tópicos; se faltar qualquer um, false,
  "pontuacao": número de 0 a 100 indicando o quão completa está a ideia,
  "topicosCobertos": ["modalidade", "público", ...] com os tópicos realmente presentes,
  "topicosFaltantes": ["local", "duração", ...] com os que faltam,
  "mensagem": "uma frase curta, gentil e direta em pt-BR dizendo o que falta ou parabenizando (máx. 140 caracteres)"
}

Tópicos possíveis: modalidade, público, local, participantes, duração, importância, execução.`

  if (!API_KEY) return mockAnalisarIdeia(ideia)

  try {
    const raw = await callAIComSistema(PREANALISE_SYSTEM, prompt)
    return parseJSON<PreAnalise>(raw)
  } catch {
    return mockAnalisarIdeia(ideia)
  }
}

// versão de callAI que aceita um system prompt customizado
async function callAIComSistema(system: string, userPrompt: string): Promise<string> {
  const endpoints: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    google: `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
  }
  if (PROVIDER === 'google') {
    const res = await fetch(endpoints.google, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    })
    if (!res.ok) throw new Error(`Google AI ${res.status}`)
    const d = await res.json()
    return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
  if (PROVIDER === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:5173'
    headers['X-Title'] = 'INCENTIVA Módulo A'
  }
  const res = await fetch(endpoints[PROVIDER] || endpoints.groq, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`${PROVIDER} ${res.status}: ${txt.slice(0, 300)}`)
  }
  const d = await res.json()
  return d.choices?.[0]?.message?.content || ''
}

// mock local: heurística simples por palavras-chave
function mockAnalisarIdeia(ideia: string): PreAnalise {
  const t = ideia.toLowerCase()
  const temLetrasReais = /[aeiou]{1,}/.test(t) && t.split(/\s+/).filter(w => w.length > 2).length >= 5
  const ehValido = temLetrasReais && !/(.)\1{4,}/.test(t)

  const grupos: Record<string, string[]> = {
    modalidade: ['futebol','vôlei','volei','basquete','natação','natacao','atletismo','handebol','judô','judo','tênis','tenis','modalidade','esporte','luta','ginástica','ginastica','corrida','dança','danca','capoeira','parkour','skate','surf','ciclismo','xadrez'],
    'público': ['criança','crianca','jovem','adolescente','idoso','adulto','anos','vulnerabilidade','público','publico','pcd','deficiência','deficiencia','mulher','comunidade','meninos','meninas','estudantes'],
    local: ['bairro','cidade','município','municipio','quadra','ginásio','ginasio','clube','escola','centro','local','minas','são paulo','sao paulo','rio','jardim','vila','zona'],
    participantes: ['participantes','beneficiários','beneficiarios','pessoas','alunos','atletas','vagas','atender'],
    'duração': ['meses','mês','mes','ano','anos','semana','semanas','duração','duracao','período','periodo','cronograma'],
    'importância': ['porque','pois','importante','inclusão','inclusao','social','saúde','saude','oportunidade','transformar','impacto','carência','carencia'],
    'execução': ['aulas','treinos','oficinas','encontros','atividades','metodologia','professor','profissional','equipe','executado','semanais','frequência','frequencia'],
  }
  const cobertos: string[] = []
  const faltantes: string[] = []
  for (const [nome, termos] of Object.entries(grupos)) {
    if (ehValido && termos.some(x => t.includes(x))) cobertos.push(nome)
    else faltantes.push(nome)
  }
  const temModalidade = cobertos.includes('modalidade')
  const temPublico = cobertos.includes('público')
  const suficiente = ehValido && cobertos.length === 7
  const pontuacao = ehValido ? Math.round((cobertos.length / 7) * 100) : 0

  let mensagem: string
  if (!ehValido) mensagem = 'O texto não parece descrever um projeto. Escreva sua ideia com suas palavras.'
  else if (suficiente) mensagem = `Ótimo! Sua ideia cobre ${cobertos.length} de 7 tópicos. Podemos gerar o projeto.`
  else if (!temModalidade) mensagem = 'Falta dizer qual é a modalidade esportiva do projeto.'
  else if (!temPublico) mensagem = 'Falta descrever para qual público o projeto é voltado.'
  else mensagem = `Faltam ${faltantes.length} tópico(s): ${faltantes.join(', ')}.`

  return { ehTextoValido: ehValido, suficiente, pontuacao, topicosCobertos: cobertos, topicosFaltantes: faltantes, mensagem }
}

// ─── Prompt principal ────────────────────────────────────────────────────────
export async function gerarProjeto(ideia: string): Promise<ProjetoGerado> {
  const prompt = `Analise a ideia abaixo e gere um projeto esportivo completo estruturado para a Lei de Incentivo ao Esporte, seguindo o padrão de projetos REALMENTE APROVADOS (estrutura granular, não genérica).

IDEIA DO PROPONENTE:
"""
${ideia}
"""

Com base nessa ideia, gere o projeto completo no seguinte formato JSON:

{
  "nome": "nome criativo e descritivo do projeto",
  "manifestacao": "Formação Esportiva | Esporte para Toda a Vida | Excelência Esportiva",
  "adequacaoManifestacao": "parágrafo explicando por que o projeto se enquadra nesse nível específico",
  "acessibilidade": "ações concretas de acessibilidade para PCD e idosos (OBRIGATÓRIO por lei)",
  "objeto": "descrição objetiva e direta do que será realizado (2-3 frases)",
  "objetivoGeral": "objetivo geral claro, com verbo de resultado, público e prazo",
  "objetivosEspecificos": "lista de 4-5 objetivos específicos, um por linha, começando com verbo no infinitivo",
  "justificativa": "justificativa completa com contexto social, problema identificado e relevância do projeto (mínimo 3 parágrafos)",
  "metodologia": "metodologia detalhada: como será executado, frequência, duração das atividades, equipe, abordagem pedagógica (mínimo 2 parágrafos)",
  "publicoBeneficiario": "descrição completa do público-alvo",
  "quantidadeBeneficiarios": número estimado (inteiro),
  "faixaEtaria": "faixa etária principal",
  "criteriosSelecao": "como os beneficiários serão selecionados (ex: percentual de escola pública, indicação por parceiros, ordem de inscrição)",
  "atendePCD": true/false,
  "locaisExecucao": "locais onde o projeto será executado",
  "cronograma": "cronograma resumido por fase (ex: Mês 1-2: ..., Mês 3-6: ...)",
  "resultadosEsperados": "resultados concretos e mensuráveis esperados ao final do projeto",
  "metasQualitativas": [
    {
      "descricao": "resultado não numérico esperado (ex: melhoria do comportamento social)",
      "indicador": "como será percebido/avaliado",
      "verificador": "documento/registro que comprova (ex: relatório de avaliação pedagógica)",
      "prazo": "quando será avaliada"
    }
  ],
  "metasQuantitativas": [
    {
      "descricao": "resultado numérico esperado (ex: 80 crianças atendidas com 70% de frequência)",
      "indicador": "fórmula ou forma de cálculo (ex: nº de presentes / nº de matriculados)",
      "verificador": "documento/registro que comprova (ex: lista de presença mensal)",
      "prazo": "quando será aferida"
    }
  ],
  "orcamento": [
    {
      "bloco": "Atividade Fim | Atividade Meio | Elaboração e Captação de Recursos",
      "categoria": "categoria do gasto (ex: Recursos Humanos, Material Esportivo)",
      "item": "nome do item ou serviço contratado (ex: Professor de Educação Física)",
      "especificacao": "detalhe técnico breve (ex: habilitado, 30h semanais)",
      "quantidade": número,
      "unidade": "Unidade | Mês | Refeição | Par | etc.",
      "valorUnitario": valor unitário em reais,
      "valorTotal": quantidade × valorUnitario (calcule corretamente)
    }
  ],
  "confiancaGeral": número de 0 a 100 indicando quão completa foi a ideia original,
  "confiancaCampos": {
    "justificativa": 0-100,
    "metodologia": 0-100,
    "orcamento": 0-100,
    "metas": 0-100
  },
  "pedirMaisContexto": true se a ideia original foi muito vaga,
  "perguntasAdicionais": ["pergunta 1 para melhorar o projeto", "pergunta 2"],
  "avisos": ["aviso 1 sobre campo que precisará de revisão", "aviso 2"]
}

IMPORTANTE SOBRE O ORÇAMENTO: gere no mínimo 8-12 itens granulares distribuídos nos 3 blocos (não categorias genéricas). Cada item deve ter quantidade e valor unitário realistas, com valorTotal calculado corretamente. As despesas do bloco "Atividade Meio" não podem somar mais que 15% do total geral. O bloco "Elaboração e Captação de Recursos" deve ficar entre 5% e 10% do total, nunca acima de R$ 100.000.`

  if (!API_KEY) return mockGerarProjeto(ideia)

  try {
    const raw = await callAI(prompt)
    return parseJSON<ProjetoGerado>(raw)
  } catch {
    return mockGerarProjeto(ideia)
  }
}

// ─── Refazer com mais contexto ────────────────────────────────────────────────
export async function refazerProjeto(
  ideia: string,
  respostas: string,
  projetoAtual: ProjetoGerado
): Promise<ProjetoGerado> {
  const prompt = `Você gerou um rascunho de projeto e o proponente forneceu mais informações.
Atualize e melhore o projeto com base nessas informações adicionais.

IDEIA ORIGINAL:
"""${ideia}"""

INFORMAÇÕES ADICIONAIS DO PROPONENTE:
"""${respostas}"""

PROJETO ATUAL (melhore onde necessário, mantenha o que está bom):
${JSON.stringify(projetoAtual, null, 2)}

Retorne o projeto completo atualizado no mesmo formato JSON, com os campos melhorados.`

  if (!API_KEY) return projetoAtual

  try {
    const raw = await callAI(prompt)
    return parseJSON<ProjetoGerado>(raw)
  } catch {
    return projetoAtual
  }
}

// ─── Mock para demonstração ───────────────────────────────────────────────────
// ─── Mock para demonstração (sem API key) ────────────────────────────────────
function mockGerarProjeto(ideia: string): ProjetoGerado {
  const lower = ideia.toLowerCase()
  const modalidade = lower.includes('natação') ? 'natação'
    : lower.includes('futebol') ? 'futebol'
    : lower.includes('basquete') ? 'basquete'
    : lower.includes('vôlei') || lower.includes('volei') ? 'vôlei'
    : 'esporte'

  const qtd = 80

  return {
    nome: `Projeto de ${modalidade.charAt(0).toUpperCase() + modalidade.slice(1)} Comunitário`,
    manifestacao: 'Formação Esportiva',
    adequacaoManifestacao: `O projeto se enquadra em Formação Esportiva por promover o acesso à prática de ${modalidade} para crianças e adolescentes por meio de ações planejadas, inclusivas e educativas, com foco no desenvolvimento integral dos beneficiários, conforme o art. 5º, inciso I, do Decreto nº 12.861/2026.`,
    acessibilidade: 'Locais de execução com rampas de acesso e adaptações para cadeirantes; professores capacitados para adaptação de atividades a pessoas com deficiência e idosos; material de apoio em formato acessível.',
    objeto: `Desenvolvimento e prática regular de ${modalidade} para crianças e adolescentes, com foco em formação esportiva, educação e inclusão social.`,
    objetivoGeral: `Promover o acesso à prática regular de ${modalidade} para jovens em situação de vulnerabilidade social, contribuindo para o desenvolvimento físico, social e educacional dos beneficiários ao longo de 12 meses de execução.`,
    objetivosEspecificos: `Oferecer aulas regulares de ${modalidade} com frequência mínima de 3 vezes por semana;\nCapacitar técnicos e educadores para atuação com crianças e adolescentes;\nAcompanhar indicadores de desempenho escolar dos beneficiários;\nRealizar ao menos 2 torneios ou eventos esportivos durante o projeto;\nDesenvolver valores como disciplina, trabalho em equipe e fair play.`,
    justificativa: `A prática esportiva regular é reconhecida como ferramenta fundamental para o desenvolvimento integral de crianças e adolescentes, especialmente aqueles em situação de vulnerabilidade social. Estudos do IBGE e da UNESCO demonstram que jovens engajados em atividades esportivas estruturadas apresentam melhor desempenho escolar, menor índice de evasão escolar e maior resiliência frente às adversidades sociais.\n\nO território de execução do projeto apresenta déficit significativo de equipamentos esportivos públicos e de acesso a práticas esportivas orientadas. A ausência de opções estruturadas de lazer e esporte no contraturno escolar expõe essa população a riscos como o envolvimento com situações de violência e abandono escolar.\n\nO projeto se enquadra plenamente nas diretrizes da Lei de Incentivo ao Esporte (LC nº 222/2025 e Decreto nº 12.861/2026), que visam democratizar o acesso ao esporte e promover a formação esportiva de qualidade para toda a população brasileira, especialmente as mais vulneráveis.`,
    metodologia: `O projeto será executado por meio de aulas regulares de ${modalidade}, ministradas por profissionais de Educação Física habilitados, em horários acessíveis ao público-alvo. As atividades seguirão uma progressão pedagógica adequada a cada faixa etária, combinando fundamentos técnicos, táticos e formativos.\n\nCada sessão terá duração de 90 minutos e incluirá aquecimento, parte técnica, jogo aplicado e momento de reflexão sobre valores do esporte. Serão realizadas avaliações periódicas dos beneficiários a cada 3 meses, com registro de frequência, evolução técnica e indicadores socioeducacionais. A equipe executora realizará reuniões quinzenais para alinhamento pedagógico e ajuste das atividades.`,
    publicoBeneficiario: 'Crianças e adolescentes de 8 a 17 anos em situação de vulnerabilidade social, prioritariamente matriculados na rede pública de ensino',
    quantidadeBeneficiarios: qtd,
    faixaEtaria: '8 a 17 anos',
    criteriosSelecao: 'Serão priorizados alunos regularmente matriculados na rede pública de ensino (mínimo 50%, conforme exigência legal para Formação Esportiva), com inscrição via indicação de escolas parceiras, conselho tutelar e assistência social, respeitando a ordem de chegada dentro de cada critério de vulnerabilidade.',
    atendePCD: false,
    locaisExecucao: 'Ginásio e quadras esportivas na área de abrangência do projeto. Endereços a serem confirmados pelo proponente.',
    cronograma: 'Mês 1-2: Estruturação, contratação de equipe e organização dos grupos (Pré-execução);\nMês 3-8: Execução regular das atividades, avaliações e acompanhamento (Execução);\nMês 9-10: Torneio intermediário e avaliação de meio de percurso;\nMês 11-12: Encerramento, evento final, avaliação final e prestação de contas (Avaliação).',
    resultadosEsperados: `Ao final do projeto, espera-se: ${qtd} beneficiários atendidos regularmente; manutenção de taxa de frequência acima de 70%; melhoria comprovada nos indicadores escolares dos participantes; realização de 2 eventos/torneios esportivos; formação de pelo menos 5 profissionais locais em metodologia esportiva educacional.`,
    metasQualitativas: [
      {
        descricao: 'Desenvolver valores cidadãos e socioeducacionais nos beneficiários (respeito, disciplina, trabalho em equipe)',
        indicador: 'Percepção de evolução comportamental e socioeducacional',
        verificador: 'Avaliação pedagógica semestral com base em observação estruturada dos professores',
        prazo: 'Avaliação semestral',
      },
      {
        descricao: 'Melhorar a percepção de pertencimento e integração social dos beneficiários na comunidade',
        indicador: 'Grau de satisfação e engajamento relatado por beneficiários e responsáveis',
        verificador: 'Questionário de satisfação aplicado ao final de cada semestre',
        prazo: 'Semestral',
      },
    ],
    metasQuantitativas: [
      {
        descricao: `Atender ${qtd} beneficiários em atividades regulares de ${modalidade}`,
        indicador: 'Número de beneficiários inscritos e com frequência ativa / número de vagas ofertadas',
        verificador: 'Lista de presença mensal assinada',
        prazo: 'Ao longo de toda a execução do projeto',
      },
      {
        descricao: 'Manter frequência média acima de 70% dos beneficiários',
        indicador: 'Número de presenças / número total de aulas no período',
        verificador: 'Relatório de frequência mensal',
        prazo: 'Avaliação mensal',
      },
      {
        descricao: 'Realizar 2 eventos esportivos com participação da comunidade',
        indicador: 'Número de eventos realizados / número de eventos planejados',
        verificador: 'Registro fotográfico e lista de participantes de cada evento',
        prazo: 'Mês 9 e mês 12',
      },
    ],
    orcamento: [
      { bloco: 'Atividade Fim', categoria: 'Recursos Humanos', item: 'Professor de Educação Física', especificacao: 'Habilitado, 30h semanais, especialista na modalidade', quantidade: 2, unidade: 'Unidade', valorUnitario: 2500, valorTotal: 60000 },
      { bloco: 'Atividade Fim', categoria: 'Recursos Humanos', item: 'Coordenador Pedagógico', especificacao: 'Formação em pedagogia ou educação física, 30h semanais', quantidade: 1, unidade: 'Unidade', valorUnitario: 2800, valorTotal: 33600 },
      { bloco: 'Atividade Fim', categoria: 'Material Esportivo', item: `Kit de material para prática de ${modalidade}`, especificacao: 'Equipamentos e acessórios necessários à prática regular', quantidade: 80, unidade: 'Unidade', valorUnitario: 150, valorTotal: 12000 },
      { bloco: 'Atividade Fim', categoria: 'Uniformes', item: 'Uniforme esportivo completo', especificacao: 'Camiseta e calção em tecido dry fit, tamanhos variados', quantidade: 80, unidade: 'Unidade', valorUnitario: 65, valorTotal: 5200 },
      { bloco: 'Atividade Fim', categoria: 'Alimentação', item: 'Lanche complementar pós-atividade', especificacao: 'Sanduíche, suco e fruta, para os dias de aula', quantidade: 2880, unidade: 'Refeição', valorUnitario: 6, valorTotal: 17280 },
      { bloco: 'Atividade Fim', categoria: 'Transporte', item: 'Transporte de beneficiários', especificacao: 'Locação de van para deslocamento até o local de execução', quantidade: 12, unidade: 'Mês', valorUnitario: 3200, valorTotal: 38400 },
      { bloco: 'Atividade Meio', categoria: 'Recursos Humanos', item: 'Assistente Administrativo', especificacao: 'Nível médio/técnico, 30h semanais, cadastros e frequência', quantidade: 1, unidade: 'Unidade', valorUnitario: 1600, valorTotal: 19200 },
      { bloco: 'Atividade Meio', categoria: 'Serviços Operacionais', item: 'Contabilidade do projeto', especificacao: 'Serviço mensal de contabilidade e prestação de contas', quantidade: 12, unidade: 'Mês', valorUnitario: 900, valorTotal: 10800 },
      { bloco: 'Elaboração e Captação de Recursos', categoria: 'Serviços de Produção', item: 'Elaboração técnica do projeto', especificacao: 'Consultoria especializada para estruturação do projeto conforme normas do SLI', quantidade: 1, unidade: 'Unidade', valorUnitario: 8000, valorTotal: 8000 },
    ],
    confiancaGeral: 55,
    confiancaCampos: {
      justificativa: 60,
      metodologia: 55,
      orcamento: 50,
      metas: 65,
    },
    pedirMaisContexto: true,
    perguntasAdicionais: [
      'Em qual cidade/bairro o projeto será realizado?',
      'Qual é o nome da entidade proponente e há quanto tempo atua?',
      'Você tem espaço esportivo disponível ou precisará locar?',
      'Qual é o valor total que pretende captar via Lei de Incentivo?',
    ],
    avisos: [
      'Localização específica não informada — revisar antes do envio.',
      'Orçamento gerado com valores estimados — ajustar conforme cotações reais de mercado.',
      'Dados do proponente precisam ser preenchidos manualmente.',
      'Confirmar percentual de beneficiários da rede pública (mínimo 50% exigido para Formação Esportiva).',
    ],
  }
}
