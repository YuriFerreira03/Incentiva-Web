import { createBrowserRouter, Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { PublicRoute } from "./PublicRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { RequirePapel } from "./RequirePapel";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { AuthCallbackPage } from "../features/auth/pages/AuthCallbackPage";
import { LandingPage } from "../features/landing/pages/LandingPage";
import { ModuloAPage } from "../features/moduloA/pages/ModuloAPage";
import { MeusProjetosPage } from "../features/projetos/pages/MeusProjetosPage";
import { ProjetoDetalhePage } from "../features/projetos/pages/ProjetoDetalhePage";
import { PerfilPage } from "../features/perfil/pages/PerfilPage";
import { ModuloBPage } from "../features/moduloB/pages/ModuloBPage";
import { PosLoginPage } from "../features/acesso/pages/PosLoginPage";
import { EscolherPerfilPage } from "../features/acesso/pages/EscolherPerfilPage";
import { CadastroProponentePage } from "../features/acesso/pages/CadastroProponentePage";
import { CadastroEmpresaPage } from "../features/acesso/pages/CadastroEmpresaPage";

// Exportadas à parte para poder testar as rotas com um roteador em memória.
export const rotas: RouteObject[] = [
  // ── Callback OAuth — sempre acessível ──────────────────────────────────
  { path: "/auth/callback", element: <AuthCallbackPage /> },

  // ── Páginas públicas (redireciona p/ /app se já logado) ────────────────
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  // ── Landing — pública mas com layout global ─────────────────────────────
  {
    path: "/",
    element: (
      <AppLayout>
        <LandingPage />
      </AppLayout>
    ),
  },

  // ── Rotas protegidas (exigem login) ────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // Porta de entrada depois do login: decide o destino pelo perfil
      { path: "/app", element: <PosLoginPage /> },
      { path: "/dashboard", element: <Navigate to="/app" replace /> },

      // Escolha e cadastro de perfil (login basta; ainda não exigem papel)
      {
        path: "/escolher-perfil",
        element: (
          <AppLayout>
            <EscolherPerfilPage />
          </AppLayout>
        ),
      },
      {
        path: "/cadastro/proponente",
        element: (
          <AppLayout>
            <CadastroProponentePage />
          </AppLayout>
        ),
      },
      {
        path: "/cadastro/empresa",
        element: (
          <AppLayout>
            <CadastroEmpresaPage />
          </AppLayout>
        ),
      },
      {
        path: "/perfil",
        element: (
          <AppLayout>
            <PerfilPage />
          </AppLayout>
        ),
      },

      // ── Módulo A: só proponente ──────────────────────────────────────
      {
        element: <RequirePapel papel="proponente" />,
        children: [
          {
            path: "/modulo-a",
            element: (
              <AppLayout>
                <ModuloAPage />
              </AppLayout>
            ),
          },
          {
            path: "/meus-projetos",
            element: (
              <AppLayout>
                <MeusProjetosPage />
              </AppLayout>
            ),
          },
          {
            path: "/projeto/:id",
            element: (
              <AppLayout>
                <ProjetoDetalhePage />
              </AppLayout>
            ),
          },
        ],
      },

      // ── Módulo B: só empresa incentivadora ───────────────────────────
      {
        element: <RequirePapel papel="incentivador" />,
        children: [
          {
            path: "/modulo-b",
            element: (
              <AppLayout>
                <ModuloBPage />
              </AppLayout>
            ),
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(rotas);
