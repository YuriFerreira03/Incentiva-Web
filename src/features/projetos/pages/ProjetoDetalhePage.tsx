import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  X,
  Save,
  FileDown,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
import { gerarPDFProjeto } from "../../moduloA/services/pdfGerador";
import type { ProjetoGerado, Meta, ItemOrcamento } from "../../moduloA/types/moduloA";

// ─── Status (mesmo padrão visual do MeusProjetosPage) ────────────────────────
const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", icon: <Clock size={13} />, cor: "text-slate-400 bg-slate-500/15 border-slate-500/25" },
  em_revisao: { label: "Em análise", icon: <Sparkles size={13} />, cor: "text-cyan-300 bg-cyan-500/15 border-cyan-500/25" },
  aprovado: { label: "Aprovado", icon: <CheckCircle2 size={13} />, cor: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25" },
  rejeitado: { label: "Precisa de ajustes", icon: <XCircle size={13} />, cor: "text-amber-300 bg-amber-500/15 border-amber-500/25" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.rascunho;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${cfg.cor}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

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

// ─── Formato bruto da linha do Supabase (snake_case) ─────────────────────────
interface ProjetoRow {
  id: string;
  user_id: string;
  status: string;
  nome: string | null;
  manifestacao: string | null;
  objeto: string | null;
  objetivo_geral: string | null;
  objetivos_especificos: string | null;
  justificativa: string | null;
  metodologia: string | null;
  publico_beneficiario: string | null;
  quantidade_beneficiarios: number | null;
  faixa_etaria: string | null;
  criterios_selecao: string | null;
  adequacao_manifestacao: string | null;
  locais_execucao: string | null;
  cronograma: string | null;
  resultados_esperados: string | null;
  acessibilidade: string | null;
  metas_qualitativas: Meta[] | null;
  metas_quantitativas: Meta[] | null;
  orcamento: ItemOrcamento[] | null;
  confianca_geral: number | null;
  avisos: string[] | null;
  perguntas_adicionais: string[] | null;
  created_at: string;
  updated_at: string;
}

// ─── Converte a linha do banco (snake_case) no formato usado pela UI ─────────
// Campos que só existem durante a geração por IA (confiancaCampos por seção,
// sugestões, etc.) não são persistidos — entram como valores neutros aqui.
function mapRowParaProjeto(row: ProjetoRow): ProjetoGerado {
  return {
    nome: row.nome ?? "",
    manifestacao: (row.manifestacao as ProjetoGerado["manifestacao"]) ?? "",
    adequacaoManifestacao: row.adequacao_manifestacao ?? "",
    objeto: row.objeto ?? "",
    objetivoGeral: row.objetivo_geral ?? "",
    objetivosEspecificos: row.objetivos_especificos ?? "",
    justificativa: row.justificativa ?? "",
    metodologia: row.metodologia ?? "",
    publicoBeneficiario: row.publico_beneficiario ?? "",
    quantidadeBeneficiarios: row.quantidade_beneficiarios ?? 0,
    faixaEtaria: row.faixa_etaria ?? "",
    criteriosSelecao: row.criterios_selecao ?? "",
    atendePCD: false,
    locaisExecucao: row.locais_execucao ?? "",
    cronograma: row.cronograma ?? "",
    resultadosEsperados: row.resultados_esperados ?? "",
    acessibilidade: row.acessibilidade ?? "",
    metasQualitativas: row.metas_qualitativas ?? [],
    metasQuantitativas: row.metas_quantitativas ?? [],
    orcamento: row.orcamento ?? [],
    confiancaGeral: row.confianca_geral ?? 0,
    confiancaCampos: {},
    avisos: row.avisos ?? [],
    perguntasAdicionais: row.perguntas_adicionais ?? [],
    pedirMaisContexto: false,
    sugestoesMelhoria: [],
    sugestoesNome: [],
  };
}

// ─── Converte de volta para o formato de colunas do Supabase (update) ────────
function montarPayloadUpdate(p: ProjetoGerado) {
  return {
    nome: p.nome,
    manifestacao: p.manifestacao,
    objeto: p.objeto,
    objetivo_geral: p.objetivoGeral,
    objetivos_especificos: p.objetivosEspecificos,
    justificativa: p.justificativa,
    metodologia: p.metodologia,
    publico_beneficiario: p.publicoBeneficiario,
    quantidade_beneficiarios: p.quantidadeBeneficiarios,
    faixa_etaria: p.faixaEtaria,
    criterios_selecao: p.criteriosSelecao,
    adequacao_manifestacao: p.adequacaoManifestacao,
    locais_execucao: p.locaisExecucao,
    cronograma: p.cronograma,
    resultados_esperados: p.resultadosEsperados,
    acessibilidade: p.acessibilidade,
    metas_qualitativas: p.metasQualitativas,
    metas_quantitativas: p.metasQuantitativas,
    orcamento: p.orcamento,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
export function ProjetoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [projeto, setProjeto] = useState<ProjetoGerado | null>(null);
  const [status, setStatus] = useState<string>("rascunho");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    setCarregando(true);
    setErro(null);
    supabase
      .from("projetos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setErro("Projeto não encontrado ou você não tem acesso a ele.");
        } else {
          setProjeto(mapRowParaProjeto(data as ProjetoRow));
          setStatus((data as ProjetoRow).status);
        }
        setCarregando(false);
      });
  }, [id, user]);

  function handleSave(campo: string, valor: string) {
    setProjeto((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setSalvo(false);
  }

  function handleSaveNumero(campo: string, valor: number) {
    setProjeto((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setSalvo(false);
  }

  function handleSaveMeta(tipo: "metasQualitativas" | "metasQuantitativas", index: number, campo: keyof Meta, valor: string) {
    setProjeto((prev) => {
      if (!prev) return prev;
      const lista = [...prev[tipo]];
      lista[index] = { ...lista[index], [campo]: valor };
      setSalvo(false);
      return { ...prev, [tipo]: lista };
    });
  }

  function handleAddMeta(tipo: "metasQualitativas" | "metasQuantitativas") {
    setProjeto((prev) => {
      if (!prev) return prev;
      const nova: Meta = { descricao: "", indicador: "", verificador: "", prazo: "" };
      return { ...prev, [tipo]: [...prev[tipo], nova] };
    });
  }

  function handleRemoveMeta(tipo: "metasQualitativas" | "metasQuantitativas", index: number) {
    setProjeto((prev) => {
      if (!prev) return prev;
      setSalvo(false);
      return { ...prev, [tipo]: prev[tipo].filter((_, i) => i !== index) };
    });
  }

  function handleSaveOrcamentoItem(index: number, campo: keyof ItemOrcamento, valor: string | number) {
    setProjeto((prev) => {
      if (!prev) return prev;
      const lista = [...prev.orcamento];
      const item = { ...lista[index], [campo]: valor } as ItemOrcamento;
      if (campo === "quantidade" || campo === "valorUnitario") {
        item.valorTotal = Number(item.quantidade) * Number(item.valorUnitario);
      }
      lista[index] = item;
      setSalvo(false);
      return { ...prev, orcamento: lista };
    });
  }

  function handleAddOrcamentoItem(bloco: ItemOrcamento["bloco"]) {
    setProjeto((prev) => {
      if (!prev) return prev;
      const novo: ItemOrcamento = { bloco, categoria: "", item: "", especificacao: "", quantidade: 1, unidade: "Unidade", valorUnitario: 0, valorTotal: 0 };
      return { ...prev, orcamento: [...prev.orcamento, novo] };
    });
  }

  function handleRemoveOrcamentoItem(index: number) {
    setProjeto((prev) => {
      if (!prev) return prev;
      setSalvo(false);
      return { ...prev, orcamento: prev.orcamento.filter((_, i) => i !== index) };
    });
  }

  async function handleSalvar() {
    if (!projeto || !id) return;
    setSalvando(true);
    setErro(null);
    try {
      const { error } = await supabase
        .from("projetos")
        .update(montarPayloadUpdate(projeto))
        .eq("id", id);
      if (error) throw error;
      setSalvo(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  const total = (projeto?.orcamento ?? []).reduce((s, it) => s + it.valorTotal, 0);

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (erro && !projeto) {
    return (
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 text-center">
        <AlertTriangle className="text-red-400 mx-auto mb-4" size={32} />
        <p className="text-white font-semibold mb-2">Não foi possível abrir este projeto</p>
        <p className="text-slate-400 text-sm mb-6">{erro}</p>
        <button
          onClick={() => navigate("/meus-projetos")}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #06B6D4, #3B82F6)" }}
        >
          Voltar para Meus Projetos
        </button>
      </div>
    );
  }

  if (!projeto) return null;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
      {/* Cabeçalho */}
      <div className="sticky top-0 z-10 bg-[#070B14]/90 backdrop-blur -mx-6 px-6 py-3 mb-6 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/meus-projetos")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-[13px] shrink-0"
          >
            <ArrowLeft size={15} /> Voltar
          </button>
          <span className="text-slate-700 shrink-0">|</span>
          <span className="text-[13px] text-slate-300 font-medium truncate">{projeto.nome}</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => gerarPDFProjeto(projeto)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[12px] text-slate-300 hover:bg-white/5 transition-colors"
          >
            <FileDown size={13} /> PDF
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #06B6D4, #3B82F6)", color: "white" }}
          >
            {salvando ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </>
            ) : salvo ? (
              <>
                <Check size={14} /> Salvo
              </>
            ) : (
              <>
                <Save size={14} /> Salvar alterações
              </>
            )}
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center gap-2 mb-5">
          <AlertTriangle size={15} /> {erro}
        </div>
      )}

      <div className="space-y-5">
        {/* Nome e Manifestação */}
        <div className="grid sm:grid-cols-2 gap-4">
          <CampoEditavelTexto label="Nome do Projeto" valor={projeto.nome} onSave={(v) => handleSave("nome", v)} />
          <CampoEditavelSelect
            label="Manifestação Esportiva"
            valor={projeto.manifestacao}
            opcoes={["Formação Esportiva", "Esporte para Toda a Vida", "Excelência Esportiva"]}
            onSave={(v) => handleSave("manifestacao", v)}
          />
        </div>

        <SecaoRevisao titulo="Objeto do Projeto" campo="objeto" valor={projeto.objeto} onSave={handleSave} />
        <SecaoRevisao titulo="Objetivo Geral" campo="objetivoGeral" valor={projeto.objetivoGeral} onSave={handleSave} />
        <SecaoRevisao titulo="Objetivos Específicos" campo="objetivosEspecificos" valor={projeto.objetivosEspecificos} onSave={handleSave} />
        <SecaoRevisao titulo="Justificativa" campo="justificativa" valor={projeto.justificativa} onSave={handleSave} />
        <SecaoRevisao titulo="Metodologia" campo="metodologia" valor={projeto.metodologia} onSave={handleSave} />

        {/* Público */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid sm:grid-cols-3 gap-4">
          <div>
            <CampoEditavelTexto label="Público Beneficiário" valor={projeto.publicoBeneficiario} onSave={(v) => handleSave("publicoBeneficiario", v)} />
          </div>
          <CampoEditavelNumero label="Quantidade" valor={projeto.quantidadeBeneficiarios} onSave={(v) => handleSaveNumero("quantidadeBeneficiarios", v)} />
          <div>
            <CampoEditavelTexto label="Faixa Etária" valor={projeto.faixaEtaria} onSave={(v) => handleSave("faixaEtaria", v)} />
          </div>
        </div>

        {projeto.adequacaoManifestacao && (
          <SecaoRevisao titulo="Adequação à Manifestação Esportiva" campo="adequacaoManifestacao" valor={projeto.adequacaoManifestacao} onSave={handleSave} />
        )}
        <SecaoRevisao titulo="Critérios de Seleção dos Beneficiários" campo="criteriosSelecao" valor={projeto.criteriosSelecao} onSave={handleSave} />
        {projeto.acessibilidade && (
          <SecaoRevisao titulo="Acessibilidade" campo="acessibilidade" valor={projeto.acessibilidade} onSave={handleSave} />
        )}
        <SecaoRevisao titulo="Locais de Execução" campo="locaisExecucao" valor={projeto.locaisExecucao} onSave={handleSave} />
        <SecaoRevisao titulo="Cronograma Resumido" campo="cronograma" valor={projeto.cronograma} onSave={handleSave} />
        <SecaoRevisao titulo="Resultados Esperados" campo="resultadosEsperados" valor={projeto.resultadosEsperados} onSave={handleSave} />

        {/* Metas Qualitativas */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-[13.5px] font-semibold text-white">Metas Qualitativas</span>
          </div>
          <div className="p-4 space-y-3">
            {projeto.metasQualitativas.map((m, i) => (
              <MetaCard key={i} meta={m} onSave={(campo, valor) => handleSaveMeta("metasQualitativas", i, campo, valor)} onRemove={() => handleRemoveMeta("metasQualitativas", i)} />
            ))}
            <button type="button" onClick={() => handleAddMeta("metasQualitativas")} className="flex items-center gap-1.5 text-[12px] text-cyan-400 hover:text-cyan-300">
              <Plus size={13} /> Adicionar meta qualitativa
            </button>
          </div>
        </div>

        {/* Metas Quantitativas */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-[13.5px] font-semibold text-white">Metas Quantitativas</span>
          </div>
          <div className="p-4 space-y-3">
            {projeto.metasQuantitativas.map((m, i) => (
              <MetaCard key={i} meta={m} onSave={(campo, valor) => handleSaveMeta("metasQuantitativas", i, campo, valor)} onRemove={() => handleRemoveMeta("metasQuantitativas", i)} />
            ))}
            <button type="button" onClick={() => handleAddMeta("metasQuantitativas")} className="flex items-center gap-1.5 text-[12px] text-cyan-400 hover:text-cyan-300">
              <Plus size={13} /> Adicionar meta quantitativa
            </button>
          </div>
        </div>

        {/* Orçamento */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-[13.5px] font-semibold text-white">Orçamento Estimado</span>
          </div>
          {(["Atividade Fim", "Atividade Meio", "Elaboração e Captação de Recursos"] as const).map((bloco) => {
            const itensComIndice = projeto.orcamento.map((it, idxOriginal) => ({ it, idxOriginal })).filter(({ it }) => it.bloco === bloco);
            const subtotal = itensComIndice.reduce((s, { it }) => s + it.valorTotal, 0);
            const pctDoTotal = total > 0 ? (subtotal / total) * 100 : 0;
            return (
              <div key={bloco} className="border-t border-white/10 first:border-t-0">
                <div className="px-4 py-2 bg-white/[0.03] flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-cyan-300">{bloco}</span>
                  <span className="text-[11px] text-slate-500">
                    {subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} · {pctDoTotal.toFixed(1)}% do total
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {itensComIndice.map(({ it, idxOriginal }) => (
                    <ItemOrcamentoCard key={idxOriginal} item={it} onSave={(campo, valor) => handleSaveOrcamentoItem(idxOriginal, campo, valor)} onRemove={() => handleRemoveOrcamentoItem(idxOriginal)} />
                  ))}
                </div>
                <div className="px-4 py-2">
                  <button type="button" onClick={() => handleAddOrcamentoItem(bloco)} className="flex items-center gap-1.5 text-[12px] text-cyan-400 hover:text-cyan-300">
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
        </div>

        {projeto.avisos.length > 0 && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="text-[12px] font-semibold text-amber-300 mb-1.5">Avisos da geração original</p>
            <ul className="space-y-1">
              {projeto.avisos.map((a, i) => (
                <li key={i} className="text-[12px] text-slate-400">• {a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pb-8">
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-[15px] transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #06B6D4, #3B82F6)", color: "white", boxShadow: "0 8px 30px -8px rgba(6,182,212,0.5)" }}
          >
            {salvando ? "Salvando..." : salvo ? "Alterações salvas" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
