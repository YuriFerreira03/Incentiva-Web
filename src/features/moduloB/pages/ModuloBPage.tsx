import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Building2,
  FileText,
  ExternalLink,
  Sparkles,
  Info,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { ProjetoCaptacao, StatusCaptacao, OrdenacaoVitrine } from "../types/moduloB";

// ─── Config visual de status ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<StatusCaptacao, { label: string; cor: string; bg: string }> = {
  recem_autorizado_aguardando_captacao: {
    label: "Aguardando captação",
    cor: "text-cyan-300",
    bg: "bg-cyan-500/15 border-cyan-500/25",
  },
  em_captacao: {
    label: "Em captação",
    cor: "text-amber-300",
    bg: "bg-amber-500/15 border-amber-500/25",
  },
  encerrado: {
    label: "Encerrado",
    cor: "text-slate-400",
    bg: "bg-slate-500/15 border-slate-500/25",
  },
};

function StatusBadge({ status }: { status: StatusCaptacao }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.recem_autorizado_aguardando_captacao;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.cor}`}>
      {cfg.label}
    </span>
  );
}

function formatarMoeda(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ─── Card de projeto ───────────────────────────────────────────────────────────
function ProjetoCard({ p }: { p: ProjetoCaptacao }) {
  const pct = Math.min(100, Math.max(0, p.percentual_captado ?? 0));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-[15px] leading-snug truncate">
            {p.projeto}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[12.5px] text-slate-400 truncate">
            <Building2 size={12} className="shrink-0" />
            {p.proponente}
          </div>
        </div>
        <StatusBadge status={p.status} />
      </div>

      {(p.modalidade || p.regiao) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.modalidade && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-slate-300">
              {p.modalidade}
            </span>
          )}
          {p.regiao && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-slate-300">
              {p.regiao}
            </span>
          )}
        </div>
      )}

      {p.resumo && (
        <p className="text-[12.5px] text-slate-400 mb-3 line-clamp-2">{p.resumo}</p>
      )}

      {/* Barra de progresso de captação */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11.5px] text-slate-500 mb-1">
          <span>Captado: {formatarMoeda(p.valor_captado)}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/8">
        <div>
          <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">Falta captar</div>
          <div className="text-white font-bold text-[16px]">
            {formatarMoeda(p.valor_faltante)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">Processo</div>
          <div className="text-[11.5px] text-slate-400 font-mono">{p.processo}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function ModuloBPage() {
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState<ProjetoCaptacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusCaptacao | "todos">("todos");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoVitrine>("valor_faltante_desc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    carregarProjetos();
  }, []);

  async function carregarProjetos() {
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase
      .from("projetos_captacao")
      .select("*")
      .eq("disponivel_para_match", true)
      .neq("status", "encerrado")
      .order("valor_faltante", { ascending: false });

    if (error) {
      setErro(error.message);
    } else {
      setProjetos(data ?? []);
    }
    setCarregando(false);
  }

  const projetosFiltrados = useMemo(() => {
    let lista = [...projetos];

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(
        (p) =>
          p.projeto.toLowerCase().includes(termo) ||
          p.proponente.toLowerCase().includes(termo) ||
          (p.modalidade ?? "").toLowerCase().includes(termo)
      );
    }

    if (filtroStatus !== "todos") {
      lista = lista.filter((p) => p.status === filtroStatus);
    }

    const min = parseFloat(valorMin);
    const max = parseFloat(valorMax);
    if (!isNaN(min)) lista = lista.filter((p) => (p.valor_faltante ?? 0) >= min);
    if (!isNaN(max)) lista = lista.filter((p) => (p.valor_faltante ?? 0) <= max);

    switch (ordenacao) {
      case "valor_faltante_desc":
        lista.sort((a, b) => (b.valor_faltante ?? 0) - (a.valor_faltante ?? 0));
        break;
      case "valor_faltante_asc":
        lista.sort((a, b) => (a.valor_faltante ?? 0) - (b.valor_faltante ?? 0));
        break;
      case "mais_recente":
        lista.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
        break;
    }

    return lista;
  }, [projetos, busca, filtroStatus, valorMin, valorMax, ordenacao]);

  const totalDisponivel = projetos.reduce((s, p) => s + (p.valor_faltante ?? 0), 0);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
            Módulo B
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-[13px] text-slate-400">Vitrine de Captação</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Projetos aprovados aguardando patrocínio</h1>
        <p className="text-slate-400 text-sm mt-1">
          Projetos reais, aprovados pelo Ministério do Esporte (Lei nº 11.438/2006), autorizados a
          captar recursos e ainda precisando de patrocinadores.
        </p>
      </div>

      {/* Aviso de transparência sobre a fonte dos dados */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 mb-6 flex items-start gap-2.5">
        <Info size={15} className="text-cyan-400 mt-0.5 shrink-0" />
        <p className="text-[12.5px] text-slate-300">
          Dados extraídos das pautas públicas da Comissão Técnica da Lei de Incentivo ao Esporte
          (Ministério do Esporte). O matching por IA com base no perfil do incentivador está em
          desenvolvimento — por enquanto, navegue e filtre livremente.
        </p>
      </div>

      {/* Estatística rápida */}
      {!carregando && projetos.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Projetos disponíveis</div>
            <div className="text-white font-bold text-xl mt-1">{projetos.length}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Total a captar</div>
            <div className="text-white font-bold text-xl mt-1">{formatarMoeda(totalDisponivel)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Exibindo</div>
            <div className="text-white font-bold text-xl mt-1">{projetosFiltrados.length}</div>
          </div>
        </div>
      )}

      {/* Busca + filtros */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por projeto, proponente ou modalidade..."
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-[13.5px] pl-10 pr-4 py-2.5 outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <button
            onClick={() => setMostrarFiltros((v) => !v)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
              mostrarFiltros
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/8"
            }`}
          >
            <SlidersHorizontal size={14} /> Filtros
          </button>
          <button
            onClick={carregarProjetos}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 border border-white/10 hover:bg-white/5 transition-all"
            title="Recarregar"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {mostrarFiltros && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as StatusCaptacao | "todos")}
                className="w-full rounded-lg bg-[#0B1120] border border-white/10 text-white text-[13px] px-3 py-2 outline-none focus:border-cyan-500/50"
              >
                <option value="todos">Todos</option>
                <option value="recem_autorizado_aguardando_captacao">Aguardando captação</option>
                <option value="em_captacao">Em captação</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                Valor mínimo (R$)
              </label>
              <input
                type="number"
                value={valorMin}
                onChange={(e) => setValorMin(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-[13px] px-3 py-2 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                Valor máximo (R$)
              </label>
              <input
                type="number"
                value={valorMax}
                onChange={(e) => setValorMax(e.target.value)}
                placeholder="Sem limite"
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-[13px] px-3 py-2 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                <ArrowUpDown size={11} className="inline mr-1" />
                Ordenar por
              </label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as OrdenacaoVitrine)}
                className="w-full rounded-lg bg-[#0B1120] border border-white/10 text-white text-[13px] px-3 py-2 outline-none focus:border-cyan-500/50"
              >
                <option value="valor_faltante_desc">Maior valor faltante</option>
                <option value="valor_faltante_asc">Menor valor faltante</option>
                <option value="mais_recente">Mais recente</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Estados de carregamento / erro / vazio */}
      {carregando && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {!carregando && erro && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          Erro ao carregar projetos: {erro}
        </div>
      )}

      {!carregando && !erro && projetos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <FileText className="text-slate-600" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum projeto disponível ainda</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            A base de projetos públicos ainda está sendo populada. Volte em breve.
          </p>
        </div>
      )}

      {!carregando && !erro && projetos.length > 0 && projetosFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-slate-400 text-sm">Nenhum projeto encontrado com esses filtros.</p>
        </div>
      )}

      {!carregando && projetosFiltrados.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projetosFiltrados.map((p) => (
            <ProjetoCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* Rodapé explicando a próxima etapa (honestidade sobre o roadmap) */}
      <div className="mt-10 rounded-xl border border-white/8 bg-white/[0.02] p-5 flex items-start gap-3">
        <Sparkles size={16} className="text-cyan-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] text-slate-300 font-medium mb-1">Próxima etapa: matching por IA</p>
          <p className="text-[12.5px] text-slate-500">
            Em breve, ao completar seu perfil de incentivador, a IA vai calcular um score de
            aderência entre sua estratégia de investimento social e os projetos disponíveis aqui —
            com explicação de por que cada recomendação faz sentido.
          </p>
        </div>
      </div>
    </div>
  );
}
