import { db, newId } from './db'
import type { Account, Category } from './types'

const EXPENSE: [string, string, string][] = [
  ['Продукты', '🛒', '#f08b5a'],
  ['Кафе', '☕', '#d96fc0'],
  ['Транспорт', '🚌', '#4a9ae8'],
  ['Жильё', '🏠', '#8b6fef'],
  ['Связь', '📱', '#5b5bd6'],
  ['Здоровье', '💊', '#4fb8a8'],
  ['Одежда', '👕', '#e0764a'],
  ['Досуг', '🎬', '#7e4a6b'],
  ['Подарки', '🎁', '#c99a2e'],
  ['Прочее', '📦', '#6c7489'],
]

const INCOME: [string, string, string][] = [
  ['Зарплата', '💼', '#1f9d6e'],
  ['Подработка', '🧰', '#4fb8a8'],
  ['Подарок', '🎀', '#d96fc0'],
  ['Прочее', '📥', '#6c7489'],
]

/** Runs once, on an empty database, so the app is usable immediately. */
export async function seedIfEmpty() {
  const d = await db()
  if ((await d.count('categories')) > 0 || (await d.count('accounts')) > 0) return

  const tx = d.transaction(['categories', 'accounts'], 'readwrite')
  const categories = tx.objectStore('categories')
  const accounts = tx.objectStore('accounts')

  let sort = 0
  const put = (kind: Category['kind']) => ([name, icon, color]: [string, string, string]) =>
    categories.put({ id: newId(), name, kind, icon, color, parentId: null, sort: sort++ })

  EXPENSE.forEach(put('expense'))
  INCOME.forEach(put('income'))

  const cash: Account = {
    id: newId(),
    name: 'Наличные',
    type: 'cash',
    currency: 'BYN',
    initialBalance: 0,
    icon: '💵',
    color: '#4fb8a8',
    archived: false,
    sort: 0,
  }
  const card: Account = {
    id: newId(),
    name: 'Карта',
    type: 'card',
    currency: 'BYN',
    initialBalance: 0,
    icon: '💳',
    color: '#5b5bd6',
    archived: false,
    sort: 1,
  }
  await accounts.put(cash)
  await accounts.put(card)
  await tx.done
}
