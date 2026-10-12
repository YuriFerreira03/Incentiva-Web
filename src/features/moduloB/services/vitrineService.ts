// Único lugar que conversa com o Supabase no Módulo B.
import { supabase } from "../../../lib/supabase";
import { TAMANHO_PAGINA, VIEW_VIGENTES } from "../constantes";
import type {
  EstatisticasVitrine,
  Filtros,
  ProjetoAutorizado,
  ResultadoBusca,
} from "../types/projetoAutorizado";

// Caracteres que quebram a sintaxe do filtro .or() do PostgREST.
function limparTermo(texto: string): string {
  return texto.replace(/[,()"*%\\]/g, " ").replace(/\s+/g, " ").trim();
}

function lerNumero(texto: string): number | null {
  if (!texto.trim()) return null;
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function buscarProjetos(filtros: Filtros, pagina: number): Promise<ResultadoBusca> {
  let consulta = supabase.from(VIEW_VIGENTES).select("*", { count: "exact" });

  const termo = limparTermo(filtros.busca);
  if (termo) {
    const t = `%${termo}%`;
    consulta = consulta.or(
      [
        `projeto.ilike.${t}`,
        `proponente.ilike.${t}`,
        `modalidade.ilike.${t}`,
        `cidade.ilike.${t}`,
        `processo.ilike.${t}`,
        `cnpj.ilike.${t}`,
      ].join(","),
    );
  }
  if (filtros.uf) consulta = consulta.eq("uf", filtros.uf);
  if (filtros.manifestacao) consulta = consulta.eq("manifestacao", filtros.manifestacao);

  const min = lerNumero(filtros.valorMin);
  const max = lerNumero(filtros.valorMax);
  if (min !== null) consulta = consulta.gte("valor_autorizado", min);
  if (max !== null) consulta = consulta.lte("valor_autorizado", max);
  if (filtros.prazoMaxDias !== null) consulta = consulta.lte("dias_para_vencer", filtros.prazoMaxDias);

  switch (filtros.ordenacao) {
    case "recentes":
      consulta = consulta.order("data_publicacao", { ascending: false, nullsFirst: false });
      break;
    case "prazo_asc":
      consulta = consulta.order("prazo_captacao", { ascending: true });
      break;
    case "valor_desc":
      consulta = consulta.order("valor_autorizado", { ascending: false, nullsFirst: false });
      break;
    case "valor_asc":
      consulta = consulta.order("valor_autorizado", { ascending: true, nullsFirst: false });
      break;
  }
  // Desempate fixo: sem ele a paginação pode repetir ou pular projetos.
  consulta = consulta.order("id", { ascending: true });

  const de = pagina * TAMANHO_PAGINA;
  const { data, error, count } = await consulta.range(de, de + TAMANHO_PAGINA - 1);
  if (error) throw new Error(error.message);

  return { projetos: (data ?? []) as ProjetoAutorizado[], total: count ?? 0 };
}

export async function buscarEstatisticas(): Promise<EstatisticasVitrine> {
  const [todos, vencendo, ultima] = await Promise.all([
    supabase.from(VIEW_VIGENTES).select("id", { count: "exact", head: true }),
    supabase.from(VIEW_VIGENTES).select("id", { count: "exact", head: true }).lte("dias_para_vencer", 60),
    supabase
      .from(VIEW_VIGENTES)
      .select("data_publicacao")
      .not("data_publicacao", "is", null)
      .order("data_publicacao", { ascending: false })
      .limit(1),
  ]);
  if (todos.error) throw new Error(todos.error.message);

  const linha = (ultima.data ?? [])[0] as { data_publicacao: string | null } | undefined;
  return {
    totalVigentes: todos.count ?? 0,
    vencendoEm60Dias: vencendo.count ?? 0,
    ultimaPublicacao: linha?.data_publicacao ?? null,
  };
}
