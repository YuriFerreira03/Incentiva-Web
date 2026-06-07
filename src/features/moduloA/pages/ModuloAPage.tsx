import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import { gerarProjeto, refazerProjeto } from "../services/moduloAService";
import type { ProjetoGerado, TelaModuloA } from "../types/moduloA";
import { supabase } from "../../../lib/supabase";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MIN_CHARS = 150;

function ConfBadge({ v }: { v: number }) {
  const cor =
    v >= 75
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : v >= 50
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-red-500/15 text-red-300 border-red-500/30";
  const label =
    v >= 75 ? "Boa confiança" : v >= 50 ? "Revisar" : "Precisa revisão";
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cor}`}
    >
      {v}% · {label}
    </span>
  );
}

function SecaoRevisao({
  titulo,
  campo,
  valor,
  confianca,
  onSave,
}: {
  titulo: string;
  campo: string;
  valor: string;
  confianca?: number;
  onSave: (campo: string, v: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(valor);
  const [aberta, setAberta] = useState(true);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        onClick={() => setAberta((a) => !a)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-white">
            {titulo}
          </span>
          {confianca !== undefined && <ConfBadge v={confianca} />}
        </div>
        {aberta ? (
          <ChevronUp size={15} className="text-slate-400" />
        ) : (
          <ChevronDown size={15} className="text-slate-400" />
        )}
      </button>

      {aberta && (
        <div className="px-4 pb-4">
          {editando ? (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg bg-white/5 border border-cyan-500/50 text-white text-[13.5px] leading-relaxed px-3 py-2.5 outline-none resize-none min-h-[80px]"
                rows={Math.max(4, draft.split("\n").length + 1)}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSave(campo, draft);
                    setEditando(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  <Check size={13} /> Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(valor);
                    setEditando(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-[12px] hover:bg-white/10 transition-colors"
                >
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <p className="text-[13.5px] text-slate-300 leading-relaxed whitespace-pre-line">
                {valor || "—"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDraft(valor);
                  setEditando(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-cyan-400 transition-colors"
              >
                <Edit3 size={12} /> Editar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function ModuloAPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tela, setTela] = useState<TelaModuloA>("ideia");
  const [ideia, setIdeia] = useState("");
  const [projeto, setProjeto] = useState<ProjetoGerado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [maisContexto, setMaisContexto] = useState("");
  const [mostraMaisContexto, setMostraMaisContexto] = useState(false);

  const chars = ideia.trim().length;
  const pronto = chars >= MIN_CHARS;

  // ─── Gerar projeto ───────────────────────────────────────────────────────
  async function handleGerar() {
    if (!pronto) return;
    setErro(null);
    setTela("gerando");
    try {
      const result = await gerarProjeto(ideia);
      setProjeto(result);
      setTela("revisao");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar projeto.");
      setTela("ideia");
    }
  }

  // ─── Refazer com mais contexto ───────────────────────────────────────────
  async function handleRefazer() {
    if (!projeto) return;
    setTela("gerando");
    try {
      const updated = await refazerProjeto(ideia, maisContexto, projeto);
      setProjeto(updated);
      setMaisContexto("");
      setMostraMaisContexto(false);
      setTela("revisao");
    } catch {
      setTela("revisao");
    }
  }

  // ─── Salvar campo editado ────────────────────────────────────────────────
  function handleSave(campo: string, valor: string) {
    if (!projeto) return;
    setProjeto((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  }

  // ─── Enviar para revisão humana ──────────────────────────────────────────
  async function handleEnviar() {
    if (!projeto || !user) return;
    setTela("enviando");
    setErro(null);
    try {
      const { error } = await supabase.from("projetos").insert({
        user_id: user.id,
        status: "em_revisao",
        ideia_original: ideia,
        nome: projeto.nome,
        manifestacao: projeto.manifestacao,
        objeto: projeto.objeto,
        objetivo_geral: projeto.objetivoGeral,
        objetivos_especificos: projeto.objetivosEspecificos,
        justificativa: projeto.justificativa,
        metodologia: projeto.metodologia,
        publico_beneficiario: projeto.publicoBeneficiario,
        quantidade_beneficiarios: projeto.quantidadeBeneficiarios,
        faixa_etaria: projeto.faixaEtaria,
        atende_pcd: projeto.atendePCD,
        locais_execucao: projeto.locaisExecucao,
        cronograma: projeto.cronograma,
        resultados_esperados: projeto.resultadosEsperados,
        metas: projeto.metas,
        orcamento: projeto.orcamento,
        confianca_geral: projeto.confiancaGeral,
        avisos: projeto.avisos,
        perguntas_adicionais: projeto.perguntasAdicionais,
      });
      if (error) throw error;
      setTela("enviado");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar projeto.");
      setTela("revisao");
    }
  }

  // ─── TELA: ideia ─────────────────────────────────────────────────────────
  if (tela === "ideia")
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
          color: "#F1F5F9",
        }}
      >
        {/* Header */}
        {/* <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
          <ArrowLeft size={16} /> Início
        </button>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">Módulo A</span>
          <span className="text-slate-600">/</span>
          <span className="text-[13px] text-slate-400">Estruturação do Projeto</span>
        </div>
      </header> */}

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-3xl mx-auto w-full">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-6">
            <Lightbulb className="text-cyan-400" size={24} />
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-3">
            Conte sua ideia de projeto
          </h1>
          <p className="text-slate-400 text-center max-w-xl mb-2">
            A IA vai transformar sua ideia em um projeto estruturado completo,
            pronto para análise técnica preliminar.
            <strong className="text-white">
              {" "}
              Quanto mais você escrever, melhor será o resultado.
            </strong>
          </p>
          <p className="text-slate-500 text-sm text-center mb-8">
            Responda:{" "}
            <em className="text-slate-300">
              Qual(ais) modalidade(s)? Para qual público? Em qual local? Por que
              é importante? Como será executado?
            </em>
          </p>

          <div className="w-full space-y-3">
            <textarea
              className="w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-[15px] leading-relaxed px-5 py-4 outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all resize-none"
              style={{ minHeight: 240 }}
              placeholder="Ex: Quero criar um projeto de natação para crianças de 6 a 14 anos em situação de vulnerabilidade no bairro X, em Belo Horizonte. A maioria dessas crianças nunca teve acesso a uma piscina. O objetivo é desenvolver habilidades aquáticas e valores como disciplina e trabalho em equipe. Temos parceria com o clube Y que tem piscina disponível 3 vezes por semana. A entidade existe há 8 anos e já executou projetos de futebol com 200 crianças..."
              value={ideia}
              onChange={(e) => setIdeia(e.target.value)}
              autoFocus
            />

            {/* Barra de progresso de caracteres */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {chars >= MIN_CHARS ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
                )}
                <span
                  className={`text-[12px] ${chars >= MIN_CHARS ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {chars < MIN_CHARS
                    ? `Ainda ${MIN_CHARS - chars} caracteres para um bom resultado`
                    : "Boa descrição! Pode enviar."}
                </span>
              </div>
              <span
                className={`text-[12px] tabular-nums ${chars >= MIN_CHARS ? "text-emerald-400" : "text-slate-500"}`}
              >
                {chars} / {MIN_CHARS}+
              </span>
            </div>

            {/* Dica */}
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-[12.5px] text-slate-400">
              <span className="text-cyan-400 font-semibold">💡 Dica: </span>
              Inclua nome do município, tipo de público (faixa etária,
              vulnerabilidade), experiência da organização, espaço disponível e
              valor aproximado que pretende captar. Quanto mais específico, mais
              preciso será o projeto gerado.
            </div>

            {erro && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
                <AlertTriangle size={15} /> {erro}
              </div>
            )}

            <button
              onClick={handleGerar}
              disabled={!pronto}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-[15px] transition-all"
              style={
                pronto
                  ? {
                      background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                      color: "white",
                      boxShadow: "0 8px 30px -8px rgba(6,182,212,0.5)",
                    }
                  : {
                      background: "rgba(255,255,255,0.05)",
                      color: "#64748B",
                      cursor: "not-allowed",
                    }
              }
            >
              <Sparkles size={18} />
              Gerar meu projeto com IA
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );

  // ─── TELA: gerando ────────────────────────────────────────────────────────
  if (tela === "gerando")
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
        }}
      >
        <div className="text-center space-y-6 px-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
            <div
              className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
              style={{ animation: "spin 2s linear infinite" }}
            />
            <div className="absolute inset-3 rounded-full bg-cyan-400/10 flex items-center justify-center">
              <Sparkles className="text-cyan-400" size={24} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Estruturando seu projeto…
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              A IA está analisando sua ideia e gerando objetivo, justificativa,
              metodologia, metas e orçamento conforme a Lei de Incentivo ao
              Esporte.
            </p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs mx-auto text-[12px] text-slate-500">
            {[
              "Analisando a ideia",
              "Identificando a manifestação esportiva",
              "Gerando estrutura do projeto",
              "Criando metas SMART",
              "Estimando orçamento",
            ].map((s, i) => (
              <div
                key={s}
                className="flex items-center gap-2"
                style={{ animationDelay: `${i * 400}ms` }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"
                  style={{ animationDelay: `${i * 400}ms` }}
                />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  // ─── TELA: revisão ────────────────────────────────────────────────────────
  if (tela === "revisao" && projeto) {
    const total = projeto.orcamento.reduce((s, i) => s + i.valor, 0);

    return (
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
          color: "#F1F5F9",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070B14]/90 backdrop-blur px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTela("ideia")}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft size={15} /> Editar ideia
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-[13px] text-slate-300 font-medium truncate max-w-xs">
              {projeto.nome}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostraMaisContexto((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[12px] text-slate-300 hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={13} /> Refazer com IA
            </button>
            <button
              onClick={handleEnviar}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                color: "white",
              }}
            >
              <Send size={14} /> Enviar para análise
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
          {/* Indicador de confiança geral */}
          <div
            className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
              projeto.confiancaGeral >= 75
                ? "border-emerald-500/30 bg-emerald-500/5"
                : projeto.confiancaGeral >= 50
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-red-500/30 bg-red-500/5"
            }`}
          >
            {projeto.confiancaGeral >= 75 ? (
              <CheckCircle2
                size={16}
                className="text-emerald-400 mt-0.5 shrink-0"
              />
            ) : (
              <AlertTriangle
                size={16}
                className="text-amber-400 mt-0.5 shrink-0"
              />
            )}
            <div>
              <p className="text-[13px] font-semibold text-white">
                Confiança geral: {projeto.confiancaGeral}%
                {projeto.confiancaGeral < 60 &&
                  " — projeto precisa de mais informações"}
              </p>
              {projeto.avisos.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {projeto.avisos.map((a, i) => (
                    <li key={i} className="text-[12px] text-slate-400">
                      • {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Mais contexto */}
          {mostraMaisContexto && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-cyan-300">
                <MessageSquare size={15} /> Forneça mais contexto para a IA
              </div>
              {projeto.perguntasAdicionais.length > 0 && (
                <ul className="space-y-1">
                  {projeto.perguntasAdicionais.map((q, i) => (
                    <li key={i} className="text-[12.5px] text-slate-400">
                      ❓ {q}
                    </li>
                  ))}
                </ul>
              )}
              <textarea
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-[13.5px] px-3 py-2.5 outline-none focus:border-cyan-500/50 resize-none"
                rows={4}
                placeholder="Responda as perguntas acima ou adicione qualquer informação extra que achar relevante..."
                value={maisContexto}
                onChange={(e) => setMaisContexto(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRefazer}
                  disabled={!maisContexto.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                    color: "white",
                  }}
                >
                  <RefreshCw size={13} /> Regenerar projeto
                </button>
                <button
                  onClick={() => setMostraMaisContexto(false)}
                  className="px-4 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-white/5 border border-white/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {erro && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} /> {erro}
            </div>
          )}

          {/* Nome e Manifestação */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                Nome do Projeto
              </div>
              <p className="text-white font-semibold text-[15px]">
                {projeto.nome}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                Manifestação Esportiva
              </div>
              <p className="text-white font-semibold text-[15px]">
                {projeto.manifestacao}
              </p>
            </div>
          </div>

          {/* Seções de texto */}
          <SecaoRevisao
            titulo="Objeto do Projeto"
            campo="objeto"
            valor={projeto.objeto}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Objetivo Geral"
            campo="objetivoGeral"
            valor={projeto.objetivoGeral}
            confianca={projeto.confiancaCampos.objetivoGeral}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Objetivos Específicos"
            campo="objetivosEspecificos"
            valor={projeto.objetivosEspecificos}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Justificativa"
            campo="justificativa"
            valor={projeto.justificativa}
            confianca={projeto.confiancaCampos.justificativa}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Metodologia"
            campo="metodologia"
            valor={projeto.metodologia}
            confianca={projeto.confiancaCampos.metodologia}
            onSave={handleSave}
          />

          {/* Público */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                Público Beneficiário
              </div>
              <p className="text-slate-200 text-[13.5px]">
                {projeto.publicoBeneficiario}
              </p>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                Quantidade
              </div>
              <p className="text-white font-bold text-xl">
                {projeto.quantidadeBeneficiarios}
              </p>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                Faixa Etária
              </div>
              <p className="text-slate-200 text-[13.5px]">
                {projeto.faixaEtaria}
              </p>
            </div>
          </div>

          <SecaoRevisao
            titulo="Locais de Execução"
            campo="locaisExecucao"
            valor={projeto.locaisExecucao}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Cronograma Resumido"
            campo="cronograma"
            valor={projeto.cronograma}
            onSave={handleSave}
          />
          <SecaoRevisao
            titulo="Resultados Esperados"
            campo="resultadosEsperados"
            valor={projeto.resultadosEsperados}
            onSave={handleSave}
          />

          {/* Metas */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-white">
                Metas
              </span>
              <ConfBadge v={projeto.confiancaCampos.metas ?? 70} />
            </div>
            <div className="p-4 space-y-3">
              {projeto.metas.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/8 bg-white/3 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 font-medium">
                      {m.tipo || "Quantitativa"}
                    </span>
                    <span className="text-[12px] text-slate-500">
                      Meta {i + 1}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-slate-200 font-medium mb-2">
                    {m.descricao}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2 text-[12px]">
                    <div>
                      <span className="text-slate-500">Indicador: </span>
                      <span className="text-slate-300">{m.indicador}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Verificador: </span>
                      <span className="text-slate-300">{m.verificador}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Prazo: </span>
                      <span className="text-slate-300">{m.prazo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orçamento */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-white">
                Orçamento Estimado
              </span>
              <ConfBadge v={projeto.confiancaCampos.orcamento ?? 60} />
            </div>
            <div className="divide-y divide-white/5">
              {projeto.orcamento.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="text-[12px] text-slate-500">
                      {it.categoria}
                    </div>
                    <div className="text-[13.5px] text-slate-200">
                      {it.descricao}
                    </div>
                  </div>
                  <div className="text-white font-semibold tabular-nums text-[14px]">
                    {it.valor.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex justify-between">
              <span className="text-[13px] font-bold text-white">
                TOTAL ESTIMADO
              </span>
              <span className="text-[15px] font-bold text-cyan-300">
                {total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="px-4 py-2 bg-amber-500/5">
              <p className="text-[11.5px] text-amber-400/80">
                ⚠️ Valores são estimativas preliminares e devem ser revisados
                conforme as regras vigentes da Lei de Incentivo ao Esporte.
              </p>
            </div>
          </div>

          {/* Botão enviar */}
          <div className="flex justify-end pt-4 pb-8">
            <button
              onClick={handleEnviar}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-[15px] transition-all"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                color: "white",
                boxShadow: "0 8px 30px -8px rgba(6,182,212,0.5)",
              }}
            >
              <Send size={18} />
              Enviar para análise técnica
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA: enviando ───────────────────────────────────────────────────────
  if (tela === "enviando")
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
        }}
      >
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-cyan-400/40 mx-auto flex items-center justify-center"
            style={{ animation: "spin 1.5s linear infinite" }}
          >
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
          </div>
          <p className="text-white font-semibold">Enviando projeto…</p>
        </div>
      </div>
    );

  // ─── TELA: enviado ────────────────────────────────────────────────────────
  if (tela === "enviado")
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0B111F 100%)",
        }}
      >
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-emerald-400" size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Projeto enviado com sucesso!
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Seu projeto foi encaminhado para análise técnica preliminar por um
              especialista, que irá revisar e ajustar os pontos necessários
              antes da submissão oficial ao SLI.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-[13px] text-slate-300 text-left space-y-2">
            <p className="font-semibold text-white">Próximos passos:</p>
            <p>1. Um especialista irá revisar seu projeto</p>
            <p>2. Você receberá um retorno com sugestões de ajuste</p>
            <p>3. Após aprovação interna, o projeto segue para o SLI</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setTela("ideia");
                setIdeia("");
                setProjeto(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-[13px] hover:bg-white/5 transition-colors"
            >
              Novo projeto
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                color: "white",
              }}
            >
              Ir para o início <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );

  return null;
}
