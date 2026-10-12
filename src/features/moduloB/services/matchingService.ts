// Matching: o banco calcula a nota (regras fixas); a Vercel pede o texto à IA. O navegador só dispara e lê.
import { supabase } from "../../../lib/supabase";
import type { ProjetoAutorizado } from "../types/projetoAutorizado";

export interface ResumoCalculo {
  cache: boolean;
  total: number;
}

export interface ExplicacaoGerada {
  id: string;
  texto: string;
}

// As mensagens de erro do banco já vêm em português ("Preencha ao menos uma preferência...", "Limite de 10 cálculos...").
export async function calcularMatching(): Promise<ResumoCalculo> {
  const { data, error } = await supabase.rpc("calcular_matching");
  if (error) throw new Error(error.message || "Não foi possível calcular o matching.");
  const d = data as { cache?: boolean; total?: number } | null;
  return { cache: Boolean(d?.cache), total: d?.total ?? 0 };
}

export async function buscarResultados(): Promise<ProjetoAutorizado[]> {
  const { data, error } = await supabase
    .from("vw_matching")
    .select("*")
    .order("posicao", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjetoAutorizado[];
}

// Gera (e grava) a explicação dos 10 primeiros que ainda não têm. Repetir a chamada não gasta IA.
export async function pedirExplicacoes(): Promise<ExplicacaoGerada[]> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const r = await fetch("/api/matching-explicar", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Explicações indisponíveis (${r.status})`);
  const d = (await r.json()) as { itens?: ExplicacaoGerada[] };
  return d.itens ?? [];
}
