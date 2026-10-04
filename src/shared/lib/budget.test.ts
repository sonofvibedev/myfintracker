import { expect, test } from 'vitest'
import { budgetStatus, unallocated } from './budget'
import type { Budget } from './types'

const monthsAgo = (n: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - n, 15)
  return d.toISOString()
}

/** A date string for the first of the month, N months back. Built by hand:
 *  toISOString would shift it a day earlier in a positive timezone. */
const firstOfMonth = (monthsBack: number) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - monthsBack)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const budget = (over: Partial<Budget> = {}): Budget => ({
  id: 'b1',
  categoryId: 'food',
  period: 'month',
  limit: 40_000,
  rollover: false,
  startsOn: firstOfMonth(2),
  ...over,
})

const spend = (amount: number, happenedAt: string, categoryId = 'food') =>
  ({ type: 'expense' as const, amountBase: amount, categoryId, happenedAt })

test('a plain budget ignores what earlier periods left behind', () => {
  const [status] = budgetStatus(
    [budget()],
    [spend(10_000, monthsAgo(1)), spend(15_000, new Date().toISOString())],
  )

  expect(status!.spent).toBe(15_000)
  expect(status!.available).toBe(40_000)
  expect(status!.left).toBe(25_000)
  expect(status!.over).toBe(false)
})

test('an envelope carries an unspent remainder forward', () => {
  const [status] = budgetStatus(
    [budget({ rollover: true })],
    [spend(10_000, monthsAgo(1)), spend(5_000, new Date().toISOString())],
  )

  // Two earlier periods: one untouched (+40 000), one with 10 000 spent (+30 000).
  expect(status!.carried).toBe(70_000)
  expect(status!.available).toBe(110_000)
  expect(status!.left).toBe(105_000)
})

test('an overspent envelope starts the next period short', () => {
  const [status] = budgetStatus(
    [budget({ rollover: true, startsOn: firstOfMonth(1) })],
    [spend(60_000, monthsAgo(1))],
  )

  expect(status!.carried).toBe(-20_000)
  expect(status!.available).toBe(20_000)
})

test('spending beyond the envelope reports an overspend, not a negative share', () => {
  const [status] = budgetStatus([budget()], [spend(55_000, new Date().toISOString())])

  expect(status!.over).toBe(true)
  expect(status!.left).toBe(-15_000)
  expect(status!.share).toBeGreaterThan(1)
})

test('other categories do not touch the budget', () => {
  const [status] = budgetStatus([budget()], [spend(30_000, new Date().toISOString(), 'rent')])
  expect(status!.spent).toBe(0)
})

test('unallocated income is what no budget has claimed', () => {
  expect(unallocated([budget({ limit: 40_000 })], 145_000)).toBe(105_000)
  expect(unallocated([], 145_000)).toBe(145_000)
})

test('a month counts on the calendar, whatever its length', () => {
  // September has 30 days, February 28, but each is one whole period. An
  // envelope started one month ago must carry exactly one period forward.
  for (const month of [1, 3, 9, 11]) {
    const now = new Date(2026, month, 10)
    // Built by hand: toISOString would shift the day in a positive timezone.
    const startsOn = `2026-${String(month).padStart(2, '0')}-01`

    const [status] = budgetStatus(
      [budget({ rollover: true, startsOn })],
      [spend(60_000, new Date(2026, month - 1, 15).toISOString())],
      now,
    )
    expect(status!.carried, `month ${month}`).toBe(-20_000)
  }
})

test('a budget counts from the day it starts, in the local calendar', () => {
  // Started this month: nothing has come before it, so nothing carries.
  const thisMonth = budgetStatus(
    [budget({ rollover: true, startsOn: firstOfMonth(0) })],
    [spend(5_000, new Date().toISOString())],
  )[0]!
  expect(thisMonth.carried).toBe(0)
  expect(thisMonth.available).toBe(40_000)

  // Started one month ago and untouched: exactly one period carries over.
  const lastMonth = budgetStatus(
    [budget({ rollover: true, startsOn: firstOfMonth(1) })],
    [],
  )[0]!
  expect(lastMonth.carried).toBe(40_000)
  expect(lastMonth.available).toBe(80_000)
})
