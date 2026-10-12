import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../auth/hooks/useAuth";

interface Props {
  mensagem: string;
  onTentar: () => void;
}

export function ErroPerfil({ mensagem, onTentar }: Props) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 text-center">
        <h1 className="text-lg font-semibold text-white">Não foi possível carregar seu perfil</h1>
        <p className="text-sm text-slate-400">{mensagem}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onTentar}>Tentar de novo</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
