import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Trash2,
  Plus,
  FileDown,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { gerarProjeto, refazerProjeto, analisarIdeia } from "../services/moduloAService";
import { gerarPDFProjeto } from "../services/pdfGerador";
import type { ProjetoGerado, TelaModuloA, PreAnalise, Meta, ItemOrcamento } from "../types/moduloA";
import { supabase } from "../../../lib/supabase";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ConfBadge({ v }: { v: number }) {
  const cor =
    v >= 75
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : v >= 50
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-red-500/15 text-red-300 border-red-500/30";
  const label =
    v >= 75 ? "Boa confiança" : v >= 50 ? "Revisar" : "Precisa revisão";
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cor}`}
    >
      {v}% · {label}
    </span>
  );
}

// ─── Edição inline de campo curto (texto de uma linha) ───────────────────────
function CampoEditavelTexto({
  label, valor, onSave, placeholder,
}: {
  label: string;
  valor: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(valor);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      {editando ? (
        <div className="space-y-2">
          <input
            className="w-full rounded-lg bg-white/5 border border-cyan-500/50 text-white text-[14px] px-3 py-2 outline-none"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => { onSave(draft); setEditando(false); }} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/30">
              <Check size={12} /> Salvar
            </button>
            <button type="button" onClick={() => { setDraft(valor); setEditando(false); }} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-slate-400 text-[12px] hover:bg-white/10">
              <X size={12} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="group">
          <p className="text-white font-semibold text-[15px]">{valor || "—"}</p>
          <button type="button" onClick={() => { setDraft(valor); setEditando(true); }} className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-slate-500 hover:text-cyan-400">
            <Edit3 size={11} /> Editar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Edição inline numérica ───────────────────────────────────────────────────
function CampoEditavelNumero({
  label, valor, onSave,
}: {
  label: string;
  valor: number;
  onSave: (v: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(String(valor));
  return (
    <div>
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      {editando ? (
        <div className="space-y-1.5">
          <input
            type="number"
            className="w-24 rounded-lg bg-white/5 border border-cyan-500/50 text-white text-[16px] px-2 py-1 outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="flex gap-1.5">
            <button type="button" onClick={() => { onSave(Number(draft) || 0); setEditando(false); }} className="text-emerald-300 hover:text-emerald-200"><Check size={13} /></button>
            <button type="button" onClick={() => { setDraft(String(valor)); setEditando(false); }} className="text-slate-500 hover:text-slate-300"><X size={13} /></button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => { setDraft(String(valor)); setEditando(true); }} className="group flex items-center gap-1.5">
          <span className="text-white font-bold text-xl">{valor}</span>
          <Edit3 size={11} className="text-slate-600 group-hover:text-cyan-400" />
        </button>
      )}
    </div>
  );
}

// ─── Edição inline de select (manifestação) ───────────────────────────────────
function CampoEditavelSelect({
  label, valor, opcoes, onSave,
}: {
  label: string;
  valor: string;
  opcoes: string[];
  onSave: (v: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      {editando ? (
        <select
          className="w-full rounded-lg bg-[#0B1120] border border-cyan-500/50 text-white text-[14px] px-3 py-2 outline-none"
          value={valor}
          onChange={(e) => { onSave(e.target.value); setEditando(false); }}
          onBlur={() => setEditando(false)}
          autoFocus
        >
          {opcoes.map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
      ) : (
        <div className="group">
          <p className="text-white font-semibold text-[15px]">{valor || "—"}</p>
          <button type="button" onClick={() => setEditando(true)} className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-slate-500 hover:text-cyan-400">
            <Edit3 size={11} /> Editar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Card de meta editável (qualitativa ou quantitativa) ─────────────────────
function MetaCard({
  meta, onSave, onRemove,
}: {
  meta: Meta;
  onSave: (campo: keyof Meta, valor: string) => void;
  onRemove: () => void;
}) {
  const [editando, setEditando] = useState(meta.descricao === "");
  const [draft, setDraft] = useState<Meta>(meta);

  function salvarTudo() {
    (Object.keys(draft) as (keyof Meta)[]).forEach((k) => {
      if (draft[k] !== meta[k]) onSave(k, draft[k]);
    });
    setEditando(false);
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-cyan-500/40 bg-white/3 p-3 space-y-2">
        <input
          className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-[13px] px-2.5 py-1.5 outline-none focus:border-cyan-500/50"
          placeholder="Descrição da meta"
          value={draft.descricao}
          onChange={(e) => setDraft({ ...draft, descricao: e.target.value })}
          autoFocus
        />
        <div className="grid sm:grid-cols-3 gap-2">
          <input className="rounded-lg bg-white/5 border border-white/10 text-white text-[12px] px-2.5 py-1.5 outline-none focus:border-cyan-500/50" placeholder="Indicador" value={draft.indicador} onChange={(e) => setDraft({ ...draft, indicador: e.target.value })} />
          <input className="rounded-lg bg-white/5 border border-white/10 text-white text-[12px] px-2.5 py-1.5 outline-none focus:border-cyan-500/50" placeholder="Verificador" value={draft.verificador} onChange={(e) => setDraft({ ...draft, verificador: e.target.value })} />
          <input className="rounded-lg bg-white/5 border border-white/10 text-white text-[12px] px-2.5 py-1.5 outline-none focus:border-cyan-500/50" placeholder="Prazo" value={draft.prazo} onChange={(e) => setDraft({ ...draft, prazo: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={salvarTudo} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/30">
            <Check size={12} /> Salvar
          </button>
          <button type="button" onClick={() => { setDraft(meta); setEditando(false); }} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-slate-400 text-[12px] hover:bg-white/10">
            <X size={12} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/8 bg-white/3 p-3 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13.5px] text-slate-200 font-medium mb-2">{meta.descricao || "—"}</p>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => setEditando(true)} className="text-slate-500 hover:text-cyan-400"><Edit3 size={13} /></button>
          <button type="button" onClick={onRemove} className="text-slate-500 hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 text-[12px]">
        <div><span className="text-slate-500">Indicador: </span><span className="text-slate-300">{meta.indicador || "—"}</span></div>
        <div><span className="text-slate-500">Verificador: </span><span className="text-slate-300">{meta.verificador || "—"}</span></div>
        <div><span className="text-slate-500">Prazo: </span><span className="text-slate-300">{meta.prazo || "—"}</span></div>
      </div>
    </div>
  );
}

// ─── Card de item de orçamento editável ───────────────────────────────────────
function ItemOrcamentoCard({
  item, onSave, onRemove,
}: {
  item: ItemOrcamento;
  onSave: (campo: keyof ItemOrcamento, valor: string | number) => void;
  onRemove: () => void;
}) {
  const [editando, setEditando] = useState(item.item === "");
  const [draft, setDraft] = useState<ItemOrcamento>(item);

  function salvarTudo() {
    (Object.keys(draft) as (keyof ItemOrcamento)[]).forEach((k) => {
      if (draft[k] !== item[k]) onSave(k, draft[k] as string | number);
    });
    setEditando(false);
  }

  const inputClass = "rounded-lg bg-white/5 border border-white/10 text-white text-[12px] px-2.5 py-1.5 outline-none focus:border-cyan-500/50";

  if (editando) {
    return (
      <div className="px-4 py-3 space-y-2 bg-white/[0.02]">
        <div className="grid sm:grid-cols-2 gap-2">
          <input className={inputClass} placeholder="Categoria" value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })} autoFocus />
          <input className={inputClass} placeholder="Item" value={draft.item} onChange={(e) => setDraft({ ...draft, item: e.target.value })} />
        </div>
        <input className={`${inputClass} w-full`} placeholder="Especificação técnica" value={draft.especificacao} onChange={(e) => setDraft({ ...draft, especificacao: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" className={inputClass} placeholder="Quantidade" value={draft.quantidade} onChange={(e) => setDraft({ ...draft, quantidade: Number(e.target.value) || 0 })} />
          <input className={inputClass} placeholder="Unidade" value={draft.unidade} onChange={(e) => setDraft({ ...draft, unidade: e.target.value })} />
          <input type="number" className={inputClass} placeholder="Valor unitário" value={draft.valorUnitario} onChange={(e) => setDraft({ ...draft, valorUnitario: Number(e.target.value) || 0 })} />
        </div>
        <div className="text-[11px] text-slate-500">
          Total: {(draft.quantidade * draft.valorUnitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={salvarTudo} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/30">
            <Check size={12} /> Salvar
          </button>
          <button type="button" onClick={() => { setDraft(item); setEditando(false); }} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-slate-400 text-[12px] hover:bg-white/10">
            <X size={12} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 group">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-500">{item.categoria || "—"}</div>
        <div className="text-[13.5px] text-slate-200">{item.item || "—"}</div>
        <div className="text-[11.5px] text-slate-500 mt-0.5">{item.especificacao}</div>
        <div className="text-[11px] text-slate-600 mt-0.5">
          {item.quantidade} {item.unidade} × {item.valorUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <div className="text-white font-semibold tabular-nums text-[14px]">
          {item.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => setEditando(true)} className="text-slate-500 hover:text-cyan-400"><Edit3 size={13} /></button>
          <button type="button" onClick={onRemove} className="text-slate-500 hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function SecaoRevisao({
  titulo,
  campo,
  valor,
  confianca,
  onSave,
}: {
  titulo: string;
  campo: string;
  valor: string;
  confianca?: number;
  onSave: (campo: string, v: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(valor);
  const [aberta, setAberta] = useState(true);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        onClick={() => setAberta((a) => !a)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-white">
            {titulo}
          </span>
          {confianca !== undefined && <ConfBadge v={confianca} />}
        </div>
        {aberta ? (
          <ChevronUp size={15} className="text-slate-400" />
        ) : (
          <ChevronDown size={15} className="text-slate-400" />
        )}
      </button>

      {aberta && (
        <div className="px-4 pb-4">
          {editando ? (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg bg-white/5 border border-cyan-500/50 text-white text-[13.5px] leading-relaxed px-3 py-2.5 outline-none resize-none min-h-[80px]"
                rows={Math.max(4, draft.split("\n").length + 1)}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSave(campo, draft);
                    setEditando(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  <Check size={13} /> Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(valor);
                    setEditando(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-[12px] hover:bg-white/10 transition-colors"
                >
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <p className="text-[13.5px] text-slate-300 leading-relaxed whitespace-pre-line">
                {valor || "—"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDraft(valor);
                  setEditando(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-cyan-400 transition-colors"
              >
                <Edit3 size={12} /> Editar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
// ─── Guia: 7 tópicos. A cobertura vem da ANÁLISE DA IA, não de palavra-chave. ──
// "chave" casa com os nomes que a IA retorna em topicosCobertos/topicosFaltantes.
// ─── Perguntas do wizard passo a passo (mesma ordem/chaves do guia) ──────────
const PERGUNTAS_WIZARD = [
  {
    chave: "modalidade",
    titulo: "Qual é a modalidade esportiva do projeto?",
    helper: "O tipo de esporte que será praticado.",
    placeholder: "Ex: Futebol, natação, atletismo, judô...",
  },
  {
    chave: "público",
    titulo: "Para qual público é o projeto?",
    helper: "Idade, perfil e situação social dos beneficiários.",
    placeholder: "Ex: Crianças de 8 a 14 anos em situação de vulnerabilidade social",
  },
  {
    chave: "local",
    titulo: "Onde o projeto será executado?",
    helper: "Cidade, bairro ou local específico.",
    placeholder: "Ex: Bairro Floresta, em Belo Horizonte - MG",
  },
  {
    chave: "participantes",
    titulo: "Quantas pessoas serão atendidas?",
    helper: "Número estimado de beneficiários diretos.",
    placeholder: "Ex: 80 crianças",
  },
  {
    chave: "duração",
    titulo: "Por quanto tempo o projeto vai durar?",
    helper: "Duração total e frequência das atividades.",
    placeholder: "Ex: 12 meses, com aulas 3 vezes por semana",
  },
  {
    chave: "importância",
    titulo: "Por que esse projeto é importante?",
    helper: "O problema social ou esportivo que o projeto resolve.",
    placeholder: "Ex: A região tem alta vulnerabilidade social e pouco acesso a atividades esportivas",
  },
  {
    chave: "execução",
    titulo: "Como o projeto será executado?",
    helper: "Metodologia, equipe e parcerias envolvidas.",
    placeholder: "Ex: Aulas com professores de educação física, em parceria com o clube local",
  },
] as const;

// ─── Heurística leve: detecta texto sem sentido enquanto digita ─────────────
// Não bloqueia nada — só avisa. A trava de verdade é a análise da IA no final.
function pareceTextoSuspeito(texto: string): boolean {
  const t = texto.trim();
  if (t.length < 4) return false;
  // Caracteres raros em respostas reais em português (típicos de "mão no teclado")
  const caracteresEstranhos = (t.match(/[[\]{}~^`;|']/g) || []).length;
  if (caracteresEstranhos >= 2) return true;
  // Proporção de vogais muito baixa também é sinal de texto aleatório
  const letras = t.toLowerCase().replace(/[^a-záéíóúâêôãõàü]/g, "");
  if (letras.length < 5) return false;
  const vogais = (letras.match(/[aeiouáéíóúâêôãõ]/g) || []).length;
  return vogais / letras.length < 0.2;
}

export function ModuloAPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tela, setTela] = useState<TelaModuloA>("ideia");
  const [ideia, setIdeia] = useState("");
  const [projeto, setProjeto] = useState<ProjetoGerado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [maisContexto, setMaisContexto] = useState("");
  const [mostraMaisContexto, setMostraMaisContexto] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<PreAnalise | null>(null);

  // ─── Wizard de perguntas (chatbot passo a passo) ─────────────────────────
  const [passo, setPasso] = useState(0);
  const [modoResumo, setModoResumo] = useState(false);
  const [respostas, setRespostas] = useState<Record<string, string>>({
    modalidade: "",
    público: "",
    local: "",
    participantes: "",
    duração: "",
    importância: "",
    execução: "",
  });

  // ─── Analisar e gerar ────────────────────────────────────────────────────
  // Um único botão: primeiro a IA pré-analisa; só gera se a ideia for suficiente.
  // Aceita um texto opcional (vindo do wizard); se ausente, usa o estado `ideia`.
  async function handleGerar(textoOverride?: string) {
    const texto = textoOverride ?? ideia;
    if (texto.trim().length < 20 || analisando) return;
    if (textoOverride) setIdeia(textoOverride);
    setErro(null);
    setAnalise(null);
    setAnalisando(true);
    try {
      const pre = await analisarIdeia(texto);
      setAnalise(pre);
      // Trava: só prossegue se o texto for válido E suficiente
      if (!pre.ehTextoValido || !pre.suficiente) {
        setAnalisando(false);
        return; // fica na tela, mostrando o feedback do que falta
      }
      // Passou — gera o projeto completo
      setAnalisando(false);
      setTela("gerando");
      const result = await gerarProjeto(texto);
      setProjeto(result);
      setTela("revisao");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao analisar a ideia.");
      setAnalisando(false);
      setTela("ideia");
    }
  }

  // ─── Compõe o texto único a partir das respostas do wizard ───────────────
  function compilarIdeia(r: Record<string, string>): string {
    return [
      `Modalidade esportiva: ${r.modalidade}.`,
      `Público-alvo: ${r.público}.`,
      `Local de execução: ${r.local}.`,
      `Quantidade estimada de participantes: ${r.participantes}.`,
      `Duração e frequência: ${r.duração}.`,
      `Importância do projeto: ${r.importância}.`,
      `Como será executado: ${r.execução}.`,
    ].join(" ");
  }

  // ─── Botão do resumo: se já analisamos ao chegar aqui e está suficiente,
  // gera direto (evita chamar a IA de novo à toa); senão, cai no fluxo normal.
  async function gerarComRespostas() {
    const texto = compilarIdeia(respostas);
    if (analise && analise.suficiente) {
      setIdeia(texto);
      setErro(null);
      setTela("gerando");
      try {
        const result = await gerarProjeto(texto);
        setProjeto(result);
        setTela("revisao");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao gerar projeto.");
        setTela("ideia");
      }
    } else {
      handleGerar(texto);
    }
  }

  // ─── Refazer com mais contexto ───────────────────────────────────────────
  async function handleRefazer() {
    if (!projeto) return;
    setTela("gerando");
    try {
      const updated = await refazerProjeto(ideia, maisContexto, projeto);
      setProjeto(updated);
      setMaisContexto("");
      setMostraMaisContexto(false);
      setTela("revisao");
    } catch {
      setTela("revisao");
    }
  }

  // ─── Salvar campo editado ────────────────────────────────────────────────
  // Edição manual = revisão humana. Marcamos o campo (se rastreado) com 100%
  // de confiança e damos um pequeno reforço na confiança geral do projeto.
  function bumpConfianca(prev: ProjetoGerado, campo?: string): ProjetoGerado {
    const novaConfiancaCampos = { ...prev.confiancaCampos };
    if (campo && campo in novaConfiancaCampos) {
      novaConfiancaCampos[campo] = 100;
    }
    const novaGeral = Math.min(100, prev.confiancaGeral + 4);
    return { ...prev, confiancaCampos: novaConfiancaCampos, confiancaGeral: novaGeral };
  }

  function handleSave(campo: string, valor: string) {
    if (!projeto) return;
    setProjeto((prev) => (prev ? bumpConfianca({ ...prev, [campo]: valor }, campo) : prev));
  }

  function handleSaveNumero(campo: string, valor: number) {
    if (!projeto) return;
    setProjeto((prev) => (prev ? bumpConfianca({ ...prev, [campo]: valor }, campo) : prev));
  }

  // ─── Metas: editar / adicionar / remover ─────────────────────────────────
  function handleSaveMeta(
    tipo: "metasQualitativas" | "metasQuantitativas",
    index: number,
    campo: keyof Meta,
    valor: string
  ) {
    if (!projeto) return;
    setProjeto((prev) => {
      if (!prev) return prev;
      const lista = [...prev[tipo]];
      lista[index] = { ...lista[index], [campo]: valor };
      return bumpConfianca({ ...prev, [tipo]: lista }, "metas");
    });
  }

  function handleAddMeta(tipo: "metasQualitativas" | "metasQuantitativas") {
    if (!projeto) return;
    const nova: Meta = { descricao: "", indicador: "", verificador: "", prazo: "" };
    setProjeto((prev) => (prev ? { ...prev, [tipo]: [...prev[tipo], nova] } : prev));
  }

  function handleRemoveMeta(tipo: "metasQualitativas" | "metasQuantitativas", index: number) {
    if (!projeto) return;
    setProjeto((prev) => {
      if (!prev) return prev;
      const lista = prev[tipo].filter((_, i) => i !== index);
      return { ...prev, [tipo]: lista };
    });
  }

  // ─── Orçamento: editar / adicionar / remover ─────────────────────────────
  function handleSaveOrcamentoItem(
    index: number,
    campo: keyof ItemOrcamento,
    valor: string | number
  ) {
    if (!projeto) return;
    setProjeto((prev) => {
      if (!prev) return prev;
      const lista = [...prev.orcamento];
      const item = { ...lista[index], [campo]: valor } as ItemOrcamento;
      if (campo === "quantidade" || campo === "valorUnitario") {
        item.valorTotal = Number(item.quantidade) * Number(item.valorUnitario);
      }
      lista[index] = item;
      return bumpConfianca({ ...prev, orcamento: lista }, "orcamento");
    });
  }

  function handleAddOrcamentoItem(bloco: ItemOrcamento["bloco"]) {
    if (!projeto) return;
    const novo: ItemOrcamento = {
      bloco,
      categoria: "",
      item: "",
      especificacao: "",
      quantidade: 1,
      unidade: "Unidade",
      valorUnitario: 0,
      valorTotal: 0,
    };
    setProjeto((prev) => (prev ? { ...prev, orcamento: [...prev.orcamento, novo] } : prev));
  }

  function handleRemoveOrcamentoItem(index: number) {
    if (!projeto) return;
    setProjeto((prev) => {
      if (!prev) return prev;
      return { ...prev, orcamento: prev.orcamento.filter((_, i) => i !== index) };
    });
  }

  // ─── Enviar para revisão humana ──────────────────────────────────────────
  async function handleEnviar() {
    if (!projeto || !user) return;
    setTela("enviando");
    setErro(null);
    try {
      const { error } = await supabase.from("projetos").insert({
        user_id: user.id,
        status: "em_revisao",
        ideia_original: ideia,
        nome: projeto.nome,
        manifestacao: projeto.manifestacao,
        objeto: projeto.objeto,
        objetivo_geral: projeto.objetivoGeral,
        objetivos_especificos: projeto.objetivosEspecificos,
        justificativa: projeto.justificativa,
        metodologia: projeto.metodologia,
        publico_beneficiario: projeto.publicoBeneficiario,
        quantidade_beneficiarios: projeto.quantidadeBeneficiarios,
        faixa_etaria: projeto.faixaEtaria,
        criterios_selecao: projeto.criteriosSelecao ?? null,
        adequacao_manifestacao: projeto.adequacaoManifestacao ?? null,
        atende_pcd: projeto.atendePCD,
        locais_execucao: projeto.locaisExecucao,
        cronograma: projeto.cronograma,
        resultados_esperados: projeto.resultadosEsperados,
        acessibilidade: projeto.acessibilidade ?? null,
        metas_qualitativas: projeto.metasQualitativas,
        metas_quantitativas: projeto.metasQuantitativas,
        orcamento: projeto.orcamento,
        confianca_geral: projeto.confiancaGeral,
        avisos: projeto.avisos,
        perguntas_adicionais: projeto.perguntasAdicionais,
      });
      if (error) throw error;
      setTela("enviado");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar projeto.");
      setTela("revisao");
    }
  }

  // ─── TELA: ideia ─────────────────────────────────────────────────────────
  if (tela === "ideia") {
    const perguntaAtual = PERGUNTAS_WIZARD[passo];
    const respostaAtual = respostas[perguntaAtual.chave] ?? "";
    const ehUltimaPergunta = passo === PERGUNTAS_WIZARD.length - 1;
    const podeAvancar = respostaAtual.trim().length >= 2;

    function atualizarResposta(valor: string) {
      setRespostas((prev) => ({ ...prev, [perguntaAtual.chave]: valor }));
    }

    function irParaProxima() {
      if (!podeAvancar) return;
      if (ehUltimaPergunta) {
        finalizarERevisar();
      } else {
        setPasso((p) => p + 1);
      }
    }

    // Ao chegar no resumo, já dispara a análise da IA — sem precisar de um segundo clique
    async function finalizarERevisar() {
      setModoResumo(true);
      setErro(null);
      setAnalisando(true);
      try {
        const pre = await analisarIdeia(compilarIdeia(respostas));
        setAnalise(pre);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao analisar as respostas.");
      } finally {
        setAnalisando(false);
      }
    }

    function irParaAnterior() {
      if (passo > 0) setPasso((p) => p - 1);
    }

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
          color: "#F1F5F9",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full">
          {!modoResumo ? (
            <>
              {/* Progresso */}
              <div className="w-full mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-cyan-400 tracking-wide uppercase">
                    Pergunta {passo + 1} de {PERGUNTAS_WIZARD.length}
                  </span>
                  <span className="text-[12px] text-slate-500">
                    {Math.round(((passo + 1) / PERGUNTAS_WIZARD.length) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((passo + 1) / PERGUNTAS_WIZARD.length) * 100}%`,
                      background: "linear-gradient(90deg, #06B6D4, #3B82F6)",
                    }}
                  />
                </div>
              </div>

              {/* Ícone + pergunta */}
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-5">
                <Lightbulb className="text-cyan-400" size={22} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
                {perguntaAtual.titulo}
              </h1>
              <p className="text-slate-400 text-center text-[14px] mb-8">
                {perguntaAtual.helper}
              </p>

              <div className="w-full space-y-4">
                <textarea
                  key={perguntaAtual.chave}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-[15px] leading-relaxed px-5 py-4 outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all resize-none"
                  style={{ minHeight: 130 }}
                  placeholder={perguntaAtual.placeholder}
                  value={respostaAtual}
                  onChange={(e) => atualizarResposta(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      irParaProxima();
                    }
                  }}
                />

                {/* Aviso leve, não bloqueia — só a IA no final trava de verdade */}
                {pareceTextoSuspeito(respostaAtual) && (
                  <div className="flex items-center gap-2 text-[12.5px] text-amber-400/90 px-1 -mt-2">
                    <AlertTriangle size={13} className="shrink-0" />
                    Isso não parece uma resposta válida — tenta escrever com suas palavras.
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={irParaAnterior}
                    disabled={passo === 0}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      passo === 0
                        ? "text-slate-700 cursor-not-allowed"
                        : "text-slate-300 border border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <ArrowLeft size={15} /> Voltar
                  </button>

                  <button
                    onClick={irParaProxima}
                    disabled={!podeAvancar}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[14px] transition-all"
                    style={
                      podeAvancar
                        ? {
                            background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                            color: "white",
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            color: "#64748B",
                            cursor: "not-allowed",
                          }
                    }
                  >
                    {ehUltimaPergunta ? "Revisar respostas" : "Próxima"}
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Bolinhas de progresso clicáveis */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {PERGUNTAS_WIZARD.map((p, i) => (
                    <button
                      key={p.chave}
                      onClick={() => setPasso(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === passo
                          ? "bg-cyan-400 w-6"
                          : respostas[p.chave]?.trim()
                          ? "bg-cyan-400/40"
                          : "bg-white/15"
                      }`}
                      aria-label={`Ir para pergunta ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ── Tela de resumo — revisar antes de gerar ── */}
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-5">
                <CheckCircle2 className="text-cyan-400" size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
                Revise suas respostas
              </h1>
              <p className="text-slate-400 text-center text-[14px] mb-8">
                Confira o que você escreveu. Pode editar qualquer resposta antes de gerar o projeto.
              </p>

              <div className="w-full space-y-3 mb-6">
                {PERGUNTAS_WIZARD.map((p, i) => (
                  <div
                    key={p.chave}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                          {p.titulo}
                        </div>
                        <p className="text-[13.5px] text-slate-200">
                          {respostas[p.chave] || "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setPasso(i);
                          setModoResumo(false);
                        }}
                        className="shrink-0 flex items-center gap-1 text-[12px] text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {erro && (
                <div className="w-full rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center gap-2 mb-4">
                  <AlertTriangle size={15} /> {erro}
                </div>
              )}

              {/* Enquanto a IA analisa automaticamente ao chegar aqui */}
              {analisando && !analise && (
                <div className="w-full flex items-center gap-2.5 text-[13px] text-cyan-300 px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 mb-4">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analisando suas respostas...
                </div>
              )}

              {/* Feedback da pré-análise da IA */}
              {analise && !analise.suficiente && (
                <div
                  className={`w-full rounded-xl border px-4 py-3.5 mb-4 ${
                    analise.ehTextoValido
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        analise.ehTextoValido ? "text-amber-400" : "text-red-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-[13.5px] font-medium ${
                          analise.ehTextoValido ? "text-amber-200" : "text-red-200"
                        }`}
                      >
                        {analise.mensagem}
                      </p>
                      {analise.ehTextoValido && analise.topicosFaltantes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {analise.topicosFaltantes.map((t) => (
                            <span
                              key={t}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25"
                            >
                              falta: {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full flex items-center gap-3">
                <button
                  onClick={() => setModoResumo(false)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-medium text-slate-300 border border-white/10 hover:bg-white/5 transition-all"
                >
                  <ArrowLeft size={15} /> Voltar ao formulário
                </button>
                <button
                  onClick={gerarComRespostas}
                  disabled={analisando}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-[15px] transition-all"
                  style={
                    !analisando
                      ? {
                          background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                          color: "white",
                          boxShadow: "0 8px 30px -8px rgba(6,182,212,0.5)",
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          color: "#64748B",
                          cursor: "not-allowed",
                        }
                  }
                >
                  {analisando ? (
                    <>
                      <svg className="animate-spin h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analisando sua ideia...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Analisar e gerar projeto
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── TELA: gerando ────────────────────────────────────────────────────────
  if (tela === "gerando")
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
        }}
      >
        <div className="text-center space-y-6 px-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
            <div
              className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
              style={{ animation: "spin 2s linear infinite" }}
            />
            <div className="absolute inset-3 rounded-full bg-cyan-400/10 flex items-center justify-center">
              <Sparkles className="text-cyan-400" size={24} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Estruturando seu projeto…
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              A IA está analisando sua ideia e gerando objetivo, justificativa,
              metodologia, metas e orçamento conforme a Lei de Incentivo ao
              Esporte.
            </p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs mx-auto text-[12px] text-slate-500">
            {[
              "Analisando a ideia",
              "Identificando a manifestação esportiva",
              "Gerando estrutura do projeto",
              "Criando metas SMART",
              "Estimando orçamento",
            ].map((s, i) => (
              <div
                key={s}
                className="flex items-center gap-2"
                style={{ animationDelay: `${i * 400}ms` }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"
                  style={{ animationDelay: `${i * 400}ms` }}
                />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  // ─── TELA: revisão ────────────────────────────────────────────────────────
  if (tela === "revisao" && projeto) {
    const total = projeto.orcamento.reduce((s, i) => s + i.valorTotal, 0);

    return (
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
          color: "#F1F5F9",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070B14]/90 backdrop-blur px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTela("ideia")}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft size={15} /> Editar ideia
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-[13px] text-slate-300 font-medium truncate max-w-xs">
              {projeto.nome}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostraMaisContexto((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[12px] text-slate-300 hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={13} /> Refazer com IA
            </button>
            <button
              onClick={() => gerarPDFProjeto(projeto)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[12px] text-slate-300 hover:bg-white/5 transition-colors"
            >
              <FileDown size={13} /> Exportar PDF
            </button>
            <button
              onClick={handleEnviar}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                color: "white",
              }}
            >
              <Send size={14} /> Enviar para análise
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
          {/* Indicador de confiança geral */}
          <div
            className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
              projeto.confiancaGeral >= 75
                ? "border-emerald-500/30 bg-emerald-500/5"
                : projeto.confiancaGeral >= 50
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-red-500/30 bg-red-500/5"
            }`}
          >
            {projeto.confiancaGeral >= 75 ? (
              <CheckCircle2
                size={16}
                className="text-emerald-400 mt-0.5 shrink-0"
              />
            ) : (
              <AlertTriangle
                size={16}
                className="text-amber-400 mt-0.5 shrink-0"
              />
            )}
            <div>
              <p className="text-[13px] font-semibold text-white">
                Confiança geral: {projeto.confiancaGeral}%
                {projeto.confiancaGeral < 60 &&
                  " — projeto precisa de mais informações"}
              </p>
              {projeto.avisos.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {projeto.avisos.map((a, i) => (
                    <li key={i} className="text-[12px] text-slate-400">
                      • {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Mais contexto */}
          {mostraMaisContexto && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-cyan-300">
                <MessageSquare size={15} /> Forneça mais contexto para a IA
              </div>
              {projeto.perguntasAdicionais.length > 0 && (
                <ul className="space-y-1">
                  {projeto.perguntasAdicionais.map((q, i) => (
                    <li key={i} className="text-[12.5px] text-slate-400">
                      ❓ {q}
                    </li>
                  ))}
                </ul>
              )}
              <textarea
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-[13.5px] px-3 py-2.5 outline-none focus:border-cyan-500/50 resize-none"
                rows={4}
                placeholder="Responda as perguntas acima ou adicione qualquer informação extra que achar relevante..."
                value={maisContexto}
                onChange={(e) => setMaisContexto(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRefazer}
                  disabled={!maisContexto.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                    color: "white",
                  }}
                >
                  <RefreshCw size={13} /> Regenerar projeto
                </button>
                <button
                  onClick={() => setMostraMaisContexto(false)}
                  className="px-4 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {erro && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} /> {erro}
            </div>
          )}

          {/* Nome e Manifestação (editáveis) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <CampoEditavelTexto
              label="Nome do Projeto"
              valor={projeto.nome}
              onSave={(v) => handleSave("nome", v)}
            />
            <CampoEditavelSelect
              label="Manifestação Esportiva"
              valor={projeto.manifestacao}
              opcoes={["Formação Esportiva", "Esporte para Toda a Vida", "Excelência Esportiva"]}
              onSave={(v) => handleSave("manifestacao", v)}
            />
          </div>

          {/* Seções de texto */}
          <SecaoRevisao
            titulo="Objeto do Projeto"
            campo="objeto"
            valor={projeto.objeto}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Objetivo Geral"
            campo="objetivoGeral"
            valor={projeto.objetivoGeral}
            confianca={projeto.confiancaCampos.objetivoGeral}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Objetivos Específicos"
            campo="objetivosEspecificos"
            valor={projeto.objetivosEspecificos}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Justificativa"
            campo="justificativa"
            valor={projeto.justificativa}
            confianca={projeto.confiancaCampos.justificativa}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Metodologia"
            campo="metodologia"
            valor={projeto.metodologia}
            confianca={projeto.confiancaCampos.metodologia}
            onSave={handleSave}
          />

          {/* Público (editável) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <CampoEditavelTexto
                label="Público Beneficiário"
                valor={projeto.publicoBeneficiario}
                onSave={(v) => handleSave("publicoBeneficiario", v)}
              />
            </div>
            <CampoEditavelNumero
              label="Quantidade"
              valor={projeto.quantidadeBeneficiarios}
              onSave={(v) => handleSaveNumero("quantidadeBeneficiarios", v)}
            />
            <div>
              <CampoEditavelTexto
                label="Faixa Etária"
                valor={projeto.faixaEtaria}
                onSave={(v) => handleSave("faixaEtaria", v)}
              />
            </div>
          </div>

          <SecaoRevisao
            titulo="Locais de Execução"
            campo="locaisExecucao"
            valor={projeto.locaisExecucao}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Cronograma Resumido"
            campo="cronograma"
            valor={projeto.cronograma}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Resultados Esperados"
            campo="resultadosEsperados"
            valor={projeto.resultadosEsperados}
            onSave={handleSave}
          />

          {projeto.acessibilidade && (
            <SecaoRevisao
              titulo="Acessibilidade (obrigatório por lei)"
              campo="acessibilidade"
              valor={projeto.acessibilidade}
              onSave={handleSave}
            />
          )}

          {/* Adequação à manifestação */}
          {projeto.adequacaoManifestacao && (
            <SecaoRevisao
              titulo="Adequação à Manifestação Esportiva"
              campo="adequacaoManifestacao"
              valor={projeto.adequacaoManifestacao}
              onSave={handleSave}
            />
          )}

          {/* Critérios de seleção */}
          {projeto.criteriosSelecao && (
            <SecaoRevisao
              titulo="Critérios de Seleção dos Beneficiários"
              campo="criteriosSelecao"
              valor={projeto.criteriosSelecao}
              onSave={handleSave}
            />
          )}

          {/* Metas Qualitativas (editáveis) */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-white">Metas Qualitativas</span>
              <ConfBadge v={projeto.confiancaCampos.metas ?? 70} />
            </div>
            <div className="p-4 space-y-3">
              {projeto.metasQualitativas.map((m, i) => (
                <MetaCard
                  key={i}
                  meta={m}
                  onSave={(campo, valor) => handleSaveMeta("metasQualitativas", i, campo, valor)}
                  onRemove={() => handleRemoveMeta("metasQualitativas", i)}
                />
              ))}
              <button
                type="button"
                onClick={() => handleAddMeta("metasQualitativas")}
                className="flex items-center gap-1.5 text-[12px] text-cyan-400 hover:text-cyan-300"
              >
                <Plus size={13} /> Adicionar meta qualitativa
              </button>
            </div>
          </div>

          {/* Metas Quantitativas (editáveis) */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-white">Metas Quantitativas</span>
            </div>
            <div className="p-4 space-y-3">
              {projeto.metasQuantitativas.map((m, i) => (
                <MetaCard
                  key={i}
                  meta={m}
                  onSave={(campo, valor) => handleSaveMeta("metasQuantitativas", i, campo, valor)}
                  onRemove={() => handleRemoveMeta("metasQuantitativas", i)}
                />
              ))}
              <button
                type="button"
                onClick={() => handleAddMeta("metasQuantitativas")}
                className="flex items-center gap-1.5 text-[12px] text-cyan-400 hover:text-cyan-300"
              >
                <Plus size={13} /> Adicionar meta quantitativa
              </button>
            </div>
          </div>

          {/* Orçamento granular, agrupado por bloco */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-white">Orçamento Estimado</span>
              <ConfBadge v={projeto.confiancaCampos.orcamento ?? 60} />
            </div>

            {(["Atividade Fim", "Atividade Meio", "Elaboração e Captação de Recursos"] as const).map((bloco) => {
              const itensComIndice = projeto.orcamento
                .map((it, idxOriginal) => ({ it, idxOriginal }))
                .filter(({ it }) => it.bloco === bloco);
              const subtotal = itensComIndice.reduce((s, { it }) => s + it.valorTotal, 0);
              const pctDoTotal = total > 0 ? (subtotal / total) * 100 : 0;
              return (
                <div key={bloco} className="border-t border-white/10 first:border-t-0">
                  <div className="px-4 py-2 bg-white/[0.03] flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-cyan-300">{bloco}</span>
                    <span className="text-[11px] text-slate-500">
                      {subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                      {" "}· {pctDoTotal.toFixed(1)}% do total
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {itensComIndice.map(({ it, idxOriginal }) => (
                      <ItemOrcamentoCard
                        key={idxOriginal}
                        item={it}
                        onSave={(campo, valor) => handleSaveOrcamentoItem(idxOriginal, campo, valor)}
                        onRemove={() => handleRemoveOrcamentoItem(idxOriginal)}
                      />
                    ))}
                  </div>
                  <div className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleAddOrcamentoItem(bloco)}
                      className="flex items-center gap-1.5 text-[12px] text-cyan-400 hover:text-cyan-300"
                    >
                      <Plus size={13} /> Adicionar item em {bloco}
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex justify-between">
              <span className="text-[13px] font-bold text-white">TOTAL ESTIMADO</span>
              <span className="text-[15px] font-bold text-cyan-300">
                {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="px-4 py-2 bg-amber-500/5">
              <p className="text-[11.5px] text-amber-400/80">
                ⚠️ Valores são estimativas preliminares e devem ser revisados conforme as regras vigentes da Lei de Incentivo ao Esporte.
              </p>
            </div>
          </div>

          {/* Botão enviar */}
          <div className="flex justify-end gap-3 pt-4 pb-8">
            <button
              onClick={() => gerarPDFProjeto(projeto)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-[15px] border border-white/10 text-slate-300 hover:bg-white/5 transition-all"
            >
              <FileDown size={18} />
              Exportar PDF
            </button>
            <button
              onClick={handleEnviar}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-[15px] transition-all"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                color: "white",
                boxShadow: "0 8px 30px -8px rgba(6,182,212,0.5)",
              }}
            >
              <Send size={18} />
              Enviar para análise técnica
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA: enviando ───────────────────────────────────────────────────────
  if (tela === "enviando")
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
        }}
      >
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-cyan-400/40 mx-auto flex items-center justify-center"
            style={{ animation: "spin 1.5s linear infinite" }}
          >
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
          </div>
          <p className="text-white font-semibold">Enviando projeto…</p>
        </div>
      </div>
    );

  // ─── TELA: enviado ────────────────────────────────────────────────────────
  if (tela === "enviado")
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
        }}
      >
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-emerald-400" size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Projeto enviado com sucesso!
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Seu projeto foi encaminhado para análise técnica preliminar por um
              especialista, que irá revisar e ajustar os pontos necessários
              antes da submissão oficial ao SLI.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-[13px] text-slate-300 text-left space-y-2">
            <p className="font-semibold text-white">Próximos passos:</p>
            <p>1. Um especialista irá revisar seu projeto</p>
            <p>2. Você receberá um retorno com sugestões de ajuste</p>
            <p>3. Após aprovação interna, o projeto segue para o SLI</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setTela("ideia");
                setIdeia("");
                setProjeto(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-[13px] hover:bg-white/5 transition-colors"
            >
              Novo projeto
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                color: "white",
              }}
            >
              Ir para o início <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );

  return null;
}
