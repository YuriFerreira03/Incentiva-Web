import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Lock, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/hooks/useAuth'

type Tab = 'perfil' | 'seguranca'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12.5px] font-medium text-slate-300">{label}</label>
      {children}
    </div>
  )
}

const inputClass = `
  w-full rounded-xl border border-white/10 bg-white/5 text-white
  text-[13.5px] px-4 py-2.5 outline-none placeholder-slate-600
  focus:border-cyan-500/50 focus:bg-white/8 transition-all
`

export function PerfilPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(
    searchParams.get('tab') === 'seguranca' ? 'seguranca' : 'perfil'
  )

  // ─── Estado Perfil ──────────────────────────────────────────────────────
  const [nome, setNome] = useState(user?.name ?? '')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [msgPerfil, setMsgPerfil] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => { setNome(user?.name ?? '') }, [user?.name])

  async function handleSalvarPerfil() {
    setSalvandoPerfil(true)
    setMsgPerfil(null)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: nome }
    })
    if (error) setMsgPerfil({ tipo: 'erro', texto: error.message })
    else setMsgPerfil({ tipo: 'ok', texto: 'Perfil atualizado com sucesso!' })
    setSalvandoPerfil(false)
  }

  // ─── Estado Segurança ───────────────────────────────────────────────────
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function handleSalvarSenha() {
    setMsgSenha(null)
    if (novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }
    if (novaSenha !== confirmar) {
      setMsgSenha({ tipo: 'erro', texto: 'As senhas não coincidem.' })
      return
    }
    setSalvandoSenha(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) setMsgSenha({ tipo: 'erro', texto: error.message })
    else {
      setMsgSenha({ tipo: 'ok', texto: 'Senha alterada com sucesso!' })
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
    }
    setSalvandoSenha(false)
  }

  // Detecta se é conta Google (sem senha)
  const isGoogleAccount = user?.avatarUrl?.includes('googleusercontent') ?? false

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">

      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Minha conta</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie suas informações e segurança.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl border border-white/10 bg-white/3">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-white/10" />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}
          >
            {(user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-[14px] font-semibold text-white">{user?.name ?? '—'}</div>
          <div className="text-[12.5px] text-slate-500">{user?.email}</div>
          {isGoogleAccount && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
              <img src="https://www.google.com/favicon.ico" alt="" className="w-3 h-3" />
              Conta Google
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        {([
          { key: 'perfil', label: 'Dados pessoais', icon: <User size={14} /> },
          { key: 'seguranca', label: 'Segurança', icon: <Lock size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              tab === t.key
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Perfil ── */}
      {tab === 'perfil' && (
        <div className="space-y-5">
          <Field label="Nome completo">
            <input
              className={inputClass}
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
            />
          </Field>

          <Field label="E-mail">
            <input
              className={`${inputClass} opacity-50 cursor-not-allowed`}
              value={user?.email ?? ''}
              disabled
            />
            <p className="text-[11.5px] text-slate-600">O e-mail não pode ser alterado por aqui.</p>
          </Field>

          {msgPerfil && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] ${
              msgPerfil.tipo === 'ok'
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/25 text-red-300'
            }`}>
              {msgPerfil.tipo === 'ok'
                ? <CheckCircle2 size={15} />
                : <AlertTriangle size={15} />}
              {msgPerfil.texto}
            </div>
          )}

          <button
            onClick={handleSalvarPerfil}
            disabled={salvandoPerfil || !nome.trim()}
            className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}
          >
            {salvandoPerfil ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {/* ── TAB: Segurança ── */}
      {tab === 'seguranca' && (
        <div className="space-y-5">
          {isGoogleAccount ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <img src="https://www.google.com/favicon.ico" alt="" className="w-6 h-6" />
              </div>
              <p className="text-[13.5px] text-white font-semibold mb-1">Conta vinculada ao Google</p>
              <p className="text-[12.5px] text-slate-400">
                Sua autenticação é gerenciada pelo Google. Para alterar sua senha, acesse as configurações da sua conta Google.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-[12.5px] text-slate-400">
                Para alterar sua senha, simplesmente preencha a nova senha abaixo. Por segurança, você precisará confirmar.
              </div>

              <Field label="Nova senha">
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    className={`${inputClass} pr-10`}
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setMostrarSenha(v => !v)}
                  >
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirmar nova senha">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  className={inputClass}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </Field>

              {msgSenha && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] ${
                  msgSenha.tipo === 'ok'
                    ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/25 text-red-300'
                }`}>
                  {msgSenha.tipo === 'ok'
                    ? <CheckCircle2 size={15} />
                    : <AlertTriangle size={15} />}
                  {msgSenha.texto}
                </div>
              )}

              <button
                onClick={handleSalvarSenha}
                disabled={salvandoSenha || !novaSenha || !confirmar}
                className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}
              >
                {salvandoSenha ? 'Salvando…' : 'Alterar senha'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
