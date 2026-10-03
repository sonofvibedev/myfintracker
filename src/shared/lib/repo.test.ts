import { expect, test } from 'vitest'
import { computeBalances } from './repo'

const accounts = [
  { id: 'cash', initialBalance: 10_000 },
  { id: 'card', initialBalance: 0 },
]

test('income adds, expense subtracts, transfer moves between accounts', () => {
  const balances = computeBalances(accounts, [
    { type: 'income', accountId: 'card', toAccountId: null, amount: 145_000 },
    { type: 'expense', accountId: 'card', toAccountId: null, amount: 4_870 },
    { type: 'transfer', accountId: 'card', toAccountId: 'cash', amount: 20_000 },
  ])

  expect(balances.card).toBe(145_000 - 4_870 - 20_000)
  expect(balances.cash).toBe(10_000 + 20_000)
})

test('a transfer never changes the total', () => {
  const before = computeBalances(accounts, [])
  const after = computeBalances(accounts, [
    { type: 'transfer', accountId: 'cash', toAccountId: 'card', amount: 7_500 },
  ])
  const sum = (b: Record<string, number>) => Object.values(b).reduce((a, v) => a + v, 0)

  expect(sum(after)).toBe(sum(before))
})

test('an account with no transactions keeps its initial balance', () => {
  expect(computeBalances(accounts, []).cash).toBe(10_000)
})
