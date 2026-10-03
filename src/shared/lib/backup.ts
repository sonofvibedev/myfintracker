import { db, dump, saveSettings, type Snapshot } from './db'
import { formatMoney } from './money'

const STORES = ['accounts', 'categories', 'transactions', 'budgets', 'goals', 'recurring'] as const

export type ImportReport = {
  added: Record<string, number>
  updated: Record<string, number>
  total: number
}

function download(name: string, mime: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: `${mime};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

export async function exportJson() {
  const snapshot = await dump()
  download(
    `myfintracker-${stamp()}.json`,
    'application/json',
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...snapshot }, null, 2),
  )
}

const csvCell = (value: string) =>
  /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

export async function exportCsv() {
  const { transactions, accounts, categories } = await dump()
  const accountName = new Map(accounts.map((a) => [a.id, a.name]))
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))

  const header = ['Дата', 'Тип', 'Сумма', 'Валюта', 'Счёт', 'Куда', 'Категория', 'Комментарий']
  const rows = transactions.map((t) =>
    [
      t.happenedAt,
      t.type,
      formatMoney(t.amount, t.currency),
      t.currency,
      accountName.get(t.accountId) ?? '',
      t.toAccountId ? (accountName.get(t.toAccountId) ?? '') : '',
      t.categoryId ? (categoryName.get(t.categoryId) ?? '') : '',
      t.note,
    ]
      .map((cell) => csvCell(String(cell)))
      .join(';'),
  )

  // The BOM makes Excel open a UTF-8 CSV correctly.
  download(`myfintracker-${stamp()}.csv`, 'text/csv', `﻿${[header.join(';'), ...rows].join('\n')}`)
}

function parseSnapshot(text: string): Snapshot {
  const data = JSON.parse(text) as Partial<Snapshot> & { version?: number }
  if (!data || typeof data !== 'object') throw new Error('Файл не похож на резервную копию')

  for (const store of STORES) {
    const value = data[store]
    if (value !== undefined && !Array.isArray(value)) {
      throw new Error(`Повреждён раздел «${store}»`)
    }
    if (Array.isArray(value) && value.some((row) => !row?.id)) {
      throw new Error(`В разделе «${store}» есть записи без id`)
    }
  }
  return data as Snapshot
}

/** Reports what an import would change, touching nothing. */
export async function previewImport(text: string): Promise<ImportReport> {
  const snapshot = parseSnapshot(text)
  const d = await db()
  const report: ImportReport = { added: {}, updated: {}, total: 0 }

  for (const store of STORES) {
    const rows = snapshot[store] ?? []
    const existing = new Set((await d.getAll(store)).map((row) => row.id))
    const updated = rows.filter((row) => existing.has(row.id)).length

    report.added[store] = rows.length - updated
    report.updated[store] = updated
    report.total += rows.length
  }
  return report
}

/** Merges on id: a matching record is replaced, a new one is added, and
 *  nothing already in the database is deleted. */
export async function applyImport(text: string): Promise<ImportReport> {
  const snapshot = parseSnapshot(text)
  const report = await previewImport(text)
  const d = await db()

  for (const store of STORES) {
    const rows = snapshot[store] ?? []
    if (rows.length === 0) continue

    const tx = d.transaction(store, 'readwrite')
    await Promise.all(rows.map((row) => tx.store.put(row)))
    await tx.done
  }

  if (snapshot.settings) await saveSettings(snapshot.settings)
  return report
}
