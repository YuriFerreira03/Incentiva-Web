import { useAuth } from "../../auth/hooks/useAuth";
import { Button } from "../../../components/ui/Button";
import { Logo } from "../../../components/ui/Logo";

export function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header
        className="border-b border-white/5 px-8 py-4
        flex items-center justify-between"
      >
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {user?.name ?? user?.email}
          </div>
          {user?.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-white/10"
            />
          )}
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      {/* Conteúdo */}
      <main
        className="flex flex-col items-center justify-center
        min-h-[calc(100vh-65px)] gap-4"
      >
        <div
          className="w-16 h-16 rounded-2xl bg-cyan-400/10
          border border-cyan-400/20 flex items-center justify-center"
        >
          <svg
            className="w-8 h-8 text-cyan-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">
          Olá, {user?.name?.split(" ")[0] ?? "usuário"} 👋
        </h1>
        <p className="text-gray-400 text-sm">
          Dashboard em construção — autenticação funcionando!
        </p>
      </main>
    </div>
  );
}
