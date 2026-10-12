interface Opcao {
  valor: string;
  rotulo: string;
}

interface Props {
  opcoes: readonly Opcao[];
  selecionados: string[];
  onChange: (proximos: string[]) => void;
}

// Seleção múltipla em "pílulas". Lista vazia = sem preferência (vale para todos).
export function SeletorChips({ opcoes, selecionados, onChange }: Props) {
  function alternar(valor: string) {
    onChange(selecionados.includes(valor) ? selecionados.filter((v) => v !== valor) : [...selecionados, valor]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const ativo = selecionados.includes(o.valor);
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => alternar(o.valor)}
            className={`px-3 py-1.5 rounded-full text-[12.5px] border transition-colors ${
              ativo
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
