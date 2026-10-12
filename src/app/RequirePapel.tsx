import { Navigate, Outlet } from "react-router-dom";
import { TelaCarregando } from "../components/ui/TelaCarregando";
import { ErroPerfil } from "../features/acesso/components/ErroPerfil";
import { rotaInicial } from "../features/acesso/intencao";
import { usePerfil } from "../features/acesso/hooks/usePerfil";
import type { Papel } from "../features/acesso/types";

// Libera as rotas filhas só para quem tem o papel. Fica DENTRO do ProtectedRoute (usuário já logado).
// - sem nenhum papel      -> tela "Como você vai usar o INCENTIVA?"
// - com outro papel       -> vai para a página inicial do papel que tem
export function RequirePapel({ papel }: { papel: Papel }) {
  const { carregando, erro, temPapel, papeis, recarregar } = usePerfil();

  if (carregando) return <TelaCarregando />;
  if (erro && papeis.length === 0) return <ErroPerfil mensagem={erro} onTentar={() => void recarregar()} />;
  if (temPapel(papel)) return <Outlet />;
  return <Navigate to={rotaInicial(papeis)} replace />;
}
