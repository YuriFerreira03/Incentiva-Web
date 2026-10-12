import type { StatusProjeto } from "../types/projetoAutorizado";
import { descreverPrazo } from "../utils/formatadores";
import type { UrgenciaPrazo } from "../utils/formatadores";

const BASE = "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap";

const STATUS_VISUAL: Record<StatusProjeto, { rotulo: string; classe: string }> = {
  autorizado: { rotulo: "Autorizado", classe: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25" },
  em_pauta: { rotulo: "Em pauta", classe: "text-violet-300 bg-violet-500/15 border-violet-500/25" },
};

const PRAZO_VISUAL: Record<UrgenciaPrazo, string> = {
  critico: "text-red-300 bg-red-500/15 border-red-500/25",
  atencao: "text-amber-300 bg-amber-500/15 border-amber-500/25",
  normal: "text-cyan-300 bg-cyan-500/15 border-cyan-500/25",
  desconhecido: "text-slate-400 bg-slate-500/15 border-slate-500/25",
};

export function SeloStatus({ status }: { status: StatusProjeto }) {
  const v = STATUS_VISUAL[status];
  return <span className={`${BASE} ${v.classe}`}>{v.rotulo}</span>;
}

export function SeloPrazo({ dias }: { dias: number | null }) {
  const { texto, urgencia } = descreverPrazo(dias);
  return <span className={`${BASE} ${PRAZO_VISUAL[urgencia]}`}>{texto}</span>;
}
