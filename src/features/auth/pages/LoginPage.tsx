import { Link } from "react-router-dom";
import { Logo } from "../../../components/ui/Logo";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Lado esquerdo — visual */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12
        bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900
        border-r border-white/5"
      >
        <Logo size="md" />

        <div className="space-y-6">
          <div
            className="inline-flex items-center gap-2 bg-cyan-400/10
            border border-cyan-400/20 rounded-full px-4 py-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-sm">
              Lei de Incentivo ao Esporte
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight">
            Apoio inteligente,{" "}
            <span className="text-cyan-400">do início ao recurso.</span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            O INCENTIVA conduz proponentes e incentivadores ao longo de toda a
            jornada — da ideia estruturada ao recurso depositado.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { value: "R$ 420 Mi+", label: "em projetos apoiados" },
            { value: "1.820", label: "projetos estruturados" },
            { value: "94%", label: "de aderência média" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <Logo size="md" />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Bem-vindo de volta
            </h2>
            <p className="text-gray-400 text-sm">
              Entre na sua conta para continuar
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-gray-500">
            Não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
