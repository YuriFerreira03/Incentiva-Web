import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { carregarPerfil } from "../features/acesso/services/acessoService";
import type { Empresa, Entidade, Papel, PerfilCarregado, Preferencias } from "../features/acesso/types";
import { useAuth } from "./AuthProvider";

interface PerfilContextValue {
  papeis: Papel[];
  entidade: Entidade | null;
  empresa: Empresa | null;
  preferencias: Preferencias | null;
  /** true enquanto o perfil do usuário logado ainda não foi lido (evita redirecionar antes da hora) */
  carregando: boolean;
  erro: string | null;
  temPapel: (papel: Papel) => boolean;
  /** Relê o perfil sem piscar a tela. Use depois de salvar entidade/empresa/preferências. */
  recarregar: () => Promise<void>;
}

interface Estado {
  userId: string | null; // de quem é o perfil guardado aqui
  perfil: PerfilCarregado | null;
  carregando: boolean;
  erro: string | null;
}

const PerfilContext = createContext<PerfilContextValue | null>(null);

export function PerfilProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [estado, setEstado] = useState<Estado>({ userId: null, perfil: null, carregando: false, erro: null });
  const requisicao = useRef(0); // ignora respostas antigas (troca de usuário, duplo clique)

  const carregar = useCallback(async () => {
    const id = ++requisicao.current;
    if (!userId) {
      setEstado({ userId: null, perfil: null, carregando: false, erro: null });
      return;
    }
    // Só mostra "carregando" se ainda não há perfil deste usuário; releituras são silenciosas.
    setEstado((e) => (e.userId === userId && e.perfil ? e : { userId, perfil: null, carregando: true, erro: null }));
    try {
      const perfil = await carregarPerfil(userId);
      if (id !== requisicao.current) return;
      setEstado({ userId, perfil, carregando: false, erro: null });
    } catch (e) {
      if (id !== requisicao.current) return;
      setEstado((atual) => ({
        userId,
        perfil: atual.userId === userId ? atual.perfil : null,
        carregando: false,
        erro: e instanceof Error ? e.message : "Não foi possível carregar seu perfil.",
      }));
    }
  }, [userId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const perfil = estado.userId === userId ? estado.perfil : null;
  const carregando = userId !== null && (estado.userId !== userId || estado.carregando);
  const papeis = perfil?.papeis ?? [];

  return (
    <PerfilContext.Provider
      value={{
        papeis,
        entidade: perfil?.entidade ?? null,
        empresa: perfil?.empresa ?? null,
        preferencias: perfil?.preferencias ?? null,
        carregando,
        erro: estado.userId === userId ? estado.erro : null,
        temPapel: (papel) => papeis.includes(papel),
        recarregar: carregar,
      }}
    >
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil(): PerfilContextValue {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error("usePerfil deve ser usado dentro de PerfilProvider");
  return ctx;
}
