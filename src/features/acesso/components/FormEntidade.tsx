import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/Button";
import { CampoSelect } from "../../../components/ui/CampoSelect";
import { Input } from "../../../components/ui/Input";
import { UFS } from "../../moduloB/constantes";
import { TIPOS_ENTIDADE } from "../constantes";
import { entidadeSchema } from "../schemas/acessoSchemas";
import type { EntidadeFormData } from "../schemas/acessoSchemas";
import { criarEntidade } from "../services/acessoService";
import { mascaraCnpj } from "../utils/cnpj";

interface Props {
  usuarioId: string;
  nomeInicial: string;
  rotuloBotao?: string;
  onSalvo: () => Promise<void> | void;
}

// Dados da entidade proponente. O CNPJ é o que liga a conta aos projetos da lista oficial do Ministério.
export function FormEntidade({ usuarioId, nomeInicial, rotuloBotao = "Salvar e continuar", onSalvo }: Props) {
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EntidadeFormData>({
    resolver: zodResolver(entidadeSchema),
    mode: "onTouched",
    defaultValues: {
      cnpj: "",
      razao_social: "",
      tipo: "",
      uf: "",
      municipio: "",
      responsavel_nome: nomeInicial,
      responsavel_cargo: "",
      responsavel_telefone: "",
    },
  });

  async function enviar(dados: EntidadeFormData) {
    setErroEnvio(null);
    try {
      await criarEntidade(usuarioId, dados);
      await onSalvo();
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="flex flex-col gap-5" noValidate>
      {erroEnvio && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {erroEnvio}
        </div>
      )}

      <Input
        label="CNPJ da entidade"
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
        <CampoSelect label="Tipo de entidade" error={errors.tipo?.message} {...register("tipo")}>
          <option value="">Selecione</option>
          {TIPOS_ENTIDADE.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect label="Estado (UF)" error={errors.uf?.message} {...register("uf")}>
          <option value="">Selecione</option>
          {UFS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </CampoSelect>
      </div>

      <Input label="Município" error={errors.municipio?.message} {...register("municipio")} />

      <div className="border-t border-white/10 pt-5 grid gap-5">
        <Input label="Nome do responsável" error={errors.responsavel_nome?.message} {...register("responsavel_nome")} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Cargo (opcional)" {...register("responsavel_cargo")} />
          <Input label="Telefone (opcional)" type="tel" {...register("responsavel_telefone")} />
        </div>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting}>
        {rotuloBotao}
      </Button>
    </form>
  );
}
