import { useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { CampoSelect } from "../../../components/ui/CampoSelect";
import { Input } from "../../../components/ui/Input";
import { TelaCarregando } from "../../../components/ui/TelaCarregando";
import { useAuth } from "../../auth/hooks/useAuth";
import { UFS } from "../../moduloB/constantes";
import { ErroPerfil } from "../components/ErroPerfil";
import { PreferenciasCampos } from "../components/PreferenciasCampos";
import { PORTES, PREFERENCIAS_VAZIAS, REGIMES_TRIBUTARIOS } from "../constantes";
import { usePerfil } from "../hooks/usePerfil";
import { limparPerfilPretendido, rotaInicial } from "../intencao";
import {
  CAMPOS_PASSO_EMPRESA,
  CAMPOS_PASSO_RESPONSAVEL,
  empresaSchema,
  validarPreferencias,
} from "../schemas/acessoSchemas";
import type { EmpresaFormData } from "../schemas/acessoSchemas";
import { criarEmpresa, salvarPreferencias } from "../services/acessoService";
import type { PreferenciasForm } from "../types";
import { mascaraCnpj } from "../utils/cnpj";

const PASSOS = ["Empresa", "Responsável", "Preferências"];

export function CadastroEmpresaPage() {
  const { user } = useAuth();
  const { carregando, erro, papeis, empresa, recarregar } = usePerfil();
  const [passo, setPasso] = useState(0);
  const [prefs, setPrefs] = useState<PreferenciasForm>(PREFERENCIAS_VAZIAS);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    mode: "onTouched",
    defaultValues: {
      cnpj: "",
      razao_social: "",
      uf: "",
      municipio: "",
      porte: "",
      setor: "",
      regime_tributario: "",
      responsavel_nome: user?.name ?? "",
      responsavel_cargo: "",
      responsavel_email: "",
      responsavel_telefone: "",
      aceite_termos: false,
      aceite_lgpd: false,
    },
  });

  if (concluido) return <Navigate to={concluido} replace />;
  if (carregando) return <TelaCarregando />;
  if (erro && papeis.length === 0) return <ErroPerfil mensagem={erro} onTentar={() => void recarregar()} />;
  // Já tem empresa, ou a conta é de proponente: não é daqui
  if (empresa || papeis.includes("proponente")) return <Navigate to={rotaInicial(papeis)} replace />;
  if (!user) return null;

  const usuarioId = user.id;

  async function avancar() {
    const ok = await trigger(passo === 0 ? CAMPOS_PASSO_EMPRESA : CAMPOS_PASSO_RESPONSAVEL);
    if (ok) setPasso((p) => p + 1);
  }

  async function enviar(dados: EmpresaFormData) {
    const erroPrefs = validarPreferencias(prefs);
    if (erroPrefs) {
      setErroEnvio(erroPrefs);
      return;
    }
    setErroEnvio(null);
    setEnviando(true);
    try {
      const empresaId = await criarEmpresa(usuarioId, dados);
      try {
        await salvarPreferencias(empresaId, prefs);
      } catch {
        // A empresa já foi criada. Se só as preferências falharem, o Módulo B avisa para completá-las.
      }
      limparPerfilPretendido();
      await recarregar();
      setConcluido("/modulo-b");
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  function aoEnviarFormulario(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (passo < PASSOS.length - 1) void avancar();
    else void handleSubmit(enviar)(e);
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
      <div className="mb-6">
        <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
          Perfil empresa incentivadora
        </span>
        <h1 className="text-2xl font-bold text-white mt-1">Cadastro da empresa</h1>
        <p className="text-slate-400 text-sm mt-1">
          Os dados e as preferências abaixo serão usados para recomendar projetos.
        </p>
      </div>

      {/* Indicador de passos */}
      <ol className="flex items-center gap-2 mb-8">
        {PASSOS.map((nome, i) => (
          <li key={nome} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full text-[12px] font-semibold flex items-center justify-center border ${
                i === passo
                  ? "bg-cyan-400 text-gray-900 border-cyan-400"
                  : i < passo
                    ? "bg-cyan-400/20 text-cyan-200 border-cyan-400/40"
                    : "bg-white/5 text-slate-500 border-white/10"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-[13px] ${i === passo ? "text-white font-medium" : "text-slate-500"}`}>{nome}</span>
            {i < PASSOS.length - 1 && <span className="w-6 h-px bg-white/10" />}
          </li>
        ))}
      </ol>

      <form onSubmit={aoEnviarFormulario} className="flex flex-col gap-5" noValidate>
        {erroEnvio && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {erroEnvio}
          </div>
        )}

        {/* Passo 1 — Empresa */}
        <div className={passo === 0 ? "flex flex-col gap-5" : "hidden"}>
          <Input
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            hint="Aceita o novo CNPJ com letras."
            autoComplete="off"
            error={errors.cnpj?.message}
            {...register("cnpj", {
              onChange: (e) => {
                e.target.value = mascaraCnpj(e.target.value);
              },
            })}
          />
          <Input label="Razão social" error={errors.razao_social?.message} {...register("razao_social")} />
          <div className="grid sm:grid-cols-2 gap-4">
            <CampoSelect label="Estado (UF)" error={errors.uf?.message} {...register("uf")}>
              <option value="">Selecione</option>
              {UFS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </CampoSelect>
            <Input label="Município" error={errors.municipio?.message} {...register("municipio")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <CampoSelect label="Porte" error={errors.porte?.message} {...register("porte")}>
              <option value="">Selecione</option>
              {PORTES.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </CampoSelect>
            <Input label="Setor de atuação (opcional)" {...register("setor")} />
          </div>
          <CampoSelect
            label="Regime tributário (opcional)"
            hint="Ajuda a indicar se a empresa pode usar o incentivo fiscal."
            {...register("regime_tributario")}
          >
            <option value="">Prefiro não informar</option>
            {REGIMES_TRIBUTARIOS.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </CampoSelect>
        </div>

        {/* Passo 2 — Responsável */}
        <div className={passo === 1 ? "flex flex-col gap-5" : "hidden"}>
          <Input label="Nome do responsável" error={errors.responsavel_nome?.message} {...register("responsavel_nome")} />
          <Input label="Cargo (opcional)" {...register("responsavel_cargo")} />
          <Input
            label="E-mail corporativo"
            type="email"
            placeholder="nome@empresa.com.br"
            error={errors.responsavel_email?.message}
            {...register("responsavel_email")}
          />
          <Input label="Telefone (opcional)" type="tel" {...register("responsavel_telefone")} />
        </div>

        {/* Passo 3 — Preferências e aceites */}
        <div className={passo === 2 ? "flex flex-col gap-6" : "hidden"}>
          <PreferenciasCampos valor={prefs} onChange={setPrefs} />

          <div className="border-t border-white/10 pt-5 space-y-3">
            <label className="flex items-start gap-2.5 text-[13px] text-slate-300">
              <input type="checkbox" className="mt-0.5 accent-cyan-400" {...register("aceite_termos")} />
              <span>Li e aceito os termos de uso do INCENTIVA.</span>
            </label>
            {errors.aceite_termos && <p className="text-xs text-red-400">{errors.aceite_termos.message}</p>}
            <label className="flex items-start gap-2.5 text-[13px] text-slate-300">
              <input type="checkbox" className="mt-0.5 accent-cyan-400" {...register("aceite_lgpd")} />
              <span>Autorizo o tratamento dos dados da minha empresa, conforme a LGPD.</span>
            </label>
            {errors.aceite_lgpd && <p className="text-xs text-red-400">{errors.aceite_lgpd.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {passo > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setPasso((p) => p - 1)} disabled={enviando}>
              Voltar
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" loading={enviando}>
            {passo < PASSOS.length - 1 ? "Continuar" : "Concluir cadastro"}
          </Button>
        </div>
      </form>
    </div>
  );
}
