import { ArrowUpDown, X } from "lucide-react";
import { MANIFESTACOES, ORDENACOES, PRAZOS_RAPIDOS, UFS } from "../constantes";
import type { AlterarFiltro, Filtros, Ordenacao } from "../types/projetoAutorizado";

interface Props {
  filtros: Filtros;
  onAlterar: AlterarFiltro;
  onLimpar: () => void;
  temFiltroAtivo: boolean;
}

const CAMPO =
  "w-full rounded-lg bg-[#0B1120] border border-white/10 text-white text-[13px] px-3 py-2 outline-none focus:border-cyan-500/50";
const ROTULO = "text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5";

export function PainelFiltros({ filtros, onAlterar, onLimpar, temFiltroAtivo }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={ROTULO}>Estado (UF)</label>
          <select value={filtros.uf} onChange={(e) => onAlterar("uf", e.target.value)} className={CAMPO}>
            <option value="">Todos</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={ROTULO}>Manifestação</label>
          <select
            value={filtros.manifestacao}
            onChange={(e) => onAlterar("manifestacao", e.target.value)}
            className={CAMPO}
          >
            <option value="">Todas</option>
            {MANIFESTACOES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={ROTULO}>Prazo para captar</label>
          <select
            value={filtros.prazoMaxDias === null ? "" : String(filtros.prazoMaxDias)}
            onChange={(e) => onAlterar("prazoMaxDias", e.target.value === "" ? null : Number(e.target.value))}
            className={CAMPO}
          >
            <option value="">Qualquer prazo</option>
            {PRAZOS_RAPIDOS.map((d) => (
              <option key={d} value={d}>
                Vence em até {d} dias
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={ROTULO}>Valor mínimo (R$)</label>
          <input
            type="number"
            min={0}
            value={filtros.valorMin}
            onChange={(e) => onAlterar("valorMin", e.target.value)}
            placeholder="0"
            className={CAMPO}
          />
        </div>

        <div>
          <label className={ROTULO}>Valor máximo (R$)</label>
          <input
            type="number"
            min={0}
            value={filtros.valorMax}
            onChange={(e) => onAlterar("valorMax", e.target.value)}
            placeholder="Sem limite"
            className={CAMPO}
          />
        </div>

        <div>
          <label className={ROTULO}>
            <ArrowUpDown size={11} className="inline mr-1" />
            Ordenar por
          </label>
          <select
            value={filtros.ordenacao}
            onChange={(e) => onAlterar("ordenacao", e.target.value as Ordenacao)}
            className={CAMPO}
          >
            {ORDENACOES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {temFiltroAtivo && (
        <button
          type="button"
          onClick={onLimpar}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-cyan-300 hover:text-cyan-200"
        >
          <X size={13} /> Limpar filtros
        </button>
      )}
    </div>
  );
}
