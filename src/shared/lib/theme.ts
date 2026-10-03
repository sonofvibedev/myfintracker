import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type Palette = 'indigo' | 'forest' | 'ember'

const KEY = 'mft.appearance'

type Appearance = { theme: Theme; palette: Palette }

let state: Appearance = read()
const listeners = new Set<() => void>()

function read(): Appearance {
  const fallback: Appearance = { theme: 'system', palette: 'indigo' }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Appearance>
    return {
      theme: parsed.theme ?? fallback.theme,
      palette: parsed.palette ?? fallback.palette,
    }
  } catch {
    // Private mode, blocked storage, or corrupt JSON — defaults are fine.
    return fallback
  }
}

function commit(next: Appearance) {
  state = next
  apply(next)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Not being able to persist the choice must not break the app.
  }
  listeners.forEach((l) => l())
}

function apply({ theme, palette }: Appearance) {
  const el = document.documentElement
  if (theme === 'system') el.removeAttribute('data-theme')
  else el.dataset.theme = theme
  el.dataset.palette = palette
}

apply(state)

export function useTheme() {
  const current = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )

  return {
    theme: current.theme,
    palette: current.palette,
    setTheme: (theme: Theme) => commit({ ...state, theme }),
    setPalette: (palette: Palette) => commit({ ...state, palette }),
    toggleTheme: () => {
      const order: Theme[] = ['system', 'light', 'dark']
      const next = order[(order.indexOf(state.theme) + 1) % order.length]!
      commit({ ...state, theme: next })
    },
  }
}
