import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, type LoginFormData } from "../schemas/authSchemas";

export function LoginForm() {
  const { signInWithEmail, signInWithGoogle, loading, error, clearError } =
    useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await signInWithEmail(data.email, data.password);
    if (!error) navigate("/");
  };

  const handleGoogle = async () => {
    clearError();
    await signInWithGoogle();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Erro global da API */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Senha"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Esqueci minha senha
        </button>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting || loading}>
        Entrar
      </Button>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500">ou</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="google"
        fullWidth
        onClick={handleGoogle}
        disabled={isSubmitting || loading}
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-4 h-4"
        />
        Entrar com Google
      </Button>
    </form>
  );
}
