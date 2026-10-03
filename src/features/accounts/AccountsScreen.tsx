import { useState } from 'react'
import { Screen } from '@/shared/ui/Screen'
import { Button, ColorPicker, Field, IconPicker, Select, Sheet } from '@/shared/ui/kit'
import {
  useAccounts,
  useArchiveAccount,
  useBalances,
  useDeleteAccount,
  useSaveAccount,
} from '@/shared/lib/queries'
import { formatMoney, parseAmount, toMajor } from '@/shared/lib/money'
import type { Account, AccountType } from '@/shared/lib/types'

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Наличные' },
  { value: 'card', label: 'Карта' },
  { value: 'savings', label: 'Накопления' },
  { value: 'other', label: 'Другое' },
]

const CURRENCIES = ['BYN', 'USD', 'EUR', 'RUB', 'PLN']

const blank = {
  name: '',
  type: 'card' as AccountType,
  currency: 'BYN',
  initialBalance: '0',
  icon: '💳',
  color: '#5b5bd6',
}

export function AccountsScreen() {
  const [showArchived, setShowArchived] = useState(false)
  const { data: accounts = [] } = useAccounts(showArchived)
  const { data: balances = {} } = useBalances()
  const save = useSaveAccount()
  const archive = useArchiveAccount()
  const remove = useDeleteAccount()

  const [editing, setEditing] = useState<Account | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')

  const openNew = () => {
    setEditing(null)
    setForm(blank)
    setError('')
    setOpen(true)
  }

  const openEdit = (a: Account) => {
    setEditing(a)
    setForm({
      name: a.name,
      type: a.type,
      currency: a.currency,
      initialBalance: String(toMajor(a.initialBalance)).replace('.', ','),
      icon: a.icon,
      color: a.color,
    })
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    const name = form.name.trim()
    if (!name) return setError('Введи название')

    const initialBalance = parseAmount(form.initialBalance || '0')
    if (initialBalance === null) return setError('Начальный баланс — не число')

    await save.mutateAsync([
      {
        ...editing,
        name,
        type: form.type,
        currency: form.currency,
        initialBalance,
        icon: form.icon,
        color: form.color,
        archived: editing?.archived ?? false,
      },
    ])
    setOpen(false)
  }

  const onDelete = async (a: Account) => {
    try {
      await remove.mutateAsync([a.id])
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить')
    }
  }

  return (
    <Screen title="Счета" kicker="Кошельки и карты">
      <ul className="flex flex-col gap-2">
        {accounts.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => openEdit(a)}
              className="border-line bg-card flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-left shadow-[var(--sh-2)] transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.985]"
            >
              <span
                className="grid h-10 w-10 flex-none place-items-center rounded-md text-lg"
                style={{ background: `color-mix(in srgb, ${a.color} 16%, transparent)` }}
              >
                {a.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold">
                  {a.name}
                  {a.archived && <span className="text-tx-2 font-normal"> · в архиве</span>}
                </span>
                <span className="text-tx-2 text-[11.5px]">
                  {TYPES.find((t) => t.value === a.type)?.label} · {a.currency}
                </span>
              </span>
              <span className="num text-[15px] font-bold tracking-tight">
                {formatMoney(balances[a.id] ?? a.initialBalance, a.currency)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {accounts.length === 0 && (
        <p className="text-tx-2 py-10 text-center text-sm">Счетов пока нет</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={openNew}>Новый счёт</Button>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-tx-2 cursor-pointer py-2 text-[12.5px] font-semibold"
        >
          {showArchived ? 'Скрыть архив' : 'Показать архив'}
        </button>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Счёт' : 'Новый счёт'}
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Название"
            value={form.name}
            autoFocus
            placeholder="Карта BYN"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Select
              label="Тип"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Select
              label="Валюта"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Field
            label="Начальный баланс"
            inputMode="decimal"
            value={form.initialBalance}
            onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
          />
          <div>
            <p className="text-tx-2 mb-1.5 text-[11.5px] font-semibold tracking-wider uppercase">
              Иконка
            </p>
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
          </div>
          <div>
            <p className="text-tx-2 mb-1.5 text-[11.5px] font-semibold tracking-wider uppercase">
              Цвет
            </p>
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
          </div>

          {error && <p className="text-down text-[13px] font-semibold">{error}</p>}

          <Button onClick={submit} disabled={save.isPending}>
            {editing ? 'Сохранить' : 'Создать счёт'}
          </Button>

          {editing && (
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="ghost"
                onClick={async () => {
                  await archive.mutateAsync([editing.id, !editing.archived])
                  setOpen(false)
                }}
              >
                {editing.archived ? 'Вернуть' : 'В архив'}
              </Button>
              <Button variant="danger" onClick={() => onDelete(editing)}>
                Удалить
              </Button>
            </div>
          )}
        </div>
      </Sheet>
    </Screen>
  )
}
