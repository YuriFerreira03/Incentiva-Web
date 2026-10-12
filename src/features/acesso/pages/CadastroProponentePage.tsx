import { useState } from "react";
import { Navigate } from "react-router-dom";
import { TelaCarregando } from "../../../components/ui/TelaCarregando";
import { useAuth } from "../../auth/hooks/useAuth";
import { ErroPerfil } from "../components/ErroPerfil";
import { FormEntidade } from "../components/FormEntidade";
import { usePerfil } from "../hooks/usePerfil";
import { limparPerfilPretendido, rotaInicial, temIdeiaPendente } from "../intencao";

export function CadastroProponentePage() {
  const { user } = useAuth();
  const { carregando, erro, papeis, entidade, recarregar } = usePerfil();
  const [concluido, setConcluido] = useState<string | null>(null);

  if (concluido) return <Navigate to={concluido} replace />;
  if (carregando) return <TelaCarregando />;
  if (erro && papeis.length === 0) return <ErroPerfil mensagem={erro} onTentar={() => void recarregar()} />;
  // Já tem entidade, ou a conta é de empresa: não é daqui
  if (entidade || papeis.includes("incentivador")) return <Navigate to={rotaInicial(papeis)} replace />;
  if (!user) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
      <div className="mb-8">
        <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">Perfil proponente</span>
        <h1 className="text-2xl font-bold text-white mt-1">Dados da sua entidade</h1>
        <p className="text-slate-400 text-sm mt-1">
          O CNPJ liga a sua conta aos projetos da lista oficial do Ministério do Esporte.
        </p>
      </div>

      <FormEntidade
        usuarioId={user.id}
        nomeInicial={user.name ?? ""}
        rotuloBotao="Concluir cadastro"
        onSalvo={async () => {
          const destino = temIdeiaPendente() ? "/modulo-a" : "/meus-projetos";
          limparPerfilPretendido();
          await recarregar(); // o papel de proponente já existe; atualiza antes de navegar
          setConcluido(destino);
        }}
      />
    </div>
  );
}
