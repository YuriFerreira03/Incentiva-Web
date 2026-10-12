// Memória curta (sessionStorage) do que a pessoa queria fazer antes de entrar/cadastrar.
import type { Papel } from "./types";

const CHAVE_IDEIA = "incentiva_ideia_pendente"; // a mesma chave que o Módulo A já consome
const CHAVE_PERFIL = "incentiva_perfil_pretendido";

export function temIdeiaPendente(): boolean {
  return Boolean(sessionStorage.getItem(CHAVE_IDEIA));
}

export function definirPerfilPretendido(papel: Papel): void {
  sessionStorage.setItem(CHAVE_PERFIL, papel);
}

export function lerPerfilPretendido(): Papel | null {
  const v = sessionStorage.getItem(CHAVE_PERFIL);
  return v === "proponente" || v === "incentivador" ? v : null;
}

export function limparPerfilPretendido(): void {
  sessionStorage.removeItem(CHAVE_PERFIL);
}

// Rota de entrada de quem já tem perfil.
export function rotaInicial(papeis: Papel[]): string {
  if (papeis.includes("proponente")) return "/meus-projetos";
  if (papeis.includes("incentivador")) return "/modulo-b";
  return "/escolher-perfil";
}
