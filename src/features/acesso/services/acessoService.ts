// Único lugar do app que lê/escreve perfis no Supabase.
// O front NUNCA escreve em perfis_acesso: o papel nasce por gatilho no banco quando a entidade/empresa é salva.
import { supabase } from "../../../lib/supabase";
import type { Empresa, Entidade, Papel, PerfilCarregado, Preferencias, PreferenciasForm } from "../types";
import type { EmpresaFormData, EntidadeFormData } from "../schemas/acessoSchemas";
import { lerValor } from "../schemas/acessoSchemas";
import { normalizarCnpj, mascaraCnpj } from "../utils/cnpj";

interface ErroBanco {
  code?: string;
  message: string;
  details?: string | null;
}

export function traduzirErro(e: ErroBanco): string {
  const texto = `${e.message} ${e.details ?? ""}`;
  if (e.code === "23505") {
    if (texto.includes("empresas_cnpj_key")) return "Este CNPJ já está cadastrado por outra conta.";
    if (texto.includes("empresas_user_id_key")) return "Sua conta já tem uma empresa cadastrada.";
    if (texto.includes("entidades_user_id_key")) return "Sua conta já tem uma entidade cadastrada.";
    return "Já existe um cadastro com esses dados.";
  }
  if (e.code === "23514") {
    if (texto.includes("cnpj")) return "CNPJ inválido.";
    if (texto.includes("aceite")) return "É necessário aceitar os termos e a política de dados.";
    if (texto.includes("preferencias_valores")) return "O valor mínimo não pode ser maior que o máximo.";
    return "Algum dado informado é inválido. Confira o formulário.";
  }
  if (e.code === "42501") return "Você não tem permissão para esta ação.";
  if (e.code === "42P01" || e.code === "PGRST205") {
    return "O banco ainda não foi preparado para perfis de acesso (falta rodar o SQL 03a no Supabase).";
  }
  return e.message || "Erro inesperado. Tente novamente.";
}

const vazioParaNulo = (s: string): string | null => (s.trim() === "" ? null : s.trim());
const cnpjParaBanco = (s: string): string => mascaraCnpj(normalizarCnpj(s));

export async function carregarPerfil(userId: string): Promise<PerfilCarregado> {
  const [papeis, entidade, empresa] = await Promise.all([
    supabase.from("perfis_acesso").select("papel").eq("user_id", userId),
    supabase.from("entidades").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("empresas").select("*, incentivador_preferencias(*)").eq("user_id", userId).maybeSingle(),
  ]);
  for (const r of [papeis, entidade, empresa]) {
    if (r.error) throw new Error(traduzirErro(r.error));
  }

  const lista = ((papeis.data ?? []) as { papel: string }[])
    .map((l) => l.papel)
    .filter((p): p is Papel => p === "proponente" || p === "incentivador");

  const bruto = empresa.data as (Empresa & { incentivador_preferencias?: unknown }) | null;
  let preferencias: Preferencias | null = null;
  if (bruto) {
    const p = bruto.incentivador_preferencias;
    preferencias = (Array.isArray(p) ? (p[0] ?? null) : (p ?? null)) as Preferencias | null;
  }

  return {
    papeis: lista,
    entidade: (entidade.data as Entidade | null) ?? null,
    empresa: (bruto as Empresa | null) ?? null,
    preferencias,
  };
}

export async function criarEntidade(userId: string, d: EntidadeFormData): Promise<void> {
  const { error } = await supabase.from("entidades").insert({
    user_id: userId,
    cnpj: cnpjParaBanco(d.cnpj),
    razao_social: d.razao_social.trim(),
    tipo: d.tipo,
    uf: d.uf,
    municipio: d.municipio.trim(),
    responsavel_nome: d.responsavel_nome.trim(),
    responsavel_cargo: vazioParaNulo(d.responsavel_cargo),
    responsavel_telefone: vazioParaNulo(d.responsavel_telefone),
  });
  if (error) throw new Error(traduzirErro(error));
}

export async function criarEmpresa(userId: string, d: EmpresaFormData): Promise<string> {
  const { data, error } = await supabase
    .from("empresas")
    .insert({
      user_id: userId,
      cnpj: cnpjParaBanco(d.cnpj),
      razao_social: d.razao_social.trim(),
      uf: d.uf,
      municipio: d.municipio.trim(),
      porte: d.porte,
      setor: vazioParaNulo(d.setor),
      regime_tributario: vazioParaNulo(d.regime_tributario),
      responsavel_nome: d.responsavel_nome.trim(),
      responsavel_cargo: vazioParaNulo(d.responsavel_cargo),
      responsavel_email: d.responsavel_email.trim(),
      responsavel_telefone: vazioParaNulo(d.responsavel_telefone),
      aceite_termos: d.aceite_termos,
      aceite_lgpd: d.aceite_lgpd,
    })
    .select("id")
    .single();
  if (error) throw new Error(traduzirErro(error));
  return (data as { id: string }).id;
}

export async function salvarPreferencias(empresaId: string, p: PreferenciasForm): Promise<void> {
  const { error } = await supabase.from("incentivador_preferencias").upsert(
    {
      empresa_id: empresaId,
      manifestacoes: p.manifestacoes,
      modalidades: p.modalidades,
      ufs: p.ufs,
      valor_min_projeto: lerValor(p.valorMin),
      valor_max_projeto: lerValor(p.valorMax),
      faixa_anual: vazioParaNulo(p.faixaAnual),
      temas: p.temas,
      impacto_texto: vazioParaNulo(p.impacto),
    },
    { onConflict: "empresa_id" },
  );
  if (error) throw new Error(traduzirErro(error));
}

// Converte o que veio do banco para o formato do formulário.
export function preferenciasParaForm(p: Preferencias | null): PreferenciasForm {
  return {
    manifestacoes: p?.manifestacoes ?? [],
    modalidades: p?.modalidades ?? [],
    ufs: p?.ufs ?? [],
    valorMin: p?.valor_min_projeto != null ? String(p.valor_min_projeto) : "",
    valorMax: p?.valor_max_projeto != null ? String(p.valor_max_projeto) : "",
    faixaAnual: p?.faixa_anual ?? "",
    temas: p?.temas ?? [],
    impacto: p?.impacto_texto ?? "",
  };
}
