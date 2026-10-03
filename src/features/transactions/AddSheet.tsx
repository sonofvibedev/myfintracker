import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { CloseIcon } from '@/shared/ui/icons'
import { Field, Select } from '@/shared/ui/kit'
import { useAccounts, useCategories, useSaveTransaction, useSettings } from '@/shared/lib/queries'
import { parseAmount } from '@/shared/lib/money'
import type { TxType } from '@/shared/lib/types'

const TYPES: { value: TxType; label: string; color: string }[] = [
  { value: 'expense', label: 'Расход', color: 'var(--down)' },
  { value: 'income', label: 'Доход', color: 'var(--up)' },
  { value: 'transfer', label: 'Перевод', color: 'var(--accent)' },
]

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del']

const localDate = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)

export function AddSheet() {
  const navigate = useNavigate()
  const save = useSaveTransaction()
  const { data: accounts = [] } = useAccounts()
  const { data: settings } = useSettings()

  const [type, setType] = useState<TxType>('expense')
  const { data: categories = [] } = useCategories(type === 'income' ? 'income' : 'expense')

  const [raw, setRaw] = useState('')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(localDate(new Date()))
  const [note, setNote] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const account = accounts.find((a) => a.id === accountId) ?? accounts[0]
  const currency = account?.currency ?? settings?.baseCurrency ?? 'BYN'

  // The first category of the current kind is a sensible default, but only
  // until the person picks one.
  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? categories[0],
    [categories, categoryId],
  )

  const press = (key: string) => {
    setError('')
    setRaw((prev) => {
      if (key === 'del') return prev.slice(0, -1)
      if (key === ',') return prev.includes(',') || prev === '' ? prev : prev + ','
      const [, decimals] = prev.split(',')
      if (decimals !== undefined && decimals.length >= 2) return prev
      if (prev.replace(',', '').length >= 9) return prev
      return prev + key
    })
  }

  const submit = async () => {
    const amount = parseAmount(raw)
    if (amount === null || amount <= 0) return setError('Введи сумму больше нуля')
    if (!account) return setError('Сначала создай счёт')
    if (type === 'transfer') {
      if (!toAccountId) return setError('Выбери счёт назначения')
      if (toAccountId === account.id) return setError('Счета должны отличаться')
    } else if (!activeCategory) {
      return setError('Выбери категорию')
    }

    const rate = settings?.rates[currency] ?? 1
    const happenedAt = new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString()

    await save.mutateAsync([
      {
        type,
        accountId: account.id,
        toAccountId: type === 'transfer' ? toAccountId : null,
        categoryId: type === 'transfer' ? null : (activeCategory?.id ?? null),
        amount,
        currency,
        amountBase: Math.round(amount * rate),
        rate,
        happenedAt,
        note: note.trim(),
      },
    ])

    setSaved(true)
    setTimeout(() => navigate('/transactions'), 550)
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 36 }}
      className="bg-bg fixed inset-0 z-30 mx-auto flex max-w-[430px] flex-col overflow-y-auto px-[18px]"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <header className="flex items-center justify-between pt-7 pb-4">
        <h1 className="text-[21px] font-extrabold tracking-tight">Новая операция</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Закрыть"
          className="border-line bg-card text-tx grid h-[38px] w-[38px] cursor-pointer place-items-center rounded-md border transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-90"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="bg-card-2 grid grid-cols-3 gap-1.5 rounded-md p-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setType(t.value)
              setCategoryId('')
              setError('')
            }}
            aria-pressed={type === t.value}
            className="relative cursor-pointer rounded-sm px-2 py-2.5 text-[13px] font-bold transition-colors duration-[var(--dur-fast)]"
            style={{ color: type === t.value ? '#fff' : 'var(--tx-2)' }}
          >
            {type === t.value && (
              <motion.span
                layoutId="type-pill"
                className="absolute inset-0 rounded-sm"
                style={{ background: t.color }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="py-7 text-center">
        <motion.p
          key={raw}
          initial={{ scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.16 }}
          className="num text-[46px] leading-none font-extrabold tracking-tight"
          style={{ color: raw ? 'var(--tx)' : 'var(--tx-2)' }}
        >
          {raw || '0'}
        </motion.p>
        <p className="text-tx-2 mt-2 text-xs tracking-widest uppercase">
          {currency} · {account?.name ?? 'нет счёта'}
        </p>
      </div>

      {type === 'transfer' ? (
        <div className="grid grid-cols-2 gap-2.5">
          <Select
            label="Откуда"
            value={account?.id ?? ''}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </Select>
          <Select
            label="Куда"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
          >
            <option value="">Выбери счёт</option>
            {accounts
              .filter((a) => a.id !== account?.id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
          </Select>
        </div>
      ) : (
        <div className="-mx-[18px] flex gap-2.5 overflow-x-auto px-[18px] pb-1 [scrollbar-width:none]">
          {categories.map((c) => {
            const on = activeCategory?.id === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={on}
                className="flex flex-none cursor-pointer flex-col items-center gap-1.5 text-[11px] transition-colors duration-[var(--dur-fast)]"
                style={{ color: on ? 'var(--tx)' : 'var(--tx-2)' }}
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-md text-lg transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)]"
                  style={{
                    background: `color-mix(in srgb, ${c.color} 16%, transparent)`,
                    outline: on ? `2px solid ${c.color}` : 'none',
                    transform: on ? 'scale(1.1)' : 'none',
                  }}
                >
                  {c.icon}
                </span>
                <span className="max-w-14 truncate">{c.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {type !== 'transfer' && accounts.length > 1 && (
        <div className="mt-4">
          <Select
            label="Счёт"
            value={account?.id ?? ''}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name} · {a.currency}
              </option>
            ))}
          </Select>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.33, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-4">
              <Field
                label="Дата"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Field
                label="Комментарий"
                value={note}
                placeholder="Необязательно"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-tx-2 cursor-pointer py-3 text-[12.5px] font-semibold"
      >
        {expanded ? 'Свернуть' : 'Дата и комментарий'}
      </button>

      {error && <p className="text-down pb-2 text-[13px] font-semibold">{error}</p>}

      <div className="mt-auto grid grid-cols-3 gap-2.5 pt-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === 'del' ? 'Стереть' : k}
            className="border-line bg-card num cursor-pointer rounded-lg border py-4 text-[21px] font-bold transition-transform duration-[var(--dur-fast)] [transition-timing-function:var(--ease)] active:scale-[0.93]"
          >
            {k === 'del' ? '⌫' : k}
          </button>
        ))}
        <button
          type="button"
          onClick={submit}
          disabled={save.isPending || saved}
          className="text-accent-ink col-span-3 cursor-pointer rounded-lg py-4.5 text-[16px] font-extrabold shadow-[var(--sh-3)] transition-all duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.97] disabled:opacity-100"
          style={{ background: saved ? 'var(--up)' : 'var(--accent)' }}
        >
          {saved ? '✓ Добавлено' : 'Сохранить'}
        </button>
      </div>
    </motion.div>
  )
}
