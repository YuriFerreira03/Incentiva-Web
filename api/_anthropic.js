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
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
      tools: [FERRAMENTA],
      tool_choice: { type: 'tool', name: 'responder' },
    }),
  })
  if (!r.ok) {
    const detalhe = await r.text()
    console.error('Anthropic', r.status, detalhe)
    const err = new Error('upstream_error')
    err.status = r.status
    err.detalhe = detalhe
    throw err
  }
  const data = await r.json()
  if (data.stop_reason === 'max_tokens') {
    console.error('Anthropic: resposta cortada por max_tokens')
    const err = new Error('resposta_cortada')
    err.status = 413
    throw err
  }
  const bloco = (data.content || []).find((b) => b.type === 'tool_use')
  if (bloco && bloco.input) return JSON.stringify(bloco.input)
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
}
