export function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070B14]/90 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-600">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="ft2-lg"
                x1="0"
                y1="64"
                x2="64"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#0EA5E9" />
                <stop offset="1" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <line
              x1="8"
              y1="48"
              x2="28"
              y2="35"
              stroke="url(#ft2-lg)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="28"
              y1="35"
              x2="42"
              y2="40"
              stroke="url(#ft2-lg)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="42"
              y1="40"
              x2="56"
              y2="16"
              stroke="url(#ft2-lg)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="48" r="5" fill="#0EA5E9" />
            <circle cx="28" cy="35" r="5" fill="#06B6D4" />
            <circle cx="42" cy="40" r="5" fill="#14C8B8" />
            <circle cx="56" cy="16" r="7.5" fill="#10B981" />
          </svg>
          <span
            className="text-slate-500 font-medium"
            style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
          >
            Incentiva
          </span>
        </div>
        <div>© 2026 INCENTIVA · Lei de Incentivo ao Esporte nº 11.438/2006</div>
      </div>
    </footer>
  );
}
