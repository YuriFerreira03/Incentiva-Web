import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  FolderOpen,
  LogOut,
  ChevronDown,
  Rocket,
  Settings,
  Menu,
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu clicando fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Fecha o menu ao navegar
  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070B14]/90 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 shrink-0"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="hdr-lg"
                x1="0"
                y1="64"
                x2="64"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#0EA5E9" />
                <stop offset="0.5" stopColor="#06B6D4" />
                <stop offset="1" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <line
              x1="8"
              y1="48"
              x2="28"
              y2="35"
              stroke="url(#hdr-lg)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="28"
              y1="35"
              x2="42"
              y2="40"
              stroke="url(#hdr-lg)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="42"
              y1="40"
              x2="56"
              y2="16"
              stroke="url(#hdr-lg)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="48" r="5" fill="#0EA5E9" />
            <circle cx="28" cy="35" r="5" fill="#06B6D4" />
            <circle cx="42" cy="40" r="5" fill="#14C8B8" />
            <circle cx="56" cy="16" r="7.5" fill="#10B981" />
          </svg>
          <span
            className="font-semibold tracking-tight text-[17px] text-white"
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Incentiva
          </span>
        </button>

        {/* Nav central — só desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: "Plataforma", path: "/" },
            { label: "Módulo A", path: "/modulo-a" },
            { label: "Meus projetos", path: "/meus-projetos" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-white bg-white/8"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Direita */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Usuário não logado */}
          {!user && (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-[13px] text-slate-400 hover:text-white transition-colors hidden sm:block"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                }}
              >
                Começar
              </button>
            </>
          )}

          {/* Usuário logado — menu dropdown */}
          {user && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuAberto((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
              >
                {/* Avatar */}
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                    }}
                  >
                    {initials}
                  </div>
                )}
                <span className="text-[13px] text-slate-300 hidden sm:block max-w-[120px] truncate">
                  {user.name?.split(" ")[0] ?? user.email}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${menuAberto ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown */}
              {menuAberto && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                  style={{
                    background:
                      "linear-gradient(180deg, #0F172A 0%, #0B1120 100%)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  }}
                >
                  {/* Info do usuário */}
                  <div className="px-4 py-3 border-b border-white/8">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #06B6D4, #3B82F6)",
                          }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-white truncate">
                          {user.name ?? "Usuário"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Itens do menu */}
                  <div className="py-1.5">
                    <MenuSection label="Projetos" />
                    <MenuItem
                      icon={<Rocket size={15} />}
                      label="Módulo A — Novo projeto"
                      onClick={() => navigate("/modulo-a")}
                      highlight
                    />
                    <MenuItem
                      icon={<FolderOpen size={15} />}
                      label="Meus projetos"
                      onClick={() => navigate("/meus-projetos")}
                    />

                    <div className="my-1.5 border-t border-white/8" />
                    <MenuSection label="Conta" />
                    <MenuItem
                      icon={<User size={15} />}
                      label="Meu perfil"
                      onClick={() => navigate("/perfil")}
                    />
                    <MenuItem
                      icon={<Settings size={15} />}
                      label="Configurações"
                      onClick={() => navigate("/perfil?tab=seguranca")}
                    />

                    <div className="my-1.5 border-t border-white/8" />
                    <MenuItem
                      icon={<LogOut size={15} />}
                      label="Sair da conta"
                      onClick={signOut}
                      danger
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menu mobile */}
          <button className="md:hidden text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Sub-componentes do menu ──────────────────────────────────────────────────
function MenuSection({ label }: { label: string }) {
  return (
    <div className="px-3 py-1">
      <span className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
        {label}
      </span>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  highlight,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors text-left ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : highlight
            ? "text-cyan-300 hover:bg-cyan-500/10"
            : "text-slate-300 hover:bg-white/5"
      }`}
    >
      <span
        className={
          danger
            ? "text-red-400"
            : highlight
              ? "text-cyan-400"
              : "text-slate-500"
        }
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
