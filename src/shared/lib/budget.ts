import { filterByRange, rangeOf, type Range } from './period'
import type { Budget, Transaction } from './types'
import type { Minor } from './money'

type Tx = Pick<Transaction, 'type' | 'amountBase' | 'categoryId' | 'happenedAt'>

const spentIn = (transactions: Tx[], categoryId: string, range: Range): Minor =>
  filterByRange(transactions, range)
    .filter((t) => t.type === 'expense' && t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amountBase, 0)

export const budgetRange = (budget: Pick<Budget, 'period'>, offset = 0): Range =>
  rangeOf(budget.period, new Date(), offset)

/** How much of each budget is spent in its current period. */
export function spentPerBudget(budgets: Budget[], transactions: Tx[]): Record<string, Minor> {
  const out: Record<string, Minor> = {}
  for (const b of budgets) out[b.id] = spentIn(transactions, b.categoryId, budgetRange(b))
  return out
}

/** How many whole periods have passed since the budget started. Capped so a
 *  long-forgotten budget cannot walk thousands of periods. */
function periodsSinceStart(budget: Budget): number {
  const start = new Date(budget.startsOn)
  if (Number.isNaN(start.getTime())) return 0

  const current = budgetRange(budget).start
  const perPeriod = budget.period === 'week' ? 7 * 86_400_000 : 30.44 * 86_400_000
  const elapsed = Math.floor((current.getTime() - start.getTime()) / perPeriod)
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
export function budgetStatus(budgets: Budget[], transactions: Tx[]): BudgetStatus[] {
  return budgets.map((budget) => {
    const spent = spentIn(transactions, budget.categoryId, budgetRange(budget))

    let carried = 0
    if (budget.rollover) {
      for (let offset = -periodsSinceStart(budget); offset < 0; offset++) {
        const range = budgetRange(budget, offset)
        if (range.start < new Date(budget.startsOn)) continue
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
