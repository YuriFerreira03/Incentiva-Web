import type { ReactNode } from "react";
import { CampoSelect } from "../../../components/ui/CampoSelect";
import { MANIFESTACOES, UFS } from "../../moduloB/constantes";
import { FAIXAS_ANUAIS, GRUPOS_MODALIDADE, LIMITE_IMPACTO, TEMAS } from "../constantes";
import type { PreferenciasForm } from "../types";
import { SeletorChips } from "./SeletorChips";

interface Props {
  valor: PreferenciasForm;
  onChange: (proximo: PreferenciasForm) => void;
}

const OPCOES_MANIFESTACAO = MANIFESTACOES.map((m) => ({ valor: m, rotulo: m }));
const OPCOES_UF = UFS.map((u) => ({ valor: u, rotulo: u }));
const CAMPO =
  "w-full rounded-lg px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400";

function Bloco({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-medium text-gray-300">{titulo}</div>
        {dica && <div className="text-xs text-gray-500">{dica}</div>}
      </div>
      {children}
    </div>
  );
}

// Usado no cadastro da empresa (passo 3) e na aba "Minha empresa" do perfil.
// Estas preferências alimentam o matching por IA (em breve). Tudo é opcional: vazio = vale para todos.
export function PreferenciasCampos({ valor, onChange }: Props) {
  const mudar = <K extends keyof PreferenciasForm>(chave: K, v: PreferenciasForm[K]) =>
    onChange({ ...valor, [chave]: v });

  return (
    <div className="space-y-6">
      <Bloco titulo="Manifestações de interesse" dica="Deixe em branco se qualquer uma serve.">
        <SeletorChips
          opcoes={OPCOES_MANIFESTACAO}
          selecionados={valor.manifestacoes}
          onChange={(v) => mudar("manifestacoes", v)}
        />
      </Bloco>

      <Bloco titulo="Modalidades de interesse">
        <SeletorChips
          opcoes={GRUPOS_MODALIDADE}
          selecionados={valor.modalidades}
          onChange={(v) => mudar("modalidades", v)}
        />
      </Bloco>

      <Bloco titulo="Estados de interesse" dica="Onde sua empresa prefere apoiar projetos.">
        <SeletorChips opcoes={OPCOES_UF} selecionados={valor.ufs} onChange={(v) => mudar("ufs", v)} />
      </Bloco>

      <Bloco titulo="Temas de impacto">
        <SeletorChips opcoes={TEMAS} selecionados={valor.temas} onChange={(v) => mudar("temas", v)} />
      </Bloco>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="pref-min" className="text-sm font-medium text-gray-300">
            Valor mínimo por projeto (R$)
          </label>
          <input
            id="pref-min"
            type="number"
            min={0}
            className={CAMPO}
            placeholder="0"
            value={valor.valorMin}
            onChange={(e) => mudar("valorMin", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pref-max" className="text-sm font-medium text-gray-300">
            Valor máximo por projeto (R$)
          </label>
          <input
            id="pref-max"
            type="number"
            min={0}
            className={CAMPO}
            placeholder="Sem limite"
            value={valor.valorMax}
            onChange={(e) => mudar("valorMax", e.target.value)}
          />
        </div>
      </div>

      <CampoSelect
        label="Quanto sua empresa pretende destinar por ano"
        value={valor.faixaAnual}
        onChange={(e) => mudar("faixaAnual", e.target.value)}
      >
        <option value="">Prefiro não informar</option>
        {FAIXAS_ANUAIS.map((f) => (
          <option key={f.valor} value={f.valor}>
            {f.rotulo}
          </option>
        ))}
      </CampoSelect>

      <div className="space-y-1.5">
        <label htmlFor="pref-impacto" className="text-sm font-medium text-gray-300">
          Que impacto sua empresa quer gerar? (opcional)
        </label>
        <textarea
          id="pref-impacto"
          rows={4}
          maxLength={LIMITE_IMPACTO}
          className={`${CAMPO} resize-none`}
          placeholder="Ex.: Queremos apoiar projetos que levem esporte de base a crianças da região onde nossa fábrica atua."
          value={valor.impacto}
          onChange={(e) => mudar("impacto", e.target.value)}
        />
        <div className="text-right text-xs text-gray-500">
          {valor.impacto.length}/{LIMITE_IMPACTO}
        </div>
      </div>
    </div>
  );
}
