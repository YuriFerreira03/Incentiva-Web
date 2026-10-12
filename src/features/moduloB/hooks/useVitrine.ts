// Estado da vitrine: filtros, paginação e carregamento. A tela só consome este hook.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buscarEstatisticas, buscarProjetos } from "../services/vitrineService";
import type {
  AlterarFiltro,
  EstatisticasVitrine,
  Filtros,
  ProjetoAutorizado,
} from "../types/projetoAutorizado";

export const FILTROS_INICIAIS: Filtros = {
  busca: "",
  uf: "",
  manifestacao: "",
  valorMin: "",
  valorMax: "",
  prazoMaxDias: null,
  ordenacao: "recentes",
};

function useAtraso<T>(valor: T, ms: number): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atrasado;
}

function mensagemDeErro(e: unknown): string {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useVitrine() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const buscaAtrasada = useAtraso(filtros.busca, 350);
  const filtrosEfetivos = useMemo<Filtros>(
    () => ({ ...filtros, busca: buscaAtrasada }),
    [filtros, buscaAtrasada],
  );

  const [projetos, setProjetos] = useState<ProjetoAutorizado[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasVitrine | null>(null);

  const pagina = useRef(0);
  const requisicao = useRef(0); // descarta respostas antigas quando o filtro muda rápido

  const carregarPrimeiraPagina = useCallback(async () => {
    const id = ++requisicao.current;
    setCarregando(true);
    setCarregandoMais(false);
    setErro(null);
    try {
      const r = await buscarProjetos(filtrosEfetivos, 0);
      if (id !== requisicao.current) return;
      pagina.current = 0;
      setProjetos(r.projetos);
      setTotal(r.total);
    } catch (e) {
      if (id !== requisicao.current) return;
      setProjetos([]);
      setTotal(0);
      setErro(mensagemDeErro(e));
    } finally {
      if (id === requisicao.current) setCarregando(false);
    }
  }, [filtrosEfetivos]);

  const carregarMais = useCallback(async () => {
    const id = ++requisicao.current;
    setCarregandoMais(true);
    try {
      const proxima = pagina.current + 1;
      const r = await buscarProjetos(filtrosEfetivos, proxima);
      if (id !== requisicao.current) return;
      pagina.current = proxima;
      setProjetos((atual) => {
        const ja = new Set(atual.map((p) => p.id));
        return [...atual, ...r.projetos.filter((p) => !ja.has(p.id))];
      });
      setTotal(r.total);
    } catch (e) {
      if (id === requisicao.current) setErro(mensagemDeErro(e));
    } finally {
      if (id === requisicao.current) setCarregandoMais(false);
    }
  }, [filtrosEfetivos]);

  const carregarEstatisticas = useCallback(() => {
    buscarEstatisticas()
      .then(setEstatisticas)
      .catch(() => setEstatisticas(null)); // estatística é secundária: não derruba a tela
  }, []);

  useEffect(() => {
    void carregarPrimeiraPagina();
  }, [carregarPrimeiraPagina]);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  const alterarFiltro: AlterarFiltro = useCallback((chave, valor) => {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros((atual) => ({ ...FILTROS_INICIAIS, ordenacao: atual.ordenacao }));
  }, []);

  const recarregar = useCallback(() => {
    void carregarPrimeiraPagina();
    carregarEstatisticas();
  }, [carregarPrimeiraPagina, carregarEstatisticas]);

  const filtrosAtivos = [
    filtros.busca.trim() !== "",
    filtros.uf !== "",
    filtros.manifestacao !== "",
    filtros.valorMin.trim() !== "",
    filtros.valorMax.trim() !== "",
    filtros.prazoMaxDias !== null,
  ].filter(Boolean).length;

  return {
    filtros,
    alterarFiltro,
    limparFiltros,
    filtrosAtivos,
    projetos,
    total,
    carregando,
    carregandoMais,
    erro,
    temMais: projetos.length < total,
    carregarMais,
    recarregar,
    estatisticas,
  };
}
