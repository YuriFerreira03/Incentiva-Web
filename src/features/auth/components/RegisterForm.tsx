import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { registerSchema, type RegisterFormData } from "../schemas/authSchemas";

export function RegisterForm() {
  const { signUpWithEmail, signInWithGoogle, loading, error, clearError } =
    useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    await signUpWithEmail(data.email, data.password, data.name);
    if (!error) navigate("/");
  };

  const handleGoogle = async () => {
    clearError();
    await signInWithGoogle();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Nome completo"
        type="text"
        placeholder="Yuri Ferreira"
        error={errors.name?.message}
        {...register("name")}
      />

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
        hint="Mínimo de 6 caracteres"
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Confirmar senha"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" fullWidth loading={isSubmitting || loading}>
        Criar conta
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500">ou</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

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
        Cadastrar com Google
      </Button>
    </form>
  );
}
