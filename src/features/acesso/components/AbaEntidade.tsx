import { useAuth } from "../../auth/hooks/useAuth";
import { TIPOS_ENTIDADE } from "../constantes";
import { usePerfil } from "../hooks/usePerfil";
import { FormEntidade } from "./FormEntidade";

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">{rotulo}</div>
      <div className="text-[13px] text-slate-200 mt-0.5 break-words">{valor && valor.trim() ? valor : "—"}</div>
    </div>
  );
}

// Aba "Minha entidade" (perfil proponente). Quem já usava o Módulo A antes dos perfis
// pode não ter entidade: o formulário aparece aqui para completar, sem bloquear o uso.
export function AbaEntidade() {
  const { user } = useAuth();
  const { entidade, carregando, recarregar } = usePerfil();

  if (carregando) return <p className="text-sm text-slate-400">Carregando...</p>;

  if (!entidade) {
    if (!user) return null;
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-200">
          Informe o CNPJ da sua entidade. É ele que liga a sua conta aos projetos da lista oficial do Ministério do
          Esporte.
        </div>
        <FormEntidade
          usuarioId={user.id}
          nomeInicial={user.name ?? ""}
          rotuloBotao="Salvar entidade"
          onSalvo={recarregar}
        />
      </div>
    );
  }

  const tipo = TIPOS_ENTIDADE.find((t) => t.valor === entidade.tipo)?.rotulo ?? entidade.tipo;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <Linha rotulo="Razão social" valor={entidade.razao_social} />
        <Linha rotulo="CNPJ" valor={entidade.cnpj} />
        <Linha rotulo="Tipo" valor={tipo} />
        <Linha rotulo="Local" valor={`${entidade.municipio} / ${entidade.uf}`} />
        <Linha rotulo="Responsável" valor={entidade.responsavel_nome} />
        <Linha rotulo="Cargo" valor={entidade.responsavel_cargo} />
      </div>
      <p className="text-[11.5px] text-slate-600 mt-4">
        CNPJ e razão social não podem ser alterados por aqui. Para corrigi-los, fale com o suporte.
      </p>
    </div>
  );
}
