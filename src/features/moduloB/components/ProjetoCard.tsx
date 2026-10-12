import { Building2, MapPin } from "lucide-react";
import type { ProjetoAutorizado } from "../types/projetoAutorizado";
import { formatarData, formatarMoeda, montarLocal } from "../utils/formatadores";
import { BarraCaptacao } from "./BarraCaptacao";
import { SeloPrazo, SeloStatus } from "./Selos";

interface Props {
  projeto: ProjetoAutorizado;
  onAbrir: (projeto: ProjetoAutorizado) => void;
}

const ETIQUETA = "text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-slate-300";

export function ProjetoCard({ projeto: p, onAbrir }: Props) {
  const local = montarLocal(p.cidade, p.uf);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrir(p)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir(p);
        }
      }}
      className="flex flex-col rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors p-5 cursor-pointer outline-none focus-visible:border-cyan-500/60"
    >
      <div className="flex flex-wrap gap-1.5 mb-3">
        <SeloStatus status={p.status ?? "autorizado"} />
        <SeloPrazo dias={p.dias_para_vencer} />
      </div>

      <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2">{p.projeto}</h3>
      <div className="flex items-center gap-1.5 mt-1 text-[12.5px] text-slate-400">
        <Building2 size={12} className="shrink-0" />
        <span className="truncate">{p.proponente}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {p.manifestacao && <span className={ETIQUETA}>{p.manifestacao}</span>}
        {p.modalidade && <span className={`${ETIQUETA} max-w-full truncate`}>{p.modalidade}</span>}
        {local && (
          <span className={`${ETIQUETA} inline-flex items-center gap-1`}>
            <MapPin size={10} /> {local}
          </span>
        )}
      </div>

      {p.resumo && <p className="text-[12.5px] text-slate-400 mt-3 line-clamp-2">{p.resumo}</p>}

      <div className="mt-3">
        <BarraCaptacao captado={p.valor_captado} percentual={p.percentual_captado} />
      </div>

      <div className="flex items-end justify-between gap-3 mt-auto pt-4 border-t border-white/8">
        <div>
          <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">Valor autorizado</div>
          <div className="text-white font-bold text-[16px]">{formatarMoeda(p.valor_autorizado)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">Captar até</div>
          <div className="text-[12.5px] text-slate-300">{formatarData(p.prazo_captacao)}</div>
        </div>
      </div>
    </div>
  );
}
