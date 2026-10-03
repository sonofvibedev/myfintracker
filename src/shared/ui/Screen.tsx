import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { GearIcon } from './icons'

type Props = {
  title: string
  kicker?: string
  settings?: boolean
  children?: ReactNode
}

export function Screen({ title, kicker, settings = false, children }: Props) {
  return (
    <>
      <header className="flex items-center justify-between gap-3 pt-7 pb-4">
        <div>
          {kicker && <p className="text-tx-2 text-xs tracking-widest uppercase">{kicker}</p>}
          <h1 className="mt-0.5 text-[21px] font-extrabold tracking-tight">{title}</h1>
        </div>
        {settings && (
          <Link
            to="/settings"
            aria-label="Настройки"
            className="border-line bg-card text-tx grid h-[38px] w-[38px] place-items-center rounded-md border shadow-[var(--sh-2)] transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-90"
          >
            <GearIcon />
          </Link>
        )}
      </header>
      {children}
    </>
  )
}

export function Placeholder({ text }: { text: string }) {
  return <p className="text-tx-2 py-16 text-center text-sm whitespace-pre-line">{text}</p>
}
