import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '@/shared/ui/Screen'
import { Button, Field, Select, Sheet } from '@/shared/ui/kit'
import {
  useAccounts,
  useCategories,
  useDeleteTransaction,
  useTransactions,
} from '@/shared/lib/queries'
import { formatMoney, formatSigned } from '@/shared/lib/money'
import { dayKey, dayLabel, timeLabel } from '@/shared/lib/dates'
import type { Transaction, TxType } from '@/shared/lib/types'

type Filters = { type: TxType | ''; accountId: string; categoryId: string; from: string; to: string }

const emptyFilters: Filters = { type: '', accountId: '', categoryId: '', from: '', to: '' }

export function TransactionsScreen() {
  const { data: transactions = [] } = useTransactions()
  const { data: accounts = [] } = useAccounts(true)
  const { data: categories = [] } = useCategories()
  const remove = useDeleteTransaction()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (filters.type && t.type !== filters.type) return false
      if (filters.accountId && t.accountId !== filters.accountId && t.toAccountId !== filters.accountId)
        return false
      if (filters.categoryId && t.categoryId !== filters.categoryId) return false
      if (filters.from && dayKey(t.happenedAt) < filters.from) return false
      if (filters.to && dayKey(t.happenedAt) > filters.to) return false
      if (!q) return true

      const category = t.categoryId ? categoryById.get(t.categoryId)?.name ?? '' : ''
      const account = accountById.get(t.accountId)?.name ?? ''
      return `${t.note} ${category} ${account}`.toLowerCase().includes(q)
    })
  }, [transactions, filters, search, categoryById, accountById])

  /** Grouped by day, each group carrying its own net total. */
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of visible) {
      const key = dayKey(t.happenedAt)
      const list = map.get(key)
      if (list) list.push(t)
      else map.set(key, [t])
    }
    return [...map.entries()].map(([key, items]) => ({
      key,
      items,
      total: items.reduce(
        (sum, t) =>
          t.type === 'income' ? sum + t.amountBase : t.type === 'expense' ? sum - t.amountBase : sum,
        0,
      ),
    }))
  }, [visible])

  return (
    <Screen title="Операции" kicker="История">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по комментарию, категории, счёту"
          aria-label="Поиск"
          className="bg-card-2 text-tx focus:border-accent focus:bg-card min-w-0 flex-1 rounded-md border border-transparent px-3.5 py-3 text-[14px] outline-none transition-colors duration-[var(--dur-fast)]"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="border-line bg-card relative cursor-pointer rounded-md border px-4 text-[13px] font-bold transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-95"
        >
          Фильтр
          {activeFilterCount > 0 && (
            <span className="bg-accent text-accent-ink absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-tx-2 py-16 text-center text-sm">
          {transactions.length === 0 ? 'Операций пока нет' : 'Ничего не найдено'}
        </p>
      )}

      {groups.map((group, groupIndex) => (
        <section key={group.key} className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[13px] font-bold">{dayLabel(group.items[0]!.happenedAt)}</h2>
            <span className="num text-tx-2 text-[12px]">{formatSigned(group.total)}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {group.items.map((t, i) => {
              const category = t.categoryId ? categoryById.get(t.categoryId) : undefined
              const account = accountById.get(t.accountId)
              const target = t.toAccountId ? accountById.get(t.toAccountId) : undefined
              const color = category?.color ?? 'var(--accent)'

              return (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(groupIndex * 0.04 + i * 0.03, 0.4), duration: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(t)}
                    className="border-line bg-card flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left shadow-[var(--sh-2)] transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.985]"
                  >
                    <span
                      className="grid h-10 w-10 flex-none place-items-center rounded-md text-lg"
                      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
                    >
                      {t.type === 'transfer' ? '⇄' : (category?.icon ?? '📦')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">
                        {t.note ||
                          (t.type === 'transfer'
                            ? `${account?.name ?? '?'} → ${target?.name ?? '?'}`
                            : (category?.name ?? 'Без категории'))}
                      </span>
                      <span className="text-tx-2 text-[11.5px]">
                        {timeLabel(t.happenedAt)} · {account?.name ?? 'счёт удалён'}
                      </span>
                    </span>
                    <span
                      className="num text-[15px] font-bold tracking-tight"
                      style={{
                        color:
                          t.type === 'income'
                            ? 'var(--up)'
                            : t.type === 'transfer'
                              ? 'var(--tx-2)'
                              : 'var(--tx)',
                      }}
                    >
                      {t.type === 'transfer'
                        ? formatMoney(t.amount, t.currency)
                        : formatSigned(t.type === 'income' ? t.amount : -t.amount, t.currency)}
                    </span>
                  </button>
                </motion.li>
              )
            })}
          </ul>
        </section>
      ))}

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Фильтры">
        <div className="flex flex-col gap-3">
          <Select
            label="Тип"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as TxType | '' })}
          >
            <option value="">Любой</option>
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
            <option value="transfer">Перевод</option>
          </Select>
          <Select
            label="Счёт"
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          >
            <option value="">Любой</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </Select>
          <Select
            label="Категория"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          >
            <option value="">Любая</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="С даты"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
            <Field
              label="По дату"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          <Button onClick={() => setFiltersOpen(false)}>Показать {visible.length}</Button>
          <Button variant="ghost" onClick={() => setFilters(emptyFilters)}>
            Сбросить
          </Button>
        </div>
      </Sheet>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title="Операция">
        {selected && (
          <div className="flex flex-col gap-3">
            <p className="num text-center text-[34px] font-extrabold tracking-tight">
              {formatSigned(
                selected.type === 'income' ? selected.amount : -selected.amount,
                selected.currency,
              )}
            </p>
            <dl className="text-[13.5px]">
              {[
                ['Дата', `${dayLabel(selected.happenedAt)}, ${timeLabel(selected.happenedAt)}`],
                ['Счёт', accountById.get(selected.accountId)?.name ?? 'удалён'],
                selected.toAccountId
                  ? ['Куда', accountById.get(selected.toAccountId)?.name ?? 'удалён']
                  : ['Категория', selected.categoryId ? (categoryById.get(selected.categoryId)?.name ?? 'удалена') : '—'],
                ['Комментарий', selected.note || '—'],
              ].map(([k, v]) => (
                <div key={k} className="border-line flex justify-between border-b py-2.5 last:border-0">
                  <dt className="text-tx-2">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <Button
              variant="danger"
              onClick={async () => {
                await remove.mutateAsync([selected.id])
                setSelected(null)
              }}
            >
              Удалить операцию
            </Button>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}
