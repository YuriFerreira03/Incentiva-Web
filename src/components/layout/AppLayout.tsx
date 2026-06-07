import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { AppFooter } from './AppFooter'

interface Props {
  children: ReactNode
  /** Remove o footer em páginas de fluxo longo (ex: Módulo A) */
  noFooter?: boolean
}

export function AppLayout({ children, noFooter }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #070B14 0%, #0B111F 100%)',
        color: '#F1F5F9',
      }}
    >
      <AppHeader />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!noFooter && <AppFooter />}
    </div>
  )
}
