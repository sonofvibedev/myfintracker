import { useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/shared/ui/Screen'
import { Area, Bars, Ring } from '@/shared/ui/charts'
import {
  useAccounts,
  useBalances,
  useBudgets,
  useCategories,
  useSettings,
  useTransactions,
} from '@/shared/lib/queries'
import { formatMoney, formatSigned } from '@/shared/lib/money'
import { filterByRange, rangeOf, totals } from '@/shared/lib/period'
import { dayLabel, timeLabel } from '@/shared/lib/dates'
import { spentPerBudget } from '@/shared/lib/budget'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function OverviewScreen() {
  const { data: transactions = [] } = useTransactions()
  const { data: accounts = [] } = useAccounts()
  const { data: balances = {} } = useBalances()
  const { data: categories = [] } = useCategories()
  const { data: budgets = [] } = useBudgets()
  const { data: settings } = useSettings()

  const base = settings?.baseCurrency ?? 'BYN'
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])

  /** Accounts hold different currencies; the headline converts them all into
   *  the base currency at today's rates. */
  const netWorth = useMemo(() => {
    const rates = settings?.rates ?? { BYN: 1 }
    const baseRate = rates[base] ?? 1
    return accounts.reduce((sum, a) => {
      const balance = balances[a.id] ?? a.initialBalance
      const rate = rates[a.currency] ?? 1
      return sum + Math.round((balance * rate) / baseRate)
    }, 0)
  }, [accounts, balances, settings, base])

  const thisMonth = useMemo(
    () => totals(filterByRange(transactions, rangeOf('month'))),
    [transactions],
  )
  const lastMonth = useMemo(
    () => totals(filterByRange(transactions, rangeOf('month', new Date(), -1))),
    [transactions],
  )

  /** Net worth over the last 30 days, walked backwards from today's balance. */
  const trend = useMemo(() => {
    const days = 30
    const series = Array.from({ length: days }, () => 0)
    let running = netWorth
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      series[i] = running
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i))
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const movement = totals(filterByRange(transactions, { start: dayStart, end: dayEnd }))
      running -= movement.net
    }
    return series
  }, [transactions, netWorth])

  /** Spending per weekday within the current week. */
  const weekdays = useMemo(() => {
    const week = filterByRange(transactions, rangeOf('week'))
    const sums = Array.from({ length: 7 }, () => 0)
    for (const t of week) {
      if (t.type !== 'expense') continue
      sums[(new Date(t.happenedAt).getDay() + 6) % 7] += t.amountBase
    }
    return sums
  }, [transactions])

  const budgetRings = useMemo(() => {
    const spent = spentPerBudget(budgets, transactions)
    return budgets
      .map((b) => ({ budget: b, category: categoryById.get(b.categoryId), spent: spent[b.id] ?? 0 }))
      .filter((r) => r.category)
      .sort((a, b) => b.spent / (b.budget.limit || 1) - a.spent / (a.budget.limit || 1))
      .slice(0, 6)
  }, [budgets, transactions, categoryById])

  const recent = transactions.slice(0, 4)
  const delta = lastMonth.expense > 0
    ? Math.round(((thisMonth.expense - lastMonth.expense) / lastMonth.expense) * 100)
    : null

  return (
    <Screen title="Обзор" kicker={`${new Intl.DateTimeFormat('ru-BY', { month: 'long', year: 'numeric' }).format(new Date())} · ${base}`} settings>
      <div className="grid grid-cols-2 gap-3">
        <Widget className="col-span-2" delay={0}>
          <Caption>Чистый баланс</Caption>
          <p className="num mt-1.5 text-[29px] leading-none font-extrabold tracking-tight">
            {formatMoney(netWorth, base)}
          </p>
          <Chip positive={thisMonth.net >= 0}>
            {thisMonth.net >= 0 ? '▲' : '▼'} {formatMoney(Math.abs(thisMonth.net), base)} за месяц
          </Chip>
          <Area points={trend} />
        </Widget>

        <Widget delay={0.08}>
          <Caption>Расход, мес.</Caption>
          <p className="num mt-1.5 text-[20px] font-bold tracking-tight">
            {formatMoney(thisMonth.expense, base)}
          </p>
          {delta !== null && (
            <Chip positive={delta <= 0}>
              {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}% к прошлому
            </Chip>
          )}
        </Widget>

        <Widget delay={0.14}>
          <Caption>Доход, мес.</Caption>
          <p className="num mt-1.5 text-[20px] font-bold tracking-tight">
            {formatMoney(thisMonth.income, base)}
          </p>
          {thisMonth.income > 0 && (
            <Chip positive>
              отложено {Math.max(Math.round((thisMonth.net / thisMonth.income) * 100), 0)}%
            </Chip>
          )}
        </Widget>

        <Widget className="col-span-2" delay={0.2}>
          <Caption>Расходы по дням недели</Caption>
          <Bars values={weekdays} labels={WEEKDAYS} />
        </Widget>
      </div>

      {budgetRings.length > 0 && (
        <>
          <SectionTitle to="/budget" action="Настроить">
            Бюджеты
          </SectionTitle>
          <div className="-mx-[18px] flex gap-3 overflow-x-auto px-[18px] [scrollbar-width:none]">
            {budgetRings.map(({ budget, category, spent }) => (
              <Ring
                key={budget.id}
                value={spent}
                limit={budget.limit}
                color={category!.color}
                label={`${budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0}%`}
                caption={category!.name}
              />
            ))}
          </div>
        </>
      )}

      <SectionTitle to="/transactions" action="Все">
        Последние
      </SectionTitle>
      {recent.length === 0 ? (
        <p className="text-tx-2 py-8 text-center text-sm">
          Пока пусто. Нажми «+», чтобы внести первую операцию.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recent.map((t, i) => {
            const category = t.categoryId ? categoryById.get(t.categoryId) : undefined
            const color = category?.color ?? 'var(--accent)'
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.05, duration: 0.3 }}
                className="border-line bg-card flex items-center gap-3 rounded-lg border p-3 shadow-[var(--sh-2)]"
              >
                <span
                  className="grid h-9 w-9 flex-none place-items-center rounded-md text-base"
                  style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
                >
                  {t.type === 'transfer' ? '⇄' : (category?.icon ?? '📦')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">
                    {t.note || category?.name || 'Перевод'}
                  </span>
                  <span className="text-tx-2 text-[11.5px]">
                    {dayLabel(t.happenedAt)}, {timeLabel(t.happenedAt)} ·{' '}
                    {accountById.get(t.accountId)?.name ?? 'счёт удалён'}
                  </span>
                </span>
                <span
                  className="num text-[14.5px] font-bold"
                  style={{ color: t.type === 'income' ? 'var(--up)' : undefined }}
                >
                  {t.type === 'transfer'
                    ? formatMoney(t.amount, t.currency)
                    : formatSigned(t.type === 'income' ? t.amount : -t.amount, t.currency)}
                </span>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}

function Widget({
  children,
  className = '',
  delay,
}: {
  children: React.ReactNode
  className?: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.33, 1, 0.3, 1] }}
      className={`border-line bg-card rounded-xl border p-4 shadow-[var(--sh-2)] ${className}`}
    >
      {children}
    </motion.div>
  )
}

const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">{children}</p>
)

const Chip = ({ children, positive }: { children: React.ReactNode; positive: boolean }) => (
  <span
    className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
    style={{
      background: positive ? 'rgb(31 157 110 / 0.12)' : 'rgb(224 79 95 / 0.12)',
      color: positive ? 'var(--up)' : 'var(--down)',
    }}
  >
    {children}
  </span>
)

const SectionTitle = ({
  children,
  to,
  action,
}: {
  children: React.ReactNode
  to: string
  action: string
}) => (
  <div className="mt-6 mb-3 flex items-baseline justify-between">
    <h2 className="text-[15.5px] font-bold tracking-tight">{children}</h2>
    <Link to={to} className="text-accent text-[12.5px] font-semibold">
      {action}
    </Link>
  </div>
)
