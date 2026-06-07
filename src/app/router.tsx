import { createBrowserRouter } from "react-router-dom";
import { PublicRoute } from "./PublicRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { AuthCallbackPage } from "../features/auth/pages/AuthCallbackPage";
import { LandingPage } from "../features/landing/pages/LandingPage";
import { ModuloAPage } from "../features/moduloA/pages/ModuloAPage";
import { MeusProjetosPage } from "../features/projetos/pages/MeusProjetosPage";
import { PerfilPage } from "../features/perfil/pages/PerfilPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";

export const router = createBrowserRouter([
  // ── Callback OAuth — sempre acessível ──────────────────────────────────
  { path: "/auth/callback", element: <AuthCallbackPage /> },

  // ── Páginas públicas (redireciona p/ / se já logado) ───────────────────
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

  // ── Rotas protegidas com layout global ─────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: (
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        ),
      },
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
        path: "/perfil",
        element: (
          <AppLayout>
            <PerfilPage />
          </AppLayout>
        ),
      },
    ],
  },
]);
