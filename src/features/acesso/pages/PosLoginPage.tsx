import { Navigate } from "react-router-dom";
import { TelaCarregando } from "../../../components/ui/TelaCarregando";
import { ErroPerfil } from "../components/ErroPerfil";
import { usePerfil } from "../hooks/usePerfil";
import { lerPerfilPretendido, rotaInicial, temIdeiaPendente } from "../intencao";

// Porta de entrada depois de login/cadastro (/app): decide para onde a pessoa vai.
export function PosLoginPage() {
  const { carregando, erro, papeis, recarregar } = usePerfil();

  if (carregando) return <TelaCarregando mensagem="Preparando sua conta..." />;
  if (erro && papeis.length === 0) return <ErroPerfil mensagem={erro} onTentar={() => void recarregar()} />;

  // Já tem perfil
  if (papeis.length > 0) {
    // Escreveu uma ideia na landing antes de entrar: segue para o Módulo A
    if (temIdeiaPendente() && papeis.includes("proponente")) return <Navigate to="/modulo-a" replace />;
    return <Navigate to={rotaInicial(papeis)} replace />;
  }

  // Ainda sem perfil: usa a intenção guardada, senão pergunta
  const pretendido = lerPerfilPretendido();
  if (temIdeiaPendente() || pretendido === "proponente") return <Navigate to="/cadastro/proponente" replace />;
  if (pretendido === "incentivador") return <Navigate to="/cadastro/empresa" replace />;
  return <Navigate to="/escolher-perfil" replace />;
}
