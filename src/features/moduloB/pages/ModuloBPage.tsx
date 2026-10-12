import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Info, RefreshCw, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { PainelFiltros } from "../components/PainelFiltros";
import { ProjetoCard } from "../components/ProjetoCard";
import { ProjetoDetalhe } from "../components/ProjetoDetalhe";
import { usePerfil } from "../../acesso/hooks/usePerfil";
import { useVitrine } from "../hooks/useVitrine";
import type { ProjetoAutorizado } from "../types/projetoAutorizado";
import { formatarData } from "../utils/formatadores";

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider">{rotulo}</div>
      <div className="text-white font-bold text-xl mt-1">{valor}</div>
    </div>
  );
}

export function ModuloBPage() {
  const v = useVitrine();
  const { empresa, preferencias } = usePerfil();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [aberto, setAberto] = useState<ProjetoAutorizado | null>(null);

  const fechar = useCallback(() => setAberto(null), []);

  const semResultado = !v.carregando && !v.erro && v.total === 0;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">Módulo B</span>
          <span className="text-slate-600">/</span>
          <span className="text-[13px] text-slate-400">Vitrine de Captação</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Projetos autorizados buscando patrocínio</h1>
        <p className="text-slate-400 text-sm mt-1">
          Projetos esportivos autorizados pelo Ministério do Esporte a captar recursos por incentivo fiscal e com prazo
          de captação em aberto.
        </p>
      </div>

      {/* Fonte dos dados */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 mb-6 flex items-start gap-2.5">
        <Info size={15} className="text-cyan-400 mt-0.5 shrink-0" />
        <p className="text-[12.5px] text-slate-300">
          Fonte: lista oficial &ldquo;Projetos aptos à captação&rdquo;, publicada pelo Ministério do Esporte
          {v.estatisticas?.ultimaPublicacao
            ? ` (última publicação: ${formatarData(v.estatisticas.ultimaPublicacao)})`
            : ""}
          . A lista traz o valor autorizado e o prazo, mas não o quanto já foi captado.
        </p>
      </div>

      {/* Empresa sem preferências: a vitrine funciona, mas o matching (em breve) precisa delas */}
      {empresa && !preferencias && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 mb-6 flex items-start gap-2.5">
          <Info size={15} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[12.5px] text-amber-200">
            Complete as preferências da sua empresa para o matching por IA, que chega em breve.{" "}
            <Link to="/perfil?tab=empresa" className="underline hover:text-amber-100">
              Completar agora
            </Link>
          </p>
        </div>
      )}

      {/* Indicadores */}
      {v.estatisticas && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Indicador rotulo="Projetos com prazo aberto" valor={v.estatisticas.totalVigentes.toLocaleString("pt-BR")} />
          <Indicador rotulo="Vencem em 60 dias" valor={v.estatisticas.vencendoEm60Dias.toLocaleString("pt-BR")} />
          <Indicador rotulo="Resultado da busca" valor={v.total.toLocaleString("pt-BR")} />
          <Indicador rotulo="Última publicação" valor={formatarData(v.estatisticas.ultimaPublicacao)} />
        </div>
      )}

      {/* Busca e filtros */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={v.filtros.busca}
              onChange={(e) => v.alterarFiltro("busca", e.target.value)}
              placeholder="Buscar por projeto, proponente, modalidade, cidade, processo ou CNPJ..."
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-[13.5px] pl-10 pr-4 py-2.5 outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setMostrarFiltros((x) => !x)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
              mostrarFiltros
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/8"
            }`}
          >
            <SlidersHorizontal size={14} /> Filtros
            {v.filtrosAtivos > 0 && (
              <span className="ml-1 px-1.5 rounded-full bg-cyan-500/30 text-[11px]">{v.filtrosAtivos}</span>
            )}
          </button>
          <button
            type="button"
            onClick={v.recarregar}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 border border-white/10 hover:bg-white/5 transition-all"
            title="Recarregar"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {mostrarFiltros && (
          <PainelFiltros
            filtros={v.filtros}
            onAlterar={v.alterarFiltro}
            onLimpar={v.limparFiltros}
            temFiltroAtivo={v.filtrosAtivos > 0}
          />
        )}
      </div>

      {/* Estados da lista */}
      {v.erro && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 mb-4">
          Erro ao carregar projetos: {v.erro}
        </div>
      )}

      {v.carregando && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {!v.carregando && semResultado && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <FileText className="text-slate-600" size={28} />
          </div>
          {v.filtrosAtivos > 0 ? (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum projeto com esses filtros</h3>
              <button
                type="button"
                onClick={v.limparFiltros}
                className="text-[13px] text-cyan-300 hover:text-cyan-200"
              >
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum projeto disponível agora</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                A lista de projetos ainda não foi carregada ou você não está logado. Volte em breve.
              </p>
            </>
          )}
        </div>
      )}

      {!v.carregando && v.projetos.length > 0 && (
        <>
          <p className="text-[12.5px] text-slate-500 mb-3">
            Exibindo {v.projetos.length.toLocaleString("pt-BR")} de {v.total.toLocaleString("pt-BR")} projetos
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {v.projetos.map((p) => (
              <ProjetoCard key={p.id} projeto={p} onAbrir={setAberto} />
            ))}
          </div>
          {v.temMais && (
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={() => void v.carregarMais()}
                disabled={v.carregandoMais}
                className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-50 transition-all"
              >
                {v.carregandoMais ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Próximas etapas */}
      <div className="mt-10 rounded-xl border border-white/8 bg-white/[0.02] p-5 flex items-start gap-3">
        <Sparkles size={16} className="text-cyan-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] text-slate-300 font-medium mb-1">Próximas etapas</p>
          <p className="text-[12.5px] text-slate-500">
            Resumo, metas e orçamento de cada projeto, preenchidos pelo próprio proponente, e contato direto pela
            plataforma. Depois, o matching por IA entre o perfil do incentivador e os projetos.
          </p>
        </div>
      </div>

      {aberto && <ProjetoDetalhe projeto={aberto} onFechar={fechar} />}
    </div>
  );
}
