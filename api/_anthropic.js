// Cliente único da Anthropic para as Vercel Functions. Modelo fixo no servidor.
// Usa tool use forçado: a API devolve a resposta como objeto JSON já validado,
// sem risco de vírgula faltando ou sobrando.
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
export const MODELO = 'claude-haiku-5-5'

const FERRAMENTA = {
  name: 'responder',
  description: 'Envia a resposta final. Preencha com o objeto JSON exatamente no formato pedido nas instruções.',
  input_schema: { type: 'object', additionalProperties: true },
}

// Retorna { texto, uso: { input_tokens, output_tokens } }
export async function chamarClaude({ system, user, maxTokens = 2048 }) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
      tools: [FERRAMENTA],
      tool_choice: { type: 'tool', name: 'responder' },
    }),
  })
  if (!r.ok) {
    // O detalhe vai só para o log da Vercel, nunca para o navegador.
    console.error('Anthropic', r.status, await r.text())
    const err = new Error('upstream_error')
    err.status = r.status
    throw err
  }
  const data = await r.json()
  const uso = {
    input_tokens: data?.usage?.input_tokens ?? 0,
    output_tokens: data?.usage?.output_tokens ?? 0,
  }
  if (data.stop_reason === 'max_tokens') {
    console.error('Anthropic: resposta cortada por max_tokens', uso)
    const err = new Error('resposta_cortada')
    err.status = 413
    err.uso = uso
    throw err
  }
  const bloco = (data.content || []).find((b) => b.type === 'tool_use')
  const texto = bloco && bloco.input
    ? JSON.stringify(bloco.input)
    : (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  return { texto, uso }
}
