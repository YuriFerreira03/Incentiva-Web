// ─────────────────────────────────────────────────────────────────────────────
// Proxy seguro para a IA (Vercel Function).
// A chave da Groq fica SÓ aqui (variável sem prefixo VITE_), nunca no navegador.
//
// Variáveis no painel da Vercel (Settings → Environment Variables):
//   GROQ_API_KEY   (obrigatória, tipo Secret)
//   AI_MODEL       (opcional; padrão openai/gpt-oss-120b)
//   + as do Supabase que já existem (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
//
// Só responde a usuários logados COM PERFIL DE PROPONENTE: o navegador envia o token do Supabase e a
// função confere usuário e papel antes de gastar qualquer cota da Groq.
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MAX_SYSTEM = 30000
const MAX_USER = 60000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!apiKey || !supabaseUrl || !supabaseAnon) {
    return res.status(500).json({ error: 'server_not_configured' })
  }

  // 1) Autenticação: o token precisa ser de um usuário válido do Supabase
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnon, Authorization: `Bearer ${token}` },
    })
    if (!r.ok) return res.status(401).json({ error: 'unauthorized' })
  } catch {
    return res.status(502).json({ error: 'auth_unavailable' })
  }

  // 1b) Papel: este endpoint é do Módulo A, então só proponente. A leitura usa o token do próprio
  //     usuário (a regra de acesso do banco só devolve os papéis dele), sem chave service_role.
  try {
    const rp = await fetch(`${supabaseUrl}/rest/v1/perfis_acesso?select=papel&papel=eq.proponente&limit=1`, {
      headers: { apikey: supabaseAnon, Authorization: `Bearer ${token}` },
    })
    if (!rp.ok) return res.status(502).json({ error: 'perfil_indisponivel' })
    const papeis = await rp.json()
    if (!Array.isArray(papeis) || papeis.length === 0) return res.status(403).json({ error: 'forbidden' })
  } catch {
    return res.status(502).json({ error: 'perfil_indisponivel' })
  }

  // 2) Entrada: só aceita system/user/temperature. Modelo e formato são fixos
  //    no servidor, então o cliente não consegue pedir outro modelo.
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = null
    }
  }
  const { system, user, temperature } = body || {}
  if (
    typeof system !== 'string' || typeof user !== 'string' ||
    !system || !user || system.length > MAX_SYSTEM || user.length > MAX_USER
  ) {
    return res.status(400).json({ error: 'invalid_request' })
  }
  const temp = typeof temperature === 'number' ? Math.min(1, Math.max(0, temperature)) : 0.3

  // 3) Chamada à Groq
  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: temp,
      }),
    })
    if (!r.ok) {
      // não repassa o corpo do erro (pode conter detalhes da conta)
      return res.status(r.status === 429 ? 429 : 502).json({ error: 'upstream_error', status: r.status })
    }
    const data = await r.json()
    return res.status(200).json({ content: data?.choices?.[0]?.message?.content ?? '' })
  } catch {
    return res.status(502).json({ error: 'upstream_unreachable' })
  }
}
