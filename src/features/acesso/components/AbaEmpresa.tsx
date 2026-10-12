import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { PORTES } from "../constantes";
import { usePerfil } from "../hooks/usePerfil";
import { validarPreferencias } from "../schemas/acessoSchemas";
import { preferenciasParaForm, salvarPreferencias } from "../services/acessoService";
import type { PreferenciasForm } from "../types";
import { PreferenciasCampos } from "./PreferenciasCampos";

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">{rotulo}</div>
      <div className="text-[13px] text-slate-200 mt-0.5 break-words">{valor && valor.trim() ? valor : "—"}</div>
    </div>
  );
}

// Aba "Minha empresa" (perfil incentivador): dados em leitura e preferências editáveis.
export function AbaEmpresa() {
  const { empresa, preferencias, carregando, recarregar } = usePerfil();
  const [valor, setValor] = useState<PreferenciasForm>(() => preferenciasParaForm(preferencias));
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    setValor(preferenciasParaForm(preferencias));
  }, [preferencias]);

  if (carregando) return <p className="text-sm text-slate-400">Carregando...</p>;
  if (!empresa) {
    return <p className="text-sm text-slate-400">Esta conta não tem uma empresa cadastrada.</p>;
  }
  const empresaId = empresa.id;

  async function salvar() {
    const erro = validarPreferencias(valor);
    if (erro) {
      setMsg({ tipo: "erro", texto: erro });
      return;
    }
    setSalvando(true);
    setMsg(null);
    try {
      await salvarPreferencias(empresaId, valor);
      await recarregar();
      setMsg({ tipo: "ok", texto: "Preferências salvas." });
    } catch (e) {
      setMsg({ tipo: "erro", texto: e instanceof Error ? e.message : "Não foi possível salvar." });
    } finally {
      setSalvando(false);
    }
  }

  const porte = PORTES.find((p) => p.valor === empresa.porte)?.rotulo ?? empresa.porte;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
          <Linha rotulo="Razão social" valor={empresa.razao_social} />
          <Linha rotulo="CNPJ" valor={empresa.cnpj} />
          <Linha rotulo="Local" valor={`${empresa.municipio} / ${empresa.uf}`} />
          <Linha rotulo="Porte" valor={porte} />
          <Linha rotulo="Responsável" valor={empresa.responsavel_nome} />
          <Linha rotulo="E-mail" valor={empresa.responsavel_email} />
        </div>
        <p className="text-[11.5px] text-slate-600 mt-4">
          CNPJ e razão social não podem ser alterados por aqui. Para corrigi-los, fale com o suporte.
        </p>
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-white mb-1">Preferências de apoio</h2>
        <p className="text-[12.5px] text-slate-500 mb-5">
          Serão usadas no matching por IA (em breve). Deixe em branco o que não faz diferença.
        </p>
        <PreferenciasCampos valor={valor} onChange={setValor} />
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] ${
            msg.tipo === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
              : "bg-red-500/10 border border-red-500/25 text-red-300"
          }`}
        >
          {msg.tipo === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {msg.texto}
        </div>
      )}

      <Button onClick={() => void salvar()} loading={salvando}>
        Salvar preferências
      </Button>
    </div>
  );
}
