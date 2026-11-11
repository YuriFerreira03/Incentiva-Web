// ─────────────────────────────────────────────────────────────────────────────
// Cliente único da Anthropic para as Vercel Functions.
// Arquivo com "_" no início: a Vercel NÃO expõe como rota.
// Modelo FIXO no servidor: o cliente não consegue pedir outro modelo.
//
// Variável no painel da Vercel: ANTHROPIC_API_KEY (workspace "Incentiva").
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
export const MODELO = 'claude-haiku-5-5'

export async function chamarClaude({ system, user, temperature = 0.3, maxTokens = 2048 }) {
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
    }),
  })
  if (!r.ok) {
    const detalhe = await r.text()
    console.error('Anthropic', r.status, detalhe)
    const err = new Error('upstream_error')
    err.status = r.status
    err.detalhe = detalhe
    err.detalhe = detalhe
    throw err
  }
  const data = await r.json()
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
}
