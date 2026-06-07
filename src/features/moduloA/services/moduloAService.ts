import type { ProjetoGerado } from '../types/moduloA'

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER || 'groq') as string
const API_KEY = import.meta.env.VITE_AI_API_KEY || ''
const MODEL = import.meta.env.VITE_AI_MODEL || 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `Você é um especialista em estruturação de projetos esportivos para a Lei de Incentivo ao Esporte do Brasil (Lei nº 11.438/2006).

Sua missão é transformar a ideia bruta de um proponente em um projeto estruturado e completo para análise técnica preliminar.

REGRAS OBRIGATÓRIAS:
- Escreva sempre em português do Brasil, com linguagem técnica, clara e adequada ao contexto da Lei 11.438/2006.
- Todos os textos gerados devem ser COMPLETOS, detalhados e coerentes entre si (objetivo, justificativa, metas e orçamento devem estar alinhados).
- Se a ideia não der informação suficiente para preencher um campo, gere uma sugestão razoável E indique no campo "avisos" que precisa ser revisada.
- Nunca invente dados numéricos específicos (CNPJ, endereços, nomes de responsáveis).
- Seja honesto: se a confiança em algum campo for baixa, diga claramente.
- Retorne SEMPRE um JSON válido, sem texto fora do JSON, sem markdown.

MANIFESTAÇÕES ESPORTIVAS (escolha a mais adequada):
- Esporte Educacional: projetos escolares, formação de crianças e jovens
- Esporte de Participação: lazer, saúde, terceira idade, comunidade
- Esporte de Rendimento: alto rendimento, competição, atletas de destaque
- Esporte para Toda a Vida: projetos que atendem múltiplas faixas etárias

CAMPOS OBRIGATÓRIOS PELO SLI (preencha todos):
nome, manifestacao, objeto, objetivoGeral, objetivosEspecificos, justificativa, metodologia, publicoBeneficiario, quantidadeBeneficiarios, faixaEtaria, locaisExecucao, cronograma, resultadosEsperados, metas (mín. 3), orcamento (mín. 4 categorias)

SOBRE METAS: Devem ser SMART. Misture quantitativas e qualitativas. Cada meta precisa de indicador mensurável e forma de verificação concreta.

SOBRE ORÇAMENTO: Use as categorias: Recursos humanos, Materiais esportivos, Infraestrutura/locação, Comunicação/divulgação, Gestão e monitoramento, Capacitação, Transporte/logística.`

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

// ─── Prompt principal ────────────────────────────────────────────────────────
export async function gerarProjeto(ideia: string): Promise<ProjetoGerado> {
  const prompt = `Analise a ideia abaixo e gere um projeto esportivo completo estruturado para a Lei de Incentivo ao Esporte.

IDEIA DO PROPONENTE:
"""
${ideia}
"""

Com base nessa ideia, gere o projeto completo no seguinte formato JSON:

{
  "nome": "nome criativo e descritivo do projeto",
  "manifestacao": "Esporte Educacional | Esporte de Participação | Esporte de Rendimento | Esporte para Toda a Vida",
  "objeto": "descrição objetiva e direta do que será realizado (2-3 frases)",
  "objetivoGeral": "objetivo geral claro, com verbo de resultado, público e prazo",
  "objetivosEspecificos": "lista de 4-5 objetivos específicos, um por linha, começando com verbo no infinitivo",
  "justificativa": "justificativa completa com contexto social, problema identificado e relevância do projeto (mínimo 3 parágrafos)",
  "metodologia": "metodologia detalhada: como será executado, frequência, duração das atividades, equipe, abordagem pedagógica (mínimo 2 parágrafos)",
  "publicoBeneficiario": "descrição completa do público-alvo",
  "quantidadeBeneficiarios": número estimado (inteiro),
  "faixaEtaria": "faixa etária principal",
  "atendePCD": true/false,
  "locaisExecucao": "locais onde o projeto será executado",
  "cronograma": "cronograma resumido por fase (ex: Mês 1-2: ..., Mês 3-6: ...)",
  "resultadosEsperados": "resultados concretos e mensuráveis esperados ao final do projeto",
  "metas": [
    {
      "descricao": "descrição da meta",
      "tipo": "Quantitativa",
      "indicador": "como será medido",
      "verificador": "documento/registro que comprova",
      "prazo": "quando será alcançada"
    }
  ],
  "orcamento": [
    {
      "categoria": "categoria do gasto",
      "descricao": "o que será contratado/comprado",
      "valor": valor estimado em reais (número)
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
}`

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
function mockGerarProjeto(ideia: string): ProjetoGerado {
  const lower = ideia.toLowerCase()
  const modalidade = lower.includes('natação') ? 'natação'
    : lower.includes('futebol') ? 'futebol'
    : lower.includes('basquete') ? 'basquete'
    : lower.includes('vôlei') || lower.includes('volei') ? 'vôlei'
    : 'esporte'

  return {
    nome: `Projeto de ${modalidade.charAt(0).toUpperCase() + modalidade.slice(1)} Comunitário`,
    manifestacao: 'Esporte Educacional',
    objeto: `Desenvolvimento e prática regular de ${modalidade} para crianças e adolescentes, com foco em formação esportiva, educação e inclusão social.`,
    objetivoGeral: `Promover o acesso à prática regular de ${modalidade} para jovens em situação de vulnerabilidade social, contribuindo para o desenvolvimento físico, social e educacional dos beneficiários ao longo de 12 meses de execução.`,
    objetivosEspecificos: `Oferecer aulas regulares de ${modalidade} com frequência mínima de 3 vezes por semana;\nCapacitar técnicos e educadores para atuação com crianças e adolescentes;\nAcompanhar indicadores de desempenho escolar dos beneficiários;\nRealizar ao menos 2 torneios ou eventos esportivos durante o projeto;\nDesenvolver valores como disciplina, trabalho em equipe e fair play.`,
    justificativa: `A prática esportiva regular é reconhecida como ferramenta fundamental para o desenvolvimento integral de crianças e adolescentes, especialmente aqueles em situação de vulnerabilidade social. Estudos do IBGE e da UNESCO demonstram que jovens engajados em atividades esportivas estruturadas apresentam melhor desempenho escolar, menor índice de evasão escolar e maior resiliência frente às adversidades sociais.\n\nO território de execução do projeto apresenta déficit significativo de equipamentos esportivos públicos e de acesso a práticas esportivas orientadas. A ausência de opções estruturadas de lazer e esporte no contraturno escolar expõe essa população a riscos como o envolvimento com situações de violência e abandono escolar.\n\nO projeto se enquadra plenamente nas diretrizes da Lei nº 11.438/2006, que visa democratizar o acesso ao esporte e promover a formação esportiva de qualidade para toda a população brasileira, especialmente as mais vulneráveis.`,
    metodologia: `O projeto será executado por meio de aulas regulares de ${modalidade}, ministradas por profissionais de Educação Física habilitados, em horários acessíveis ao público-alvo. As atividades seguirão uma progressão pedagógica adequada a cada faixa etária, combinando fundamentos técnicos, táticos e formativos.\n\nCada sessão terá duração de 90 minutos e incluirá aquecimento, parte técnica, jogo aplicado e momento de reflexão sobre valores do esporte. Serão realizadas avaliações periódicas dos beneficiários a cada 3 meses, com registro de frequência, evolução técnica e indicadores socioeducacionais. A equipe executora realizará reuniões quinzenais para alinhamento pedagógico e ajuste das atividades.`,
    publicoBeneficiario: 'Crianças e adolescentes de 8 a 17 anos em situação de vulnerabilidade social',
    quantidadeBeneficiarios: 150,
    faixaEtaria: '8 a 17 anos',
    atendePCD: false,
    locaisExecucao: 'Ginásio e quadras esportivas na área de abrangência do projeto. Endereços a serem confirmados pelo proponente.',
    cronograma: 'Mês 1-2: Estruturação, contratação de equipe e organização dos grupos;\nMês 3-8: Execução regular das atividades, avaliações e acompanhamento;\nMês 9-10: Torneio intermediário e avaliação de meio de percurso;\nMês 11-12: Encerramento, evento final, prestação de contas e relatório.',
    resultadosEsperados: `Ao final do projeto, espera-se: ${150} beneficiários atendidos regularmente; manutenção de taxa de frequência acima de 70%; melhoria comprovada nos indicadores escolares dos participantes; realização de 2 eventos/torneios esportivos; formação de pelo menos 5 profissionais locais em metodologia esportiva educacional.`,
    metas: [
      {
        descricao: `Atender 150 beneficiários em atividades regulares de ${modalidade}`,
        tipo: 'Quantitativa',
        indicador: 'Número de beneficiários inscritos e com frequência ativa',
        verificador: 'Lista de presença mensal assinada',
        prazo: 'Ao longo de toda a execução do projeto',
      },
      {
        descricao: 'Manter frequência média acima de 70% dos beneficiários',
        tipo: 'Quantitativa',
        indicador: 'Percentual de presença mensal',
        verificador: 'Relatório de frequência mensal',
        prazo: 'Avaliação mensal',
      },
      {
        descricao: 'Realizar 2 eventos esportivos com participação da comunidade',
        tipo: 'Quantitativa',
        indicador: 'Número de eventos realizados',
        verificador: 'Registro fotográfico e lista de participantes',
        prazo: 'Mês 9 e mês 12',
      },
      {
        descricao: 'Desenvolver valores cidadãos e socioeducacionais nos beneficiários',
        tipo: 'Qualitativa',
        indicador: 'Percepção de evolução socioeducacional',
        verificador: 'Avaliação pedagógica semestral e relatos de responsáveis',
        prazo: 'Avaliação semestral',
      },
    ],
    orcamento: [
      { categoria: 'Recursos humanos', descricao: 'Professores de Educação Física (2 profissionais × 12 meses)', valor: 72000 },
      { categoria: 'Materiais esportivos', descricao: `Bolas, equipamentos e uniformes para prática de ${modalidade}`, valor: 18000 },
      { categoria: 'Infraestrutura/locação', descricao: 'Locação de espaço esportivo para atividades', valor: 24000 },
      { categoria: 'Gestão e monitoramento', descricao: 'Coordenação, relatórios e prestação de contas', valor: 12000 },
      { categoria: 'Comunicação/divulgação', descricao: 'Material gráfico, redes sociais e eventos', valor: 6000 },
      { categoria: 'Capacitação', descricao: 'Treinamento da equipe e formação continuada', valor: 4000 },
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
      'Orçamento gerado com valores estimados — ajustar conforme realidade local.',
      'Dados do proponente precisam ser preenchidos manualmente.',
    ],
  }
}
