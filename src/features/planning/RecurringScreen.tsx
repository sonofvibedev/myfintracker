import { useMemo, useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Screen } from '@/shared/ui/Screen'
import { Button, Field, Select, Sheet } from '@/shared/ui/kit'
import { useAccounts, useCategories, useSettings } from '@/shared/lib/queries'
import { formatMoney, parseAmount, toMajor } from '@/shared/lib/money'
import { dayLabel } from '@/shared/lib/dates'
import {
  deleteRecurring,
  FREQUENCY_LABELS,
  isDue,
  listRecurring,
  nextDate,
  postRule,
  saveRecurring,
} from '@/shared/lib/recurring'
import type { Frequency, Recurring, TxType } from '@/shared/lib/types'

const localDate = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)

const blank = {
  name: '',
  amount: '',
  type: 'expense' as TxType,
  accountId: '',
  categoryId: '',
  frequency: 'month' as Frequency,
  interval: '1',
  nextRunAt: localDate(new Date()),
  autoPost: false,
}

export function RecurringScreen() {
  const queryClient = useQueryClient()
  const { data: rules = [] } = useQuery({ queryKey: ['recurring'], queryFn: listRecurring })
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: settings } = useSettings()

  const base = settings?.baseCurrency ?? 'BYN'
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Recurring | null>(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')

  const refresh = () => queryClient.invalidateQueries()

  const openSheet = (rule?: Recurring) => {
    setEditing(rule ?? null)
    setForm(
      rule
        ? {
            name: rule.name,
            amount: String(toMajor(rule.template.amount)).replace('.', ','),
            type: rule.template.type,
            accountId: rule.template.accountId,
            categoryId: rule.template.categoryId ?? '',
            frequency: rule.frequency,
            interval: String(rule.interval),
            nextRunAt: rule.nextRunAt.slice(0, 10),
            autoPost: rule.autoPost,
          }
        : { ...blank, accountId: accounts[0]?.id ?? '' },
    )
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    const amount = parseAmount(form.amount)
    if (!form.name.trim()) return setError('Введи название')
    if (amount === null || amount <= 0) return setError('Сумма должна быть больше нуля')
    if (!form.accountId) return setError('Выбери счёт')

    const account = accountById.get(form.accountId)
    const currency = account?.currency ?? base
    const rate = settings?.rates[currency] ?? 1

    await saveRecurring({
      ...editing,
      name: form.name.trim(),
      frequency: form.frequency,
      interval: Math.max(1, Number(form.interval) || 1),
      nextRunAt: new Date(`${form.nextRunAt}T09:00:00`).toISOString(),
      autoPost: form.autoPost,
      active: editing?.active ?? true,
      template: {
        type: form.type,
        accountId: form.accountId,
        toAccountId: null,
        categoryId: form.categoryId || null,
        amount,
        currency,
        amountBase: Math.round(amount * rate),
        rate,
        note: form.name.trim(),
      },
    })
    await refresh()
    setOpen(false)
  }

  return (
    <Screen title="Регулярные" kicker="Планирование">
      {rules.length === 0 && (
        <p className="text-tx-2 py-10 text-center text-sm">
          Регулярных платежей пока нет.{'\n'}Подписки, аренда, зарплата — то, что повторяется.
        </p>
      )}

      <ul className="flex flex-col gap-2.5">
        {rules.map((rule, i) => {
          const due = isDue(rule)
          const category = rule.template.categoryId
            ? categoryById.get(rule.template.categoryId)
            : undefined

          return (
            <motion.li
              key={rule.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.33, 1, 0.3, 1] }}
              className="bg-card rounded-lg border p-4 shadow-[var(--sh-2)]"
              style={{ borderColor: due ? 'var(--accent)' : 'var(--line)', opacity: rule.active ? 1 : 0.55 }}
            >
              <button
                type="button"
                onClick={() => openSheet(rule)}
                className="flex w-full cursor-pointer items-center gap-3 text-left"
              >
                <span
                  className="grid h-10 w-10 flex-none place-items-center rounded-md text-lg"
                  style={{
                    background: `color-mix(in srgb, ${category?.color ?? 'var(--accent)'} 16%, transparent)`,
                  }}
                >
                  {category?.icon ?? '🔁'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold">{rule.name}</span>
                  <span className="text-tx-2 text-[11.5px]">
                    каждые {rule.interval}{' '}
                    {FREQUENCY_LABELS[rule.frequency].toLowerCase()} ·{' '}
                    {rule.active ? dayLabel(rule.nextRunAt) : 'на паузе'}
                    {rule.autoPost && rule.active && ' · сам'}
                  </span>
                </span>
                <span
                  className="num text-[15px] font-bold tracking-tight"
                  style={{ color: rule.template.type === 'income' ? 'var(--up)' : undefined }}
                >
                  {formatMoney(rule.template.amount, rule.template.currency)}
                </span>
              </button>

              {due && rule.active && !rule.autoPost && (
                <div className="mt-3">
                  <Button
                    onClick={async () => {
                      await postRule(rule)
                      await refresh()
                    }}
                  >
                    Записать операцию
                  </Button>
                </div>
              )}
            </motion.li>
          )
        })}
      </ul>

      <div className="mt-4">
        <Button onClick={() => openSheet()}>Новый регулярный платёж</Button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? 'Платёж' : 'Новый платёж'}>
        <div className="flex flex-col gap-4">
          <Field
            label="Название"
            placeholder="Мобильная связь"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Сумма"
              inputMode="decimal"
              placeholder="25,00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Select
              label="Тип"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TxType, categoryId: '' })}
            >
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </Select>
          </div>
          <Select
            label="Счёт"
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
          >
            <option value="">Выбери счёт</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name} · {a.currency}
              </option>
            ))}
          </Select>
          <Select
            label="Категория"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Без категории</option>
            {categories
              .filter((c) => (form.type === 'income' ? c.kind === 'income' : c.kind === 'expense'))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
          </Select>
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Каждые"
              type="number"
              min={1}
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
            />
            <Select
              label="Период"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
            >
              {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </Select>
          </div>
          <Field
            label="Следующий раз"
            type="date"
            value={form.nextRunAt}
            onChange={(e) => setForm({ ...form, nextRunAt: e.target.value })}
          />

          <label className="border-line bg-card-2 flex cursor-pointer items-center gap-3 rounded-md border p-3.5">
            <input
              type="checkbox"
              checked={form.autoPost}
              onChange={(e) => setForm({ ...form, autoPost: e.target.checked })}
              className="accent-accent h-5 w-5"
            />
            <span>
              <span className="block text-[13.5px] font-semibold">Записывать автоматически</span>
              <span className="text-tx-2 text-[11.5px]">
                Иначе платёж будет ждать подтверждения в этом списке
              </span>
            </span>
          </label>

          {error && <p className="text-down text-[13px] font-semibold">{error}</p>}

          <Button onClick={submit}>{editing ? 'Сохранить' : 'Создать'}</Button>

          {editing && (
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="ghost"
                onClick={async () => {
                  await saveRecurring({ ...editing, active: !editing.active })
                  await refresh()
                  setOpen(false)
                }}
              >
                {editing.active ? 'На паузу' : 'Включить'}
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await deleteRecurring(editing.id)
                  await refresh()
                  setOpen(false)
                }}
              >
                Удалить
              </Button>
            </div>
          )}
        </div>
      </Sheet>

      <p className="text-tx-2 mt-4 text-center text-[11.5px]">
        Пропущенные платежи записываются по одному за каждый пропущенный период, а не одной суммой.
        Следующий после сегодняшнего —{' '}
        {dayLabel(nextDate(new Date(), 'month', 1).toISOString())}.
      </p>
    </Screen>
  )
}
