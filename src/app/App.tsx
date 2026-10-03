import { useTheme } from '@/shared/lib/theme'

/** Placeholder shell. The tab bar and routes land in their own issues. */
export function App() {
  const { theme, palette, toggleTheme, setPalette } = useTheme()

  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col gap-6 px-5 py-8">
      <header>
        <p className="text-tx-2 text-xs tracking-widest uppercase">MyFinTracker</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Проект собран</h1>
      </header>

      <section className="border-line bg-card rounded-xl border p-5 shadow-[var(--sh-2)]">
        <p className="text-tx-2 text-xs font-semibold tracking-wider uppercase">Общий баланс</p>
        <p className="num mt-2 text-4xl font-extrabold tracking-tight">2 847,30</p>
        <p className="text-up mt-1 text-sm">Пример данных — экраны впереди</p>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={toggleTheme}
          className="bg-accent text-accent-ink rounded-md px-4 py-2.5 text-sm font-bold"
        >
          Тема: {theme}
        </button>
        {(['indigo', 'forest', 'ember'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPalette(p)}
            className="border-line bg-card rounded-md border px-4 py-2.5 text-sm font-semibold"
            style={{ outline: palette === p ? '2px solid var(--accent)' : undefined }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
