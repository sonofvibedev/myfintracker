import { expect, test } from 'vitest'
import { byCategory, inRange, rangeOf, totals } from './period'

const ref = new Date(2026, 9, 4, 13, 30) // Sunday, 4 October 2026

test('a day range covers its own midnight and stops before the next', () => {
  const { start, end } = rangeOf('day', ref)
  expect(start.getHours()).toBe(0)
  expect(inRange(new Date(2026, 9, 4, 0, 0, 0).toISOString(), { start, end })).toBe(true)
  expect(inRange(new Date(2026, 9, 4, 23, 59, 59, 999).toISOString(), { start, end })).toBe(true)
  expect(inRange(new Date(2026, 9, 5, 0, 0, 0).toISOString(), { start, end })).toBe(false)
})

test('weeks start on Monday, so a Sunday belongs to the week that began before it', () => {
  const { start, end } = rangeOf('week', ref)
  expect(start.getDay()).toBe(1)
  expect(start.getDate()).toBe(28)
  expect(end.getDate()).toBe(5)
})

test('offsets step whole periods', () => {
  expect(rangeOf('month', ref, -1).start.getMonth()).toBe(8)
  expect(rangeOf('year', ref, -1).start.getFullYear()).toBe(2025)
})

test('transfers count as neither income nor expense', () => {
  const sums = totals([
    { type: 'income', amountBase: 145_000 },
    { type: 'expense', amountBase: 4_870 },
    { type: 'transfer', amountBase: 50_000 },
  ])
  expect(sums).toEqual({ income: 145_000, expense: 4_870, net: 140_130 })
})

test('category breakdown sums expenses and sorts by size', () => {
  const rows = byCategory([
    { type: 'expense', amountBase: 1_000, categoryId: 'food' },
    { type: 'expense', amountBase: 3_500, categoryId: 'rent' },
    { type: 'expense', amountBase: 2_000, categoryId: 'food' },
    { type: 'income', amountBase: 9_000, categoryId: 'salary' },
    { type: 'expense', amountBase: 500, categoryId: null },
  ])
  expect(rows).toEqual([
    { categoryId: 'rent', amount: 3_500 },
    { categoryId: 'food', amount: 3_000 },
  ])
})
