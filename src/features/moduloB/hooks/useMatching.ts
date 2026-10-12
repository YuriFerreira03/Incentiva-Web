import { useCallback, useRef, useState } from "react";
import { buscarResultados, calcularMatching, pedirExplicacoes } from "../services/matchingService";
import type { ProjetoAutorizado } from "../types/projetoAutorizado";

type Etapa = "inativo" | "calculando" | "pronto" | "erro";

// Estado do "Mais combinam": calcula (banco) -> lê o ranking -> pede a explicação da IA em segundo plano.
export function useMatching() {
  const [etapa, setEtapa] = useState<Etapa>("inativo");
  const [resultados, setResultados] = useState<ProjetoAutorizado[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [explicando, setExplicando] = useState(false);
  const execucao = useRef(0); // descarta respostas antigas se a pessoa sair do modo ou recalcular

  const iniciar = useCallback(async () => {
    const id = ++execucao.current;
    setEtapa("calculando");
    setErro(null);
    setExplicando(false);
    try {
      await calcularMatching();
      const lista = await buscarResultados();
      if (id !== execucao.current) return;
      setResultados(lista);
      setEtapa("pronto");

      // A lista já aparece com nota e fatores. O texto da IA chega depois, só para o top 10 que ainda não tem.
      if (lista.slice(0, 10).some((p) => !p.explicacao)) {
        setExplicando(true);
        try {
          const itens = await pedirExplicacoes();
          if (id === execucao.current && itens.length > 0) {
            const textos = new Map(itens.map((i) => [i.id, i.texto]));
            setResultados((atual) => atual.map((p) => (textos.has(p.id) ? { ...p, explicacao: textos.get(p.id) } : p)));
          }
        } catch {
          // A IA é opcional: os fatores já explicam a nota.
        } finally {
          if (id === execucao.current) setExplicando(false);
        }
      }
    } catch (e) {
      if (id !== execucao.current) return;
      setErro(e instanceof Error ? e.message : "Não foi possível calcular o matching.");
      setEtapa("erro");
    }
  }, []);

  const desativar = useCallback(() => {
    execucao.current++;
    setEtapa("inativo");
    setExplicando(false);
  }, []);

  return { etapa, resultados, erro, explicando, iniciar, desativar };
}
