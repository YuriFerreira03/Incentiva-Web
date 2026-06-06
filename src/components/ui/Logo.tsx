import { cn } from '../../utils/cn'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Mostra apenas o símbolo, sem o texto */
  symbolOnly?: boolean
  /** Cor do texto — útil em fundo claro */
  textClassName?: string
}

const sizes = {
  sm: { symbol: 28, text: 'text-lg', gap: 'gap-2' },
  md: { symbol: 36, text: 'text-2xl', gap: 'gap-2.5' },
  lg: { symbol: 52, text: 'text-4xl', gap: 'gap-3' }
}

export function Logo({
  className,
  size = 'md',
  symbolOnly = false,
  textClassName = 'text-white'
}: Props) {
  const s = sizes[size]

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <LogoSymbol size={s.symbol} />
      {!symbolOnly && (
        <span
          className={cn(
            'font-bold tracking-wide',
            s.text,
            textClassName
          )}
        >
          Incentiva
        </span>
      )}
    </div>
  )
}

/** Símbolo isolado — nós conectados subindo (jornada do início ao recurso) */
export function LogoSymbol({ size = 36 }: { size?: number }) {
  const id = 'incentiva-line'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Incentiva"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="64" x2="64" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0EA5E9" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <line x1="8" y1="48" x2="28" y2="35" stroke={`url(#${id})`} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="28" y1="35" x2="42" y2="40" stroke={`url(#${id})`} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="42" y1="40" x2="56" y2="16" stroke={`url(#${id})`} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="8" cy="48" r="5" fill="#0EA5E9" />
      <circle cx="28" cy="35" r="5" fill="#06B6D4" />
      <circle cx="42" cy="40" r="5" fill="#14C8B8" />
      <circle cx="56" cy="16" r="7.5" fill="#10B981" />
    </svg>
  )
}
