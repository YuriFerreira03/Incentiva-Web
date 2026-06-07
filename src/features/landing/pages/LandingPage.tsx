import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import {
  ArrowRight,
  Check,
  Sparkles,
  FileText,
  Wallet,
  CheckCircle2,
  Lightbulb,
  Activity,
  Radar,
  Compass,
  Dumbbell,
  Landmark,
  Wand2,
  Rocket,
  Building2,
  Trophy,
  Shield,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

// ---------- Design tokens ----------
const C = {
  border: "rgba(148, 163, 184, 0.14)",
  text: "#CBD5E1",
  primary: "#3B82F6",
  accent: "#10D9A3",
  gold: "#F59E0B",
};

// ---------- Small UI helpers ----------
function Chip({
  children,
  tone = "default",
  icon,
}: {
  children: React.ReactNode;
  tone?: "default" | "blue" | "accent" | "gold";
  icon?: React.ReactNode;
}) {
  const t = {
    default: {
      bg: "rgba(30,41,59,0.7)",
      color: "#CBD5E1",
      ring: "rgba(148,163,184,0.22)",
    },
    blue: {
      bg: "rgba(59,130,246,0.12)",
      color: "#93C5FD",
      ring: "rgba(59,130,246,0.4)",
    },
    accent: {
      bg: "rgba(16,217,163,0.12)",
      color: "#6EE7B7",
      ring: "rgba(16,217,163,0.4)",
    },
    gold: {
      bg: "rgba(245,158,11,0.14)",
      color: "#FCD34D",
      ring: "rgba(245,158,11,0.45)",
    },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium"
      style={{
        background: t.bg,
        color: t.color,
        boxShadow: `0 0 0 1px ${t.ring} inset`,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

function AiChip({ children = "IA integrada" }: { children?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{
        background:
          "linear-gradient(180deg, rgba(59,130,246,0.22), rgba(16,217,163,0.18))",
        color: "#BFDBFE",
        boxShadow: "0 0 0 1px rgba(59,130,246,0.4) inset",
      }}
    >
      <Sparkles size={11} />
      {children}
    </span>
  );
}

function GlassCard({
  children,
  className = "",
  hi = false,
}: {
  children: React.ReactNode;
  className?: string;
  hi?: boolean;
}) {
  return (
    <div className={`rounded-2xl ${hi ? "glass-hi" : "glass"} ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-slate-400 font-medium">
      {icon}
      {children}
    </div>
  );
}

// ---------- Background trajectory SVG ----------
function TrajectoryBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.55]"
      viewBox="0 0 1440 800"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="tl1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B82F6" stopOpacity="0.7" />
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tl2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10D9A3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#10D9A3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M -40 620 C 260 540, 420 260, 820 200 S 1280 120, 1500 60"
        stroke="url(#tl1)"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M -40 700 C 300 600, 560 380, 900 330 S 1320 220, 1500 180"
        stroke="url(#tl2)"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 100 780 C 380 720, 660 520, 1040 470 S 1380 360, 1500 320"
        className="trajectory-dash"
        stroke="rgba(148,163,184,0.35)"
        strokeWidth="0.8"
        fill="none"
      />
    </svg>
  );
}

// ---------- Hero visual (radar / trajectory) ----------
function HeroVisual() {
  return (
    <div className="relative aspect-[5/4] rounded-3xl glass-hi overflow-hidden lume">
      <div className="absolute inset-0 grid-bg-fine opacity-80" />
      <div className="absolute inset-0 glow-blue" />
      <svg viewBox="0 0 500 400" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="radarG" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#3B82F6" stopOpacity="0.35" />
            <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#10D9A3" />
          </linearGradient>
        </defs>
        <circle cx="250" cy="210" r="160" fill="url(#radarG)" />
        {[60, 100, 140, 180].map((r) => (
          <circle
            key={r}
            cx="250"
            cy="210"
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.16)"
            strokeDasharray="2 4"
          />
        ))}
        <line
          x1="250"
          y1="30"
          x2="250"
          y2="390"
          stroke="rgba(148,163,184,0.1)"
        />
        <line
          x1="60"
          y1="210"
          x2="440"
          y2="210"
          stroke="rgba(148,163,184,0.1)"
        />
        <path
          d="M 80 340 C 180 220, 260 140, 420 80"
          fill="none"
          stroke="url(#arcG)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M 80 340 C 180 220, 260 140, 420 80"
          fill="none"
          stroke="url(#arcG)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.22"
        />
        {[
          { cx: 80, cy: 340, t: "Ideia" },
          { cx: 178, cy: 232, t: "Estruturação" },
          { cx: 260, cy: 160, t: "Aprovação" },
          { cx: 340, cy: 120, t: "Captação" },
          { cx: 420, cy: 80, t: "Recurso" },
        ].map((p) => (
          <g key={p.t}>
            <circle
              cx={p.cx}
              cy={p.cy}
              r="7"
              fill="#0B111F"
              stroke="url(#arcG)"
              strokeWidth="2.5"
            />
            <text
              x={p.cx}
              y={p.cy - 14}
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
              fontFamily="Manrope, sans-serif"
            >
              {p.t}
            </text>
          </g>
        ))}
        <g className="spin-slow" style={{ transformOrigin: "250px 210px" }}>
          <line
            x1="250"
            y1="210"
            x2="250"
            y2="50"
            stroke="rgba(59,130,246,0.55)"
            strokeWidth="1.2"
          />
        </g>
      </svg>
      <div className="absolute top-5 left-5 glass rounded-xl px-3 py-2 text-[11.5px] text-slate-200 flex items-center gap-2 fade-up fade-up-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Copiloto IA ativo
      </div>
      <div className="absolute bottom-5 left-5 glass rounded-xl px-3 py-2 text-[11.5px] text-slate-300 fade-up fade-up-4">
        Score de prontidão{" "}
        <span className="text-white font-semibold ml-1">88</span>
      </div>
      <div className="absolute top-5 right-5 glass rounded-xl px-3 py-2 text-[11.5px] text-slate-300 fade-up fade-up-3">
        Matching aderência{" "}
        <span className="text-emerald-300 font-semibold ml-1">94%</span>
      </div>
      <div className="absolute bottom-5 right-5 glass rounded-xl px-3 py-2 text-[11.5px] text-slate-300 fade-up fade-up-5">
        Recurso previsto{" "}
        <span className="text-amber-300 font-semibold ml-1">
          R$&nbsp;780.000
        </span>
      </div>
    </div>
  );
}

// ---------- Journey ribbon ----------
function JourneyRibbon() {
  const nodes = [
    { k: "Ideia", icon: <Lightbulb size={14} /> },
    { k: "Incubação (IA)", icon: <Wand2 size={14} /> },
    { k: "Submissão SLI", icon: <Landmark size={14} /> },
    { k: "Aprovação", icon: <CheckCircle2 size={14} /> },
    { k: "Matching (IA)", icon: <Radar size={14} /> },
    { k: "Aporte", icon: <Wallet size={14} /> },
    { k: "Execução", icon: <Trophy size={14} /> },
  ];
  return (
    <div className="relative glass rounded-2xl p-5 overflow-hidden">
      <div className="absolute inset-0 grid-bg-fine opacity-50" />
      <div className="relative flex items-center gap-3 overflow-x-auto thin-scroll">
        {nodes.map((n, i) => (
          <div key={n.k} className="flex items-center gap-2 shrink-0">
            <div
              className="shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl ring-soft"
              style={{ background: "rgba(15,23,42,0.6)" }}
            >
              <span
                className="w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0"
                style={{
                  background:
                    i === 1 || i === 4
                      ? "rgba(59,130,246,0.18)"
                      : "rgba(148,163,184,0.1)",
                  color: i === 1 || i === 4 ? "#93C5FD" : "#CBD5E1",
                  boxShadow:
                    i === 1 || i === 4
                      ? "0 0 0 1px rgba(59,130,246,0.4) inset"
                      : "0 0 0 1px rgba(148,163,184,0.14) inset",
                }}
              >
                {n.icon}
              </span>
              <div className="text-[12.5px] text-slate-200 font-medium whitespace-nowrap">
                {n.k}
              </div>
            </div>
            {i < nodes.length - 1 && (
              <svg
                width="44"
                height="10"
                viewBox="0 0 44 10"
                className="shrink-0"
              >
                <line
                  x1="0"
                  y1="5"
                  x2="44"
                  y2="5"
                  stroke="rgba(148,163,184,0.3)"
                  strokeDasharray="3 4"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Module card ----------
function ModuleCard({
  tone,
  chip,
  title,
  subtitle,
  bullets,
  icon,
  cta,
  onCta,
}: {
  tone: "blue" | "accent";
  chip: string;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: React.ReactNode;
  cta: string;
  onCta: () => void;
}) {
  const color = tone === "blue" ? C.primary : C.accent;
  return (
    <GlassCard hi className="relative overflow-hidden p-7 lume">
      <div
        className="absolute -top-28 -right-24 w-72 h-72 rounded-full blur-3xl opacity-40"
        style={{ background: color }}
      />
      <div className="relative flex items-center gap-2 mb-3">
        <Chip tone={tone === "blue" ? "blue" : "accent"}>{chip}</Chip>
        <AiChip />
      </div>
      <div className="relative flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              tone === "blue"
                ? "rgba(59,130,246,0.14)"
                : "rgba(16,217,163,0.14)",
            color: tone === "blue" ? "#93C5FD" : "#6EE7B7",
            boxShadow: `0 0 0 1px ${tone === "blue" ? "rgba(59,130,246,0.4)" : "rgba(16,217,163,0.4)"} inset`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-[26px] text-white font-semibold leading-tight">
            {title}
          </h3>
          <p className="text-slate-300 mt-1.5 text-[14px]">{subtitle}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2.5 text-[13.5px] text-slate-300">
            <Check
              size={15}
              className="mt-0.5 shrink-0"
              style={{ color: tone === "blue" ? "#60A5FA" : "#34D399" }}
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Button
          variant={tone === "blue" ? "primary" : undefined}
          iconRight={<ArrowRight size={16} />}
          onClick={onCta}
        >
          {cta}
        </Button>
      </div>
    </GlassCard>
  );
}

// ---------- AI mini showcase ----------
function MiniAiShowcase() {
  return (
    <div className="relative rounded-2xl glass p-5 overflow-hidden">
      <div className="absolute inset-0 grid-bg-fine opacity-60" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3B82F6,#10D9A3)" }}
          >
            <Sparkles size={14} color="#0B111F" strokeWidth={2.5} />
          </div>
          <div className="text-[12.5px] text-slate-300">Copiloto IA</div>
          <span className="ml-auto text-[10.5px] text-slate-500 tracking-widest uppercase">
            ao vivo
          </span>
        </div>
        <div className="space-y-2.5">
          {[
            "Seu projeto tem 88/100 de prontidão — apto para submissão oficial.",
            "Identifiquei 6 incentivadores com aderência alta à sua tese.",
            "Melhor aderência: Grupo Meridian, 94/100.",
          ].map((t, i) => (
            <div
              key={i}
              className="rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[12.5px] text-slate-200 fade-up"
              style={{
                background: "rgba(15,23,42,0.9)",
                boxShadow: "0 0 0 1px rgba(148,163,184,0.1) inset",
                animationDelay: `${i * 120}ms`,
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { k: "Prontidão", v: 88 },
            { k: "Aderência", v: 94 },
            { k: "Risco", v: 12 },
          ].map((s) => (
            <div key={s.k} className="rounded-lg p-2.5 ring-soft">
              <div className="text-[10.5px] text-slate-500 uppercase tracking-widest">
                {s.k}
              </div>
              <div className="font-display text-lg text-white font-semibold mt-0.5">
                {s.v}
              </div>
              <div className="rail mt-1">
                <span style={{ width: `${s.v}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// LANDING PAGE PRINCIPAL
// =====================================================================
export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(1200px 600px at 50% -10%, rgba(59,130,246,0.12), transparent 70%), linear-gradient(180deg, #070B14 0%, #0B111F 100%)`,
        color: "#F1F5F9",
        fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <main className="relative overflow-hidden">
        {/* ── HERO ── */}
        <section className="relative">
          <div className="absolute inset-0 grid-bg opacity-60" />
          <div className="absolute inset-0 glow-blue" />
          <div className="absolute inset-0 glow-accent" />
          <TrajectoryBg />
          <div className="relative max-w-[1280px] mx-auto px-6 pt-16 pb-20">
            <div className="fade-up">
              <Chip tone="accent" icon={<Dumbbell size={12} />}>
                Lei de Incentivo ao Esporte · plataforma inteligente
              </Chip>
            </div>
            <div className="grid lg:grid-cols-12 gap-12 mt-8 items-center">
              <div className="lg:col-span-7">
                <h1
                  className="font-display font-semibold text-[58px] leading-[1.02] tracking-tight text-white fade-up fade-up-1"
                  style={{ textWrap: "balance" } as React.CSSProperties}
                >
                  Apoio inteligente,
                  <br />
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(120deg, #60A5FA 10%, #10D9A3 55%, #F59E0B 95%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    do início ao recurso.
                  </span>
                </h1>
                <p className="mt-6 text-slate-300 text-[17px] leading-relaxed max-w-[620px] fade-up fade-up-2">
                  O INCENTIVA conduz proponentes e incentivadores ao longo de
                  toda a jornada da Lei de Incentivo ao Esporte — da ideia
                  estruturada ao recurso depositado — com uma IA copiloto que
                  acompanha, qualifica e conecta.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3 fade-up fade-up-3">
                  {user ? (
                    <Button
                      size="lg"
                      icon={<Rocket size={16} />}
                      iconRight={<ArrowRight size={16} />}
                      onClick={() => navigate("/dashboard")}
                    >
                      Ir para o dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        icon={<Rocket size={16} />}
                        iconRight={<ArrowRight size={16} />}
                        onClick={() => navigate("/register")}
                      >
                        Começar agora
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        icon={<FileText size={16} />}
                        onClick={() => navigate("/login")}
                      >
                        Já tenho projeto
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        icon={<Building2 size={16} />}
                        onClick={() => navigate("/login")}
                      >
                        Sou incentivador
                      </Button>
                    </>
                  )}
                </div>
                <div className="mt-10 grid grid-cols-3 gap-5 max-w-[620px] fade-up fade-up-4">
                  {[
                    { k: "R$ 420 Mi+", v: "em projetos apoiados" },
                    { k: "1.820", v: "projetos estruturados" },
                    { k: "94%", v: "de aderência média" },
                  ].map((s) => (
                    <div
                      key={s.k}
                      className="rounded-xl p-4 glass"
                      style={{
                        boxShadow: "0 0 0 1px rgba(148,163,184,0.12) inset",
                      }}
                    >
                      <div className="font-display text-2xl text-white font-semibold">
                        {s.k}
                      </div>
                      <div className="text-[12px] text-slate-400 mt-1">
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 fade-up fade-up-3">
                <HeroVisual />
              </div>
            </div>
          </div>
        </section>

        {/* ── JORNADA ── */}
        <section className="relative max-w-[1280px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <SectionLabel icon={<Compass size={12} />}>
                Fluxo do início ao recurso
              </SectionLabel>
              <h2 className="font-display text-3xl text-white font-semibold mt-2">
                Uma única trajetória, inteligência o tempo todo
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <AiChip>IA em toda a jornada</AiChip>
            </div>
          </div>
          <JourneyRibbon />
        </section>

        {/* ── MÓDULOS ── */}
        <section className="relative max-w-[1280px] mx-auto px-6 pb-16">
          <div className="grid lg:grid-cols-2 gap-5">
            <ModuleCard
              tone="blue"
              chip="Módulo A"
              title="Incubação do Projeto"
              subtitle="Da ideia ao projeto pronto para submissão oficial."
              bullets={[
                "IA estrutura objetivo, justificativa, metas, orçamento e público.",
                "Score de prontidão em tempo real e checklist de maturidade.",
                "Validação técnica e organizacional do proponente.",
                "Preparação assistida para cadastro no SLI.",
              ]}
              icon={<Lightbulb size={20} />}
              cta="Explorar Módulo A"
              onCta={() => navigate(user ? "/modulo-a" : "/register")}
            />
            <ModuleCard
              tone="accent"
              chip="Módulo B"
              title="Captação Inteligente"
              subtitle="Do projeto aprovado ao recurso depositado."
              bullets={[
                "IA analisa perfis de projeto e de incentivador e gera matching explicável.",
                "Score de aderência com fatores de compatibilidade visíveis.",
                "Experiência para o incentivador escolher, decidir e apoiar.",
                "Aporte simulado com comprovante, recibo e confirmação.",
              ]}
              icon={<Radar size={20} />}
              cta="Explorar Módulo B"
              onCta={() => navigate(user ? "/dashboard" : "/register")}
            />
          </div>
        </section>

        {/* ── IA COPILOTO ── */}
        <section className="relative max-w-[1280px] mx-auto px-6 pb-20">
          <GlassCard className="lume relative overflow-hidden p-8 md:p-10">
            <div className="absolute inset-0 grid-bg-fine opacity-60" />
            <div className="absolute inset-0 glow-blue opacity-50" />
            <div className="relative grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <SectionLabel icon={<Sparkles size={12} />}>
                  IA Copiloto
                </SectionLabel>
                <h3 className="font-display text-[32px] text-white font-semibold mt-2 leading-tight">
                  Uma IA que não deixa o proponente sozinho.
                </h3>
                <p className="text-slate-300 mt-4 max-w-[560px] leading-relaxed">
                  Do primeiro rascunho ao recurso creditado, o copiloto lê,
                  qualifica, sugere, explica e conecta. Toda recomendação mostra{" "}
                  <em>por que</em> foi feita.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                  {[
                    {
                      icon: <Wand2 size={14} />,
                      t: "Estruturação assistida",
                      d: "Sugere texto, aponta lacunas e orienta a completude.",
                    },
                    {
                      icon: <Activity size={14} />,
                      t: "Score de prontidão",
                      d: "Mede e evolui a maturidade do projeto em tempo real.",
                    },
                    {
                      icon: <Radar size={14} />,
                      t: "Matching explicável",
                      d: "Mostra os fatores que sustentam cada recomendação.",
                    },
                    {
                      icon: <Shield size={14} />,
                      t: "Acompanhamento contínuo",
                      d: "Acompanha até o recurso chegar e a execução começar.",
                    },
                  ].map((f) => (
                    <div
                      key={f.t}
                      className="flex gap-3 rounded-xl p-3.5 ring-soft"
                    >
                      <span
                        className="shrink-0 w-8 h-8 rounded-lg inline-flex items-center justify-center"
                        style={{
                          background: "rgba(59,130,246,0.15)",
                          color: "#93C5FD",
                          boxShadow: "0 0 0 1px rgba(59,130,246,0.3) inset",
                        }}
                      >
                        {f.icon}
                      </span>
                      <div>
                        <div className="text-[13.5px] text-slate-100 font-medium">
                          {f.t}
                        </div>
                        <div className="text-[12px] text-slate-400 mt-0.5">
                          {f.d}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5">
                <MiniAiShowcase />
              </div>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );
}
