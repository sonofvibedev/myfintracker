import { Screen } from '@/shared/ui/Screen'
import { useTheme, type Palette, type Theme } from '@/shared/lib/theme'

const themes: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

const palettes: { value: Palette; label: string }[] = [
  { value: 'indigo', label: 'Индиго' },
  { value: 'forest', label: 'Лес' },
  { value: 'ember', label: 'Уголь' },
]

export function SettingsScreen() {
  const { theme, palette, setTheme, setPalette } = useTheme()

  return (
    <Screen title="Настройки" kicker="Оформление">
      <section className="border-line bg-card rounded-xl border p-4 shadow-[var(--sh-2)]">
        <h2 className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">Тема</h2>
        <div className="bg-card-2 mt-2 grid grid-cols-3 gap-1.5 rounded-md p-1">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              aria-pressed={theme === t.value}
              className={`cursor-pointer rounded-sm px-2 py-2.5 text-[12.5px] font-bold transition-all duration-[var(--dur)] [transition-timing-function:var(--ease)] ${
                theme === t.value ? 'bg-card text-tx shadow-[var(--sh-2)]' : 'text-tx-2'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <h2 className="text-tx-2 mt-5 text-[11.5px] font-semibold tracking-wider uppercase">
          Палитра
        </h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {palettes.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPalette(p.value)}
              aria-pressed={palette === p.value}
              data-palette={p.value}
              className={`border-line bg-card flex cursor-pointer flex-col items-center gap-2 rounded-md border p-3 text-[12.5px] font-semibold transition-all duration-[var(--dur)] [transition-timing-function:var(--ease)] ${
                palette === p.value ? 'outline-accent outline-2' : ''
              }`}
            >
              <span className="flex gap-1">
                {['var(--accent)', 'var(--accent-2)', 'var(--cat-3)', 'var(--cat-5)'].map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />
                ))}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </section>
    </Screen>
  )
}
