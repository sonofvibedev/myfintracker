import type { Minor } from './money'

export type Id = string

export type AccountType = 'cash' | 'card' | 'savings' | 'other'

export type Account = {
  id: Id
  name: string
  type: AccountType
  currency: string
  initialBalance: Minor
  icon: string
  color: string
  archived: boolean
  sort: number
}

export type CategoryKind = 'expense' | 'income'

export type Category = {
  id: Id
  name: string
  kind: CategoryKind
  icon: string
  color: string
  parentId: Id | null
  sort: number
}

export type TxType = 'expense' | 'income' | 'transfer'

export type Transaction = {
  id: Id
  type: TxType
  accountId: Id
  /** Destination account, transfers only. */
  toAccountId: Id | null
  categoryId: Id | null
  /** Always positive. The type decides the direction. */
  amount: Minor
  currency: string
  /** Amount in the base currency, computed when the transaction happened,
   *  so past totals never move when rates change. */
  amountBase: Minor
  rate: number
  happenedAt: string
  note: string
  createdAt: string
}

export type Budget = {
  id: Id
  categoryId: Id
  period: 'month' | 'week'
  limit: Minor
  /** Rollover turns a budget into an envelope: what is left carries over. */
  rollover: boolean
  startsOn: string
}

export type Goal = {
  id: Id
  name: string
  target: Minor
  saved: Minor
  deadline: string | null
  icon: string
  color: string
}

export type Recurring = {
  id: Id
  template: Omit<Transaction, 'id' | 'happenedAt' | 'createdAt'>
  rrule: string
  nextRunAt: string
  autoPost: boolean
  active: boolean
}

export type Settings = {
  baseCurrency: string
  /** Rates against the base currency, keyed by code. */
  rates: Record<string, number>
  ratesUpdatedAt: string | null
}
