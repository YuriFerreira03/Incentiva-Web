import { Link } from "react-router-dom";
import { Logo } from "../../../components/ui/Logo";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
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
            <span className="text-cyan-400 text-sm">Comece gratuitamente</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight">
            Estruture seu projeto{" "}
            <span className="text-cyan-400">com inteligência.</span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Crie sua conta e transforme sua ideia em um projeto esportivo
            estruturado, pronto para captação de recursos.
          </p>
        </div>

        {/* Benefícios */}
        <div className="space-y-4">
          {[
            "IA copiloto em toda a jornada",
            "Validação técnica preliminar automática",
            "Matching inteligente com incentivadores",
            "Acompanhamento até o recurso depositado",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full bg-cyan-400/20
                flex items-center justify-center shrink-0"
              >
                <svg
                  className="w-3 h-3 text-cyan-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-gray-300 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="lg:hidden mb-8">
          <Logo size="md" />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Criar conta gratuita
            </h2>
            <p className="text-gray-400 text-sm">
              Preencha os dados abaixo para começar
            </p>
          </div>

          <RegisterForm />

          <p className="text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
