import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { Screen } from '@/shared/ui/Screen'
import { Area } from '@/shared/ui/charts'
import { useCategories, useSettings, useTransactions } from '@/shared/lib/queries'
import { formatMoney } from '@/shared/lib/money'
import {
  byCategory,
  filterByRange,
  PERIOD_LABELS,
  rangeLabel,
  rangeOf,
  totals,
  type Period,
} from '@/shared/lib/period'

const PERIODS: Period[] = ['day', 'week', 'month', 'year']

/** How many slices to walk through a period for its trend line. */
const STEPS: Record<Period, { count: number; sub: Period }> = {
  day: { count: 7, sub: 'day' },
  week: { count: 7, sub: 'day' },
  month: { count: 30, sub: 'day' },
  year: { count: 12, sub: 'month' },
}

export function AnalyticsScreen() {
  const navigate = useNavigate()
  const { data: transactions = [] } = useTransactions()
  const { data: categories = [] } = useCategories()
  const { data: settings } = useSettings()

  const [period, setPeriod] = useState<Period>('month')
  const [offset, setOffset] = useState(0)

  const base = settings?.baseCurrency ?? 'BYN'
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const range = useMemo(() => rangeOf(period, new Date(), offset), [period, offset])
  const previous = useMemo(() => rangeOf(period, new Date(), offset - 1), [period, offset])

  const current = useMemo(() => filterByRange(transactions, range), [transactions, range])
  const sums = useMemo(() => totals(current), [current])
  const previousSums = useMemo(
    () => totals(filterByRange(transactions, previous)),
    [transactions, previous],
  )

  /** Two lines over the period: what came in and what went out. */
  const series = useMemo(() => {
    const { count, sub } = STEPS[period]
    const income: number[] = []
    const expense: number[] = []

    for (let i = count - 1; i >= 0; i--) {
      const slice = rangeOf(sub, range.end, -i - 1)
      const slice_totals = totals(filterByRange(transactions, slice))
      income.push(slice_totals.income)
      expense.push(slice_totals.expense)
    }
    return { income, expense }
  }, [transactions, period, range])

  // Both lines share one scale, otherwise the smaller one looks as tall as the larger.
  const seriesMax = Math.max(...series.income, ...series.expense, 1)

  const breakdown = useMemo(() => byCategory(current), [current])
  const biggest = breakdown[0]?.amount ?? 1

  const days = Math.max(
    1,
    Math.round((Math.min(range.end.getTime(), Date.now()) - range.start.getTime()) / 86_400_000),
  )
  const savingsRate = sums.income > 0 ? Math.round((sums.net / sums.income) * 100) : null
  const expenseDelta =
    previousSums.expense > 0
      ? Math.round(((sums.expense - previousSums.expense) / previousSums.expense) * 100)
      : null

  return (
    <Screen title="Аналитика" kicker="Куда уходят деньги">
      <div className="bg-card-2 grid grid-cols-4 gap-1.5 rounded-md p-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPeriod(p)
              setOffset(0)
            }}
            aria-pressed={period === p}
            className={`cursor-pointer rounded-sm px-2 py-2.5 text-[12.5px] font-bold transition-all duration-[var(--dur)] [transition-timing-function:var(--ease)] ${
              period === p ? 'bg-card text-tx shadow-[var(--sh-2)]' : 'text-tx-2'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Предыдущий период"
          className="border-line bg-card h-9 w-9 cursor-pointer rounded-md border text-[15px] font-bold"
        >
          ‹
        </button>
        <p className="text-[13.5px] font-semibold">{rangeLabel(period, range)}</p>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(o + 1, 0))}
          disabled={offset >= 0}
          aria-label="Следующий период"
          className="border-line bg-card h-9 w-9 cursor-pointer rounded-md border text-[15px] font-bold disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <motion.section
        key={`${period}-${offset}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.3, 1] }}
        className="border-line bg-card mt-3 rounded-xl border p-4 shadow-[var(--sh-2)]"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">
              Потрачено
            </p>
            <p className="num mt-1 text-[29px] leading-none font-extrabold tracking-tight">
              {formatMoney(sums.expense, base)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">
              Получено
            </p>
            <p className="num mt-1 text-[20px] font-bold tracking-tight" style={{ color: 'var(--up)' }}>
              {formatMoney(sums.income, base)}
            </p>
          </div>
        </div>

        <div className="relative">
          <Area points={series.expense} color="var(--down)" height={130} scaleTo={seriesMax} />
          <div className="absolute inset-0">
            <Area points={series.income} color="var(--up)" height={130} scaleTo={seriesMax} />
          </div>
        </div>

        <div className="text-tx-2 mt-1 flex gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: 'var(--down)' }} /> расход
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: 'var(--up)' }} /> доход
          </span>
        </div>
      </motion.section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="border-line bg-card rounded-xl border p-4 shadow-[var(--sh-2)]">
          <p className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">
            Средний день
          </p>
          <p className="num mt-1.5 text-[20px] font-bold tracking-tight">
            {formatMoney(Math.round(sums.expense / days), base)}
          </p>
          {expenseDelta !== null && (
            <span
              className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
              style={{
                background: expenseDelta > 0 ? 'rgb(224 79 95 / 0.12)' : 'rgb(31 157 110 / 0.12)',
                color: expenseDelta > 0 ? 'var(--down)' : 'var(--up)',
              }}
            >
              {expenseDelta > 0 ? '▲' : '▼'} {Math.abs(expenseDelta)}% к прошлому
            </span>
          )}
        </div>
        <div className="border-line bg-card rounded-xl border p-4 shadow-[var(--sh-2)]">
          <p className="text-tx-2 text-[11.5px] font-semibold tracking-wider uppercase">
            Норма сбережений
          </p>
          <p className="num mt-1.5 text-[20px] font-bold tracking-tight">
            {savingsRate === null ? '—' : `${savingsRate}%`}
          </p>
          <span className="text-tx-2 mt-2 inline-block text-[11.5px]">
            {savingsRate === null ? 'нет дохода за период' : `чистыми ${formatMoney(sums.net, base)}`}
          </span>
        </div>
      </div>

      <h2 className="mt-6 mb-3 text-[15.5px] font-bold tracking-tight">По категориям</h2>

      {breakdown.length === 0 ? (
        <p className="text-tx-2 py-8 text-center text-sm">За этот период расходов нет</p>
      ) : (
        <div className="border-line bg-card rounded-xl border p-4 shadow-[var(--sh-2)]">
          {breakdown.map((row, i) => {
            const category = categoryById.get(row.categoryId)
            const share = sums.expense > 0 ? row.amount / sums.expense : 0

            return (
              <button
                key={row.categoryId}
                type="button"
                onClick={() => navigate('/transactions')}
                className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left"
              >
                <span
                  className="h-2.5 w-2.5 flex-none rounded-[3px]"
                  style={{ background: category?.color ?? 'var(--tx-2)' }}
                />
                <span className="w-22 truncate text-[13.5px] font-semibold">
                  {category?.name ?? 'Без категории'}
                </span>
                <span className="bg-card-2 h-1.75 flex-1 overflow-hidden rounded-full">
                  <motion.i
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.amount / biggest) * 100}%` }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.7, ease: [0.33, 1, 0.3, 1] }}
                    className="block h-full rounded-full"
                    style={{ background: category?.color ?? 'var(--tx-2)' }}
                  />
                </span>
                <span className="num w-16 text-right text-[12.5px] font-semibold">
                  {formatMoney(row.amount, base)}
                </span>
                <span className="text-tx-2 num w-9 text-right text-[11.5px]">
                  {Math.round(share * 100)}%
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Screen>
  )
}
