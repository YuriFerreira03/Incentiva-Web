import type { FatorMatching, StatusFator } from "../types/projetoAutorizado";

export const ROTULO_FATOR: Record<string, string> = {
  modalidade: "Modalidade",
  estado: "Estado",
  valor: "Valor",
  manifestacao: "Manifestação",
  temas: "Temas",
  prazo: "Prazo",
};

const STATUS_VISUAL: Record<Exclude<StatusFator, "sem_preferencia">, { simbolo: string; classe: string; texto: string }> = {
  combina: { simbolo: "✓", classe: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25", texto: "Combina" },
  parcial: { simbolo: "~", classe: "text-amber-300 bg-amber-500/10 border-amber-500/25", texto: "Parcial" },
  nao_combina: { simbolo: "✕", classe: "text-red-300 bg-red-500/10 border-red-500/25", texto: "Não combina" },
  desconhecido: { simbolo: "?", classe: "text-slate-300 bg-slate-500/10 border-slate-500/25", texto: "Sem informação" },
};

export function faixaDaNota(nota: number): { rotulo: string; classe: string } {
  if (nota >= 80) return { rotulo: "Alta aderência", classe: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10" };
  if (nota >= 60) return { rotulo: "Boa aderência", classe: "text-cyan-300 border-cyan-400/40 bg-cyan-500/10" };
  if (nota >= 40) return { rotulo: "Aderência moderada", classe: "text-amber-300 border-amber-400/40 bg-amber-500/10" };
  return { rotulo: "Baixa aderência", classe: "text-slate-300 border-slate-400/30 bg-slate-500/10" };
}

export function NotaBadge({ nota }: { nota: number }) {
  const f = faixaDaNota(nota);
  return (
    <div className={`shrink-0 rounded-xl border px-2.5 py-1 text-center leading-tight ${f.classe}`} title={f.rotulo}>
      <div className="text-[17px] font-bold">{nota}</div>
      <div className="text-[9.5px] uppercase tracking-wider opacity-80">de 100</div>
    </div>
  );
}

// Fatores que a empresa preencheu, em formato compacto (cartão da lista).
export function FatoresChips({ fatores }: { fatores: FatorMatching[] }) {
  const aplicaveis = fatores.filter((f) => f.status !== "sem_preferencia");
  return (
    <div className="flex flex-wrap gap-1.5">
      {aplicaveis.map((f) => {
        const v = STATUS_VISUAL[f.status as keyof typeof STATUS_VISUAL];
        return (
          <span
            key={f.fator}
            title={f.detalhe ?? undefined}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${v.classe}`}
          >
            <span aria-hidden>{v.simbolo}</span>
            {ROTULO_FATOR[f.fator] ?? f.fator}
          </span>
        );
      })}
    </div>
  );
}

// Detalhe completo (janela do projeto).
export function FatoresTabela({ fatores }: { fatores: FatorMatching[] }) {
  return (
    <ul className="divide-y divide-white/8 rounded-xl border border-white/10 bg-white/5">
      {fatores.map((f) => {
        const v = f.status === "sem_preferencia" ? null : STATUS_VISUAL[f.status];
        return (
          <li key={f.fator} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="text-[12.5px] text-slate-200 font-medium">
                {ROTULO_FATOR[f.fator] ?? f.fator} <span className="text-slate-500 font-normal">· peso {f.peso}</span>
              </div>
              <div className="text-[12px] text-slate-400 break-words">
                {v ? (f.detalhe ?? "—") : "Você não definiu preferência para este item"}
              </div>
            </div>
            {v ? (
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] border ${v.classe}`}>
                {v.simbolo} {v.texto}
                {f.pontos !== null && f.status === "parcial" ? ` (${f.pontos})` : ""}
              </span>
            ) : (
              <span className="shrink-0 text-[11px] text-slate-600">fora da conta</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ExplicacaoIA({ texto, carregando }: { texto?: string | null; carregando?: boolean }) {
  if (texto) {
    return (
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3.5 py-3">
        <p className="text-[13px] text-slate-200 leading-relaxed">{texto}</p>
        <p className="text-[10.5px] text-slate-500 mt-1.5">Explicação gerada por IA a partir dos dados acima.</p>
      </div>
    );
  }
  if (carregando) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 animate-pulse" aria-live="polite">
        <div className="h-2.5 w-3/4 rounded bg-white/10" />
        <div className="h-2.5 w-1/2 rounded bg-white/10 mt-2" />
        <p className="text-[10.5px] text-slate-500 mt-2">Gerando explicação…</p>
      </div>
    );
  }
  return null;
}
