export function formatarMoeda(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// Recebe "AAAA-MM-DD" e devolve "DD/MM/AAAA" sem passar por Date (evita erro de fuso).
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "—";
  const [, ano, mes, dia] = m;
  return `${dia}/${mes}/${ano}`;
}

export type UrgenciaPrazo = "critico" | "atencao" | "normal" | "desconhecido";

export function descreverPrazo(dias: number | null | undefined): { texto: string; urgencia: UrgenciaPrazo } {
  if (dias === null || dias === undefined) return { texto: "Prazo não informado", urgencia: "desconhecido" };
  if (dias < 0) return { texto: "Prazo encerrado", urgencia: "critico" };
  if (dias === 0) return { texto: "Vence hoje", urgencia: "critico" };
  if (dias === 1) return { texto: "Falta 1 dia", urgencia: "critico" };
  const urgencia: UrgenciaPrazo = dias <= 30 ? "critico" : dias <= 90 ? "atencao" : "normal";
  if (dias <= 90) return { texto: `${dias} dias restantes`, urgencia };
  return { texto: `~${Math.round(dias / 30)} meses restantes`, urgencia };
}

export function montarLocal(cidade: string | null | undefined, uf: string | null | undefined): string | null {
  const partes = [cidade, uf].filter((x): x is string => Boolean(x && x.trim()));
  return partes.length > 0 ? partes.join(" / ") : null;
}
