import { formatarMoeda } from "../utils/formatadores";

interface Props {
  captado: number | null | undefined;
  percentual: number | null | undefined;
}

// Só aparece quando o projeto tem dado de captação (vem da pauta da Comissão, numa etapa futura).
export function BarraCaptacao({ captado, percentual }: Props) {
  if (percentual === null || percentual === undefined) return null;
  const pct = Math.min(100, Math.max(0, percentual));
  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px] text-slate-500 mb-1">
        <span>Captado: {formatarMoeda(captado)}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
