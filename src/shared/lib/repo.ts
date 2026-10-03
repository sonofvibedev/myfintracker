import { db, newId } from './db'
import type { Account, Category, Transaction } from './types'
import type { Minor } from './money'

/* ---------- accounts ---------- */

export async function listAccounts(includeArchived = false): Promise<Account[]> {
  const all = await (await db()).getAll('accounts')
  return all
    .filter((a) => includeArchived || !a.archived)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'ru'))
}

export async function saveAccount(input: Omit<Account, 'id' | 'sort'> & Partial<Account>) {
  const d = await db()
  const existing = input.id ? await d.get('accounts', input.id) : undefined
  const account: Account = {
    sort: existing?.sort ?? (await d.count('accounts')),
    ...existing,
    ...input,
    id: input.id ?? newId(),
  }
  await d.put('accounts', account)
  return account
}

/** Archiving keeps history intact; deleting an account with transactions would not. */
export async function archiveAccount(id: string, archived = true) {
  const d = await db()
  const account = await d.get('accounts', id)
  if (!account) return
  await d.put('accounts', { ...account, archived })
}

export async function deleteAccount(id: string) {
  const d = await db()
  const used = await d.getAllFromIndex('transactions', 'accountId', id)
  if (used.length > 0) {
    throw new Error(
      `Счёт используется в ${used.length} операциях. Архивируй его вместо удаления.`,
    )
  }
  await d.delete('accounts', id)
}

/** Balances are derived, never stored, so they cannot drift from the transactions. */
export async function accountBalances(): Promise<Record<string, Minor>> {
  const d = await db()
  const [accounts, transactions] = await Promise.all([
    d.getAll('accounts'),
    d.getAll('transactions'),
  ])

  const balances: Record<string, Minor> = {}
  for (const a of accounts) balances[a.id] = a.initialBalance

  for (const t of transactions) {
    if (t.type === 'income') {
      balances[t.accountId] = (balances[t.accountId] ?? 0) + t.amount
    } else if (t.type === 'expense') {
      balances[t.accountId] = (balances[t.accountId] ?? 0) - t.amount
    } else {
      balances[t.accountId] = (balances[t.accountId] ?? 0) - t.amount
      if (t.toAccountId) balances[t.toAccountId] = (balances[t.toAccountId] ?? 0) + t.amount
    }
  }
  return balances
}

/* ---------- categories ---------- */

export async function listCategories(kind?: Category['kind']): Promise<Category[]> {
  const all = await (await db()).getAll('categories')
  return all
    .filter((c) => !kind || c.kind === kind)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'ru'))
}

export async function saveCategory(input: Omit<Category, 'id' | 'sort'> & Partial<Category>) {
  const d = await db()
  const existing = input.id ? await d.get('categories', input.id) : undefined
  const category: Category = {
    sort: existing?.sort ?? (await d.count('categories')),
    ...existing,
    ...input,
    id: input.id ?? newId(),
  }
  await d.put('categories', category)
  return category
}

/** Deleting a used category would orphan its transactions, so it either
 *  reassigns them or refuses. */
export async function deleteCategory(id: string, reassignTo?: string) {
  const d = await db()
  const used = await d.getAllFromIndex('transactions', 'categoryId', id)

  if (used.length > 0) {
    if (!reassignTo) {
      throw new Error(
        `Категория используется в ${used.length} операциях. Выбери, куда их перенести.`,
      )
    }
    const tx = d.transaction('transactions', 'readwrite')
    await Promise.all(used.map((t) => tx.store.put({ ...t, categoryId: reassignTo })))
    await tx.done
  }

  const children = (await d.getAll('categories')).filter((c) => c.parentId === id)
  await Promise.all(
    children.map((c) => d.put('categories', { ...c, parentId: reassignTo ?? null })),
  )

  await d.delete('categories', id)
}

/* ---------- transactions ---------- */

export async function listTransactions(): Promise<Transaction[]> {
  const all = await (await db()).getAllFromIndex('transactions', 'happenedAt')
  return all.reverse()
}

export async function saveTransaction(
  input: Omit<Transaction, 'id' | 'createdAt'> & Partial<Transaction>,
) {
  const d = await db()
  const existing = input.id ? await d.get('transactions', input.id) : undefined
  const transaction: Transaction = {
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    ...existing,
    ...input,
    id: input.id ?? newId(),
  }
  await d.put('transactions', transaction)
  return transaction
}

export async function deleteTransaction(id: string) {
  await (await db()).delete('transactions', id)
}
