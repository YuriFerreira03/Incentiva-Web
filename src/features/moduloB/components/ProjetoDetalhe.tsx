import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Building2, X } from "lucide-react";
import type { ProjetoAutorizado } from "../types/projetoAutorizado";
import { formatarData, formatarMoeda, montarLocal } from "../utils/formatadores";
import { BarraCaptacao } from "./BarraCaptacao";
import { ExplicacaoIA, FatoresTabela, NotaBadge, faixaDaNota } from "./MatchingResumo";
import { SeloPrazo, SeloStatus } from "./Selos";

interface Props {
  projeto: ProjetoAutorizado;
  onFechar: () => void;
  // Espaço para ações futuras (ex.: botão "Tenho interesse"). Hoje a página não passa nada.
  acoes?: ReactNode;
  /** true enquanto a IA ainda escreve a explicação (só no modo "Mais combinam") */
  gerandoExplicacao?: boolean;
}

function Fato({ rotulo, valor, mono = false }: { rotulo: string; valor: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">{rotulo}</div>
      <div className={`text-[13px] text-slate-200 mt-0.5 break-words ${mono ? "font-mono" : ""}`}>
        {valor && valor.trim() ? valor : "—"}
      </div>
    </div>
  );
}

export function ProjetoDetalhe({ projeto: p, onFechar, acoes, gerandoExplicacao }: Props) {
  const botaoFechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botaoFechar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onFechar]);

  const local = montarLocal(p.cidade, p.uf);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-6"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhe"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0B1120] p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            <SeloStatus status={p.status ?? "autorizado"} />
            <SeloPrazo dias={p.dias_para_vencer} />
          </div>
          <button
            ref={botaoFechar}
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            <X size={18} />
          </button>
        </div>

        <h2 id="titulo-detalhe" className="text-white font-bold text-xl leading-snug mt-3">
          {p.projeto}
        </h2>
        <div className="flex items-center gap-1.5 mt-1 text-[13px] text-slate-400">
          <Building2 size={13} className="shrink-0" />
          {p.proponente}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <Fato rotulo="Valor autorizado" valor={formatarMoeda(p.valor_autorizado)} />
          <Fato rotulo="Captar até" valor={formatarData(p.prazo_captacao)} />
          <Fato rotulo="Manifestação" valor={p.manifestacao} />
          <Fato rotulo="Modalidade" valor={p.modalidade} />
          <Fato rotulo="Local" valor={local} />
          <Fato rotulo="Publicado em" valor={formatarData(p.data_publicacao)} />
        </div>

        <div className="mt-4">
          <BarraCaptacao captado={p.valor_captado} percentual={p.percentual_captado} />
        </div>

        {p.fatores && p.nota !== undefined && (
          <section className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider">
                Por que combina com a sua empresa
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-400">{faixaDaNota(p.nota).rotulo}</span>
                <NotaBadge nota={p.nota} />
              </div>
            </div>
            <ExplicacaoIA texto={p.explicacao} carregando={gerandoExplicacao} />
            <FatoresTabela fatores={p.fatores} />
            <p className="text-[11px] text-slate-600">
              A nota de 0 a 100 é calculada por regras fixas, com os pesos indicados, só sobre o que a sua empresa
              preencheu. Modalidade e temas podem ser estimados pelo nome do projeto quando a planilha não informa.
            </p>
          </section>
        )}

        <section className="mt-6">
          <h3 className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Sobre o projeto</h3>
          {p.resumo ? (
            <p className="text-[13.5px] text-slate-300 leading-relaxed whitespace-pre-line">{p.resumo}</p>
          ) : (
            <p className="text-[13px] text-slate-500 leading-relaxed">
              O resumo, as metas e o orçamento detalhado ainda não estão disponíveis para este projeto. Eles aparecem
              aqui quando o proponente completa o perfil no INCENTIVA. Os dados acima vêm da lista oficial do
              Ministério do Esporte.
            </p>
          )}
        </section>

        <section className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-4">
          <Fato rotulo="Processo" valor={p.processo} mono />
          <Fato rotulo="SLI" valor={p.sli} mono />
          <Fato rotulo="CNPJ do proponente" valor={p.cnpj} mono />
        </section>

        <p className="text-[11.5px] text-slate-600 mt-4">
          O valor autorizado é o limite que o projeto pode captar. Não indica quanto já foi captado.
        </p>

        {acoes && <div className="mt-5 pt-4 border-t border-white/10">{acoes}</div>}
      </div>
    </div>
  );
}
