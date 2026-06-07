import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";

interface Projeto {
  id: string;
  nome: string | null;
  manifestacao: string | null;
  status: string;
  confianca_geral: number | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  rascunho: {
    label: "Rascunho",
    icon: <Clock size={13} />,
    cor: "text-slate-400 bg-slate-500/15 border-slate-500/25",
  },
  em_revisao: {
    label: "Em análise",
    icon: <Sparkles size={13} />,
    cor: "text-cyan-300 bg-cyan-500/15 border-cyan-500/25",
  },
  aprovado: {
    label: "Aprovado",
    icon: <CheckCircle2 size={13} />,
    cor: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25",
  },
  rejeitado: {
    label: "Precisa de ajustes",
    icon: <XCircle size={13} />,
    cor: "text-amber-300 bg-amber-500/15 border-amber-500/25",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.rascunho;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${cfg.cor}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MeusProjetosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projetos")
      .select(
        "id, nome, manifestacao, status, confianca_geral, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setProjetos(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus projetos</h1>
          <p className="text-slate-400 text-sm mt-1">
            Acompanhe o status de cada projeto submetido.
          </p>
        </div>
        <button
          onClick={() => navigate("/modulo-a")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #06B6D4, #3B82F6)" }}
        >
          <Plus size={15} /> Novo projeto
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* Lista vazia */}
      {!loading && !erro && projetos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <FolderOpen className="text-slate-600" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum projeto ainda
          </h3>
          <p className="text-slate-500 text-sm max-w-xs mb-6">
            Use o Módulo A para estruturar seu primeiro projeto esportivo com a
            ajuda da IA.
          </p>
          <button
            onClick={() => navigate("/modulo-a")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #06B6D4, #3B82F6)" }}
          >
            <Sparkles size={15} /> Criar meu primeiro projeto
          </button>
        </div>
      )}

      {/* Lista de projetos */}
      {!loading && projetos.length > 0 && (
        <div className="space-y-3">
          {projetos.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-white/10 bg-white/3 hover:bg-white/6 transition-all p-5 flex items-center gap-4 group cursor-pointer"
              onClick={() => navigate(`/projeto/${p.id}`)}
            >
              {/* Ícone */}
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <FolderOpen size={20} className="text-slate-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14.5px] font-semibold text-white truncate">
                    {p.nome ?? "Projeto sem nome"}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[12px] text-slate-500">
                  {p.manifestacao && <span>{p.manifestacao}</span>}
                  {p.manifestacao && <span>·</span>}
                  <span>Atualizado em {formatDate(p.updated_at)}</span>
                  {p.confianca_geral !== null && (
                    <>
                      <span>·</span>
                      <span>Confiança IA: {p.confianca_geral}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Seta */}
              <ArrowRight
                size={16}
                className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0"
              />
            </div>
          ))}
        </div>
      )}

      {/* Legenda de status */}
      {!loading && projetos.length > 0 && (
        <div className="mt-8 rounded-xl border border-white/8 bg-white/3 p-4">
          <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider mb-3">
            Status possíveis
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(STATUS_CONFIG).map(([key]) => (
              <div
                key={key}
                className="flex items-center gap-2 text-[12px] text-slate-400"
              >
                <StatusBadge status={key} />
                <span>·</span>
                <span>
                  {key === "rascunho" && "Não enviado para análise ainda"}
                  {key === "em_revisao" && "Aguardando análise do especialista"}
                  {key === "aprovado" && "Aprovado para submissão ao SLI"}
                  {key === "rejeitado" && "Especialista solicitou ajustes"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
