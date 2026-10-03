import type { Transaction } from './types'

export type Period = 'day' | 'week' | 'month' | 'year'

export const PERIOD_LABELS: Record<Period, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
}

/** Half-open range [start, end): the end is the first instant of the next
 *  period, so a transaction at 23:59:59.999 still belongs to its own day. */
export type Range = { start: Date; end: Date }

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Weeks start on Monday. */
function startOfWeek(d: Date) {
  const day = startOfDay(d)
  const weekday = (day.getDay() + 6) % 7
  day.setDate(day.getDate() - weekday)
  return day
}

export function rangeOf(period: Period, reference = new Date(), offset = 0): Range {
  const d = new Date(reference)

  switch (period) {
    case 'day': {
      const start = startOfDay(d)
      start.setDate(start.getDate() + offset)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { start, end }
    }
    case 'week': {
      const start = startOfWeek(d)
      start.setDate(start.getDate() + offset * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return { start, end }
    }
    case 'month': {
      const start = new Date(d.getFullYear(), d.getMonth() + offset, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + offset + 1, 1)
      return { start, end }
    }
    case 'year': {
      const start = new Date(d.getFullYear() + offset, 0, 1)
      const end = new Date(d.getFullYear() + offset + 1, 0, 1)
      return { start, end }
    }
  }
}

export const inRange = (iso: string, { start, end }: Range) => {
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

export const filterByRange = <T extends Pick<Transaction, 'happenedAt'>>(items: T[], range: Range) =>
  items.filter((t) => inRange(t.happenedAt, range))

/** Totals in the base currency. Transfers move money without spending it,
 *  so they count towards neither side. */
export function totals(transactions: Pick<Transaction, 'type' | 'amountBase'>[]) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === 'income') income += t.amountBase
    else if (t.type === 'expense') expense += t.amountBase
  }
  return { income, expense, net: income - expense }
}

export function byCategory(transactions: Pick<Transaction, 'type' | 'amountBase' | 'categoryId'>[]) {
  const sums = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.categoryId) continue
    sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amountBase)
  }
  return [...sums.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount)
}

const rangeLabels: Record<Period, Intl.DateTimeFormatOptions> = {
  day: { day: 'numeric', month: 'long' },
  week: { day: 'numeric', month: 'short' },
  month: { month: 'long', year: 'numeric' },
  year: { year: 'numeric' },
}

export function rangeLabel(period: Period, range: Range): string {
  const format = new Intl.DateTimeFormat('ru-BY', rangeLabels[period])
  if (period !== 'week') return format.format(range.start)

  const last = new Date(range.end)
  last.setDate(last.getDate() - 1)
  return `${format.format(range.start)} — ${format.format(last)}`
}
