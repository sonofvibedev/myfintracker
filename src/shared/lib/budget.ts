import { filterByRange, rangeOf, type Range } from './period'
import type { Budget, Transaction } from './types'
import type { Minor } from './money'

type Tx = Pick<Transaction, 'type' | 'amountBase' | 'categoryId' | 'happenedAt'>

const spentIn = (transactions: Tx[], categoryId: string, range: Range): Minor =>
  filterByRange(transactions, range)
    .filter((t) => t.type === 'expense' && t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amountBase, 0)

export const budgetRange = (budget: Pick<Budget, 'period'>, offset = 0, now = new Date()): Range =>
  rangeOf(budget.period, now, offset)

/** How much of each budget is spent in its current period. */
export function spentPerBudget(
  budgets: Budget[],
  transactions: Tx[],
  now = new Date(),
): Record<string, Minor> {
  const out: Record<string, Minor> = {}
  for (const b of budgets) out[b.id] = spentIn(transactions, b.categoryId, budgetRange(b, 0, now))
  return out
}

/** "2026-01-01" means that day where the user lives, not UTC midnight, which
 *  in a positive timezone is the evening before and silently drops a period. */
const localDate = (iso: string): Date => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

/** How many whole periods have passed since the budget started. Capped so a
 *  long-forgotten budget cannot walk thousands of periods. */
function periodsSinceStart(budget: Budget, now: Date): number {
  const start = localDate(budget.startsOn)
  if (Number.isNaN(start.getTime())) return 0

  const current = budgetRange(budget, 0, now).start

  // Counted on the calendar, not by an average month length: a 30-day
  // September is still one whole month, and so is a 28-day February.
  const elapsed =
    budget.period === 'week'
      ? Math.floor((current.getTime() - rangeOf('week', start).start.getTime()) / (7 * 86_400_000))
      : (current.getFullYear() - start.getFullYear()) * 12 +
        (current.getMonth() - start.getMonth())

  return Math.max(0, Math.min(elapsed, 60))
}

export type BudgetStatus = {
  budget: Budget
  spent: Minor
  /** Limit plus whatever earlier periods left behind, for envelopes. */
  available: Minor
  left: Minor
  share: number
  over: boolean
  carried: Minor
}

/** An envelope carries its unspent remainder forward; a plain budget does not.
 *  Carry can go negative — an overspent envelope starts the next period short,
 *  which is the whole point of the method. */
export function budgetStatus(
  budgets: Budget[],
  transactions: Tx[],
  now = new Date(),
): BudgetStatus[] {
  return budgets.map((budget) => {
    const spent = spentIn(transactions, budget.categoryId, budgetRange(budget, 0, now))

    let carried = 0
    if (budget.rollover) {
      for (let offset = -periodsSinceStart(budget, now); offset < 0; offset++) {
        const range = budgetRange(budget, offset, now)
        if (range.end <= localDate(budget.startsOn)) continue
        carried += budget.limit - spentIn(transactions, budget.categoryId, range)
      }
    }

    const available = budget.limit + carried
    const left = available - spent
    return {
      budget,
      spent,
      available,
      left,
      carried,
      share: available > 0 ? spent / available : spent > 0 ? 1 : 0,
      over: left < 0,
    }
  })
}

/** Money earned this period that no budget has claimed yet. */
export function unallocated(budgets: Budget[], income: Minor): Minor {
  return income - budgets.reduce((sum, b) => sum + b.limit, 0)
}
