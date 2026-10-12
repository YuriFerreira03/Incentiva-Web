import { Building2, Lightbulb, ArrowRight } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { TelaCarregando } from "../../../components/ui/TelaCarregando";
import { ErroPerfil } from "../components/ErroPerfil";
import { usePerfil } from "../hooks/usePerfil";
import { definirPerfilPretendido, rotaInicial } from "../intencao";
import type { Papel } from "../types";

interface Opcao {
  papel: Papel;
  icone: typeof Lightbulb;
  titulo: string;
  descricao: string;
  itens: string[];
  destino: string;
}

const OPCOES: Opcao[] = [
  {
    papel: "proponente",
    icone: Lightbulb,
    titulo: "Sou proponente",
    descricao: "Tenho um projeto esportivo e quero estruturá-lo para a Lei de Incentivo ao Esporte.",
    itens: [
      "A IA ajuda a montar objetivo, metas, orçamento e público.",
      "Você informa o CNPJ da sua entidade.",
      "Acesso ao Módulo A e aos seus projetos.",
    ],
    destino: "/cadastro/proponente",
  },
  {
    papel: "incentivador",
    icone: Building2,
    titulo: "Sou uma empresa incentivadora",
    descricao: "Quero apoiar projetos esportivos já autorizados pelo Ministério do Esporte.",
    itens: [
      "Vitrine de projetos com prazo de captação aberto.",
      "Filtros por estado, modalidade, valor e prazo.",
      "Matching por IA com o perfil da empresa (em breve).",
    ],
    destino: "/cadastro/empresa",
  },
];

export function EscolherPerfilPage() {
  const navigate = useNavigate();
  const { carregando, erro, papeis, recarregar } = usePerfil();

  if (carregando) return <TelaCarregando />;
  if (erro && papeis.length === 0) return <ErroPerfil mensagem={erro} onTentar={() => void recarregar()} />;
  if (papeis.length > 0) return <Navigate to={rotaInicial(papeis)} replace />;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white">Como você vai usar o INCENTIVA?</h1>
        <p className="text-slate-400 text-sm mt-2">
          Escolha o seu perfil. Cada perfil libera um módulo. Você poderá ajustar seus dados depois em Minha conta.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {OPCOES.map((o) => {
          const Icone = o.icone;
          return (
            <button
              key={o.papel}
              type="button"
              onClick={() => {
                definirPerfilPretendido(o.papel);
                navigate(o.destino);
              }}
              className="text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-cyan-400/40 transition-all p-6 flex flex-col gap-4 outline-none focus-visible:border-cyan-400"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                <Icone size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{o.titulo}</h2>
                <p className="text-[13.5px] text-slate-400 mt-1">{o.descricao}</p>
              </div>
              <ul className="space-y-1.5 text-[13px] text-slate-300 list-disc pl-5">
                {o.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-cyan-300">
                Continuar <ArrowRight size={14} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
