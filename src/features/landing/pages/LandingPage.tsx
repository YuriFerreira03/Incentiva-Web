import { useNavigate } from "react-router-dom";
import { Logo } from "../../../components/ui/Logo";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../auth/hooks/useAuth";

export function LandingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-400">
                {user.name ?? user.email}
              </span>
              <Button onClick={() => navigate("/dashboard")}>
                Ir para o dashboard
              </Button>
              <Button variant="ghost" onClick={signOut}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Entrar
              </Button>
              <Button onClick={() => navigate("/register")}>
                Começar agora
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-8">
        <div
          className="inline-flex items-center gap-2 bg-cyan-400/10
          border border-cyan-400/20 rounded-full px-4 py-1.5"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 text-sm">
            Lei de Incentivo ao Esporte · plataforma inteligente
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight max-w-3xl">
          Apoio inteligente,{" "}
          <span className="text-cyan-400">do início ao recurso.</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
          O INCENTIVA conduz proponentes e incentivadores ao longo de toda a
          jornada — da ideia estruturada ao recurso depositado — com uma IA
          copiloto que acompanha, qualifica e conecta.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          {user ? (
            <Button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-3 text-base"
            >
              Ir para o dashboard →
            </Button>
          ) : (
            <>
              <Button
                onClick={() => navigate("/register")}
                className="px-8 py-3 text-base"
              >
                Começar agora →
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/login")}
                className="px-8 py-3 text-base"
              >
                Já tenho projeto
              </Button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-12 mt-8 pt-8 border-t border-white/5">
          {[
            { value: "R$ 420 Mi+", label: "em projetos apoiados" },
            { value: "1.820", label: "projetos estruturados" },
            { value: "94%", label: "de aderência média" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-600 border-t border-white/5">
        © INCENTIVA · protótipo demonstrativo · Lei de Incentivo ao Esporte
      </footer>
    </div>
  );
}
