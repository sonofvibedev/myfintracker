import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  Account,
  Budget,
  Category,
  Goal,
  Recurring,
  Settings,
  Transaction,
} from './types'

interface Schema extends DBSchema {
  accounts: { key: string; value: Account }
  categories: { key: string; value: Category; indexes: { kind: string } }
  transactions: {
    key: string
    value: Transaction
    indexes: { happenedAt: string; accountId: string; categoryId: string }
  }
  budgets: { key: string; value: Budget; indexes: { categoryId: string } }
  goals: { key: string; value: Goal }
  recurring: { key: string; value: Recurring }
  meta: { key: string; value: Settings }
}

export const DEFAULT_SETTINGS: Settings = {
  baseCurrency: 'BYN',
  rates: { BYN: 1 },
  ratesUpdatedAt: null,
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null

export function db() {
  dbPromise ??= openDB<Schema>('myfintracker', 1, {
    upgrade(d) {
      d.createObjectStore('accounts', { keyPath: 'id' })

      const categories = d.createObjectStore('categories', { keyPath: 'id' })
      categories.createIndex('kind', 'kind')

      const transactions = d.createObjectStore('transactions', { keyPath: 'id' })
      transactions.createIndex('happenedAt', 'happenedAt')
      transactions.createIndex('accountId', 'accountId')
      transactions.createIndex('categoryId', 'categoryId')

      const budgets = d.createObjectStore('budgets', { keyPath: 'id' })
      budgets.createIndex('categoryId', 'categoryId')

      d.createObjectStore('goals', { keyPath: 'id' })
      d.createObjectStore('recurring', { keyPath: 'id' })
      d.createObjectStore('meta')
    },
  })
  return dbPromise
}

export const newId = () => crypto.randomUUID()

export async function getSettings(): Promise<Settings> {
  const stored = await (await db()).get('meta', 'settings')
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch }
  await (await db()).put('meta', next, 'settings')
  return next
}

/** Whole-database snapshot, used by export and by the import dry run. */
export async function dump() {
  const d = await db()
  const [accounts, categories, transactions, budgets, goals, recurring, settings] =
    await Promise.all([
      d.getAll('accounts'),
      d.getAll('categories'),
      d.getAll('transactions'),
      d.getAll('budgets'),
      d.getAll('goals'),
      d.getAll('recurring'),
      getSettings(),
    ])
  return { accounts, categories, transactions, budgets, goals, recurring, settings }
}

export type Snapshot = Awaited<ReturnType<typeof dump>>
