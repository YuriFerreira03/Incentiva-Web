import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AuthState, User } from "../types/auth";

export type ResultadoCadastro = "ok" | "confirmar_email" | "erro";

interface AuthContextValue extends AuthState {
  /** true quando entrou; em caso de erro, a mensagem fica em `error` */
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  /** "confirmar_email" = conta criada, mas o Supabase exige clicar no link enviado por e-mail */
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<ResultadoCadastro>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionToUser(session: Session): User {
  const { user } = session;
  return {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    createdAt: user.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        user: session ? sessionToUser(session) : null,
        loading: false,
      }));
    });

    // Escuta mudanças de sessão (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        user: session ? sessionToUser(session) : null,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const setError = (error: string) => setState((prev) => ({ ...prev, error }));

  const clearError = () => setState((prev) => ({ ...prev, error: null }));

  const signInWithEmail = async (email: string, password: string) => {
    clearError();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
  ): Promise<ResultadoCadastro> => {
    clearError();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      return "erro";
    }
    // Sem sessão = confirmação de e-mail ligada no Supabase
    return data.session ? "ok" : "confirmar_email";
  };

  const signInWithGoogle = async () => {
    clearError();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  const signOut = async () => {
    clearError();
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
