import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Screen } from '@/shared/ui/Screen'
import { Button, Select } from '@/shared/ui/kit'
import { useTheme, type Palette, type Theme } from '@/shared/lib/theme'
import { useSaveSettings, useSettings } from '@/shared/lib/queries'
import { applyImport, exportCsv, exportJson, previewImport, type ImportReport } from '@/shared/lib/backup'
import { currencyOptions, refreshRates } from '@/shared/lib/fx'

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

const STORE_NAMES: Record<string, string> = {
  accounts: 'счета',
  categories: 'категории',
  transactions: 'операции',
  budgets: 'бюджеты',
  goals: 'цели',
  recurring: 'регулярные',
}

export function SettingsScreen() {
  const { theme, palette, setTheme, setPalette } = useTheme()
  const { data: settings } = useSettings()
  const saveSettings = useSaveSettings()
  const queryClient = useQueryClient()

  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ text: string; report: ImportReport } | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const currencies = currencyOptions(settings?.rates ?? { BYN: 1 })

  const onFile = async (file: File) => {
    setMessage('')
    try {
      const text = await file.text()
      setPending({ text, report: await previewImport(text) })
    } catch (e) {
      setPending(null)
      setMessage(e instanceof Error ? e.message : 'Не удалось прочитать файл')
    }
  }

  const confirmImport = async () => {
    if (!pending) return
    setBusy(true)
    try {
      const report = await applyImport(pending.text)
      await queryClient.invalidateQueries()
      setMessage(`Импортировано записей: ${report.total}`)
      setPending(null)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Импорт не удался')
    } finally {
      setBusy(false)
    }
  }

  const updateRates = async () => {
    setBusy(true)
    setMessage('')
    const before = settings?.ratesUpdatedAt
    const rates = await refreshRates()
    await queryClient.invalidateQueries()
    setBusy(false)
    setMessage(
      Object.keys(rates).length > 1
        ? `Курсы на ${new Date().toLocaleDateString('ru-BY')}: ${Object.keys(rates).length} валют`
        : before
          ? 'Не удалось обновить, оставил прошлые курсы'
          : 'Курсы недоступны — проверь интернет',
    )
  }

  return (
    <Screen title="Настройки" kicker="Оформление">
      <nav className="mb-4 flex flex-col gap-2">
        {[
          { to: '/accounts', label: 'Счета', hint: 'Кошельки, карты, накопления' },
          { to: '/categories', label: 'Категории', hint: 'Иконки, цвета, вложенность' },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="border-line bg-card flex items-center justify-between rounded-lg border p-4 shadow-[var(--sh-2)] transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.985]"
          >
            <span>
              <span className="block text-[14.5px] font-semibold">{l.label}</span>
              <span className="text-tx-2 text-[11.5px]">{l.hint}</span>
            </span>
            <span className="text-tx-2">›</span>
          </Link>
        ))}
      </nav>

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

      <section className="border-line bg-card mt-3 rounded-xl border p-4 shadow-[var(--sh-2)]">
        <h2 className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">Валюта</h2>
        <div className="mt-2">
          <Select
            label="Основная валюта"
            value={settings?.baseCurrency ?? 'BYN'}
            onChange={(e) => saveSettings.mutate([{ baseCurrency: e.target.value }])}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-tx-2 mt-2 text-[11.5px]">
          {settings?.ratesUpdatedAt
            ? `Курсы НБРБ от ${settings.ratesUpdatedAt}`
            : 'Курсы ещё не загружены'}
        </p>
        <div className="mt-3">
          <Button variant="ghost" onClick={updateRates} disabled={busy}>
            Обновить курсы
          </Button>
        </div>
      </section>

      <section className="border-line bg-card mt-3 rounded-xl border p-4 shadow-[var(--sh-2)]">
        <h2 className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">
          Резервная копия
        </h2>
        <p className="text-tx-2 mt-2 text-[12.5px]">
          Данные хранятся только в этом браузере. Экспорт — единственный способ их не потерять.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={exportJson}>
            Экспорт JSON
          </Button>
          <Button variant="ghost" onClick={exportCsv}>
            Экспорт CSV
          </Button>
        </div>

        <div className="mt-2">
          <Button variant="ghost" onClick={() => fileInput.current?.click()}>
            Импорт из JSON
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onFile(file)
              e.target.value = ''
            }}
          />
        </div>

        {pending && (
          <div className="border-line bg-card-2 mt-3 rounded-md border p-3">
            <p className="text-[13px] font-bold">Что изменится</p>
            <ul className="mt-2 flex flex-col gap-1 text-[12.5px]">
              {Object.keys(STORE_NAMES).map((store) => {
                const added = pending.report.added[store] ?? 0
                const updated = pending.report.updated[store] ?? 0
                if (added + updated === 0) return null
                return (
                  <li key={store} className="flex justify-between">
                    <span className="text-tx-2">{STORE_NAMES[store]}</span>
                    <span className="num">
                      +{added} новых, {updated} обновится
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="text-tx-2 mt-2 text-[11.5px]">
              Ничего не удаляется: записи с совпадающим id заменяются, остальные добавляются.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={confirmImport} disabled={busy}>
                Импортировать
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>
                Отмена
              </Button>
            </div>
          </div>
        )}

        {message && <p className="mt-3 text-[12.5px] font-semibold">{message}</p>}
      </section>
    </Screen>
  )
}
