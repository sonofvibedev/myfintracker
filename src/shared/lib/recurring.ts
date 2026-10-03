import { db, newId } from './db'
import { saveTransaction } from './repo'
import type { Frequency, Recurring } from './types'

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
}

/** The next date after `from`, stepping by `interval` units of `frequency`.
 *  A monthly rule on the 31st lands on the last day of shorter months rather
 *  than slipping into the next one. */
export function nextDate(from: Date, frequency: Frequency, interval: number): Date {
  const step = Math.max(1, Math.round(interval))
  const next = new Date(from)

  switch (frequency) {
    case 'day':
      next.setDate(next.getDate() + step)
      break
    case 'week':
      next.setDate(next.getDate() + step * 7)
      break
    case 'month': {
      const day = next.getDate()
      next.setDate(1)
      next.setMonth(next.getMonth() + step)
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      next.setDate(Math.min(day, lastDay))
      break
    }
    case 'year': {
      const day = next.getDate()
      next.setDate(1)
      next.setFullYear(next.getFullYear() + step)
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      next.setDate(Math.min(day, lastDay))
      break
    }
  }
  return next
}

export const isDue = (rule: Pick<Recurring, 'active' | 'nextRunAt'>, now = new Date()) =>
  rule.active && new Date(rule.nextRunAt).getTime() <= now.getTime()

export async function listRecurring(): Promise<Recurring[]> {
  const all = await (await db()).getAll('recurring')
  return all.sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt))
}

export async function saveRecurring(input: Omit<Recurring, 'id'> & Partial<Recurring>) {
  const d = await db()
  const existing = input.id ? await d.get('recurring', input.id) : undefined
  const rule: Recurring = { ...existing, ...input, id: input.id ?? newId() }
  await d.put('recurring', rule)
  return rule
}

export async function deleteRecurring(id: string) {
  await (await db()).delete('recurring', id)
}

/** Writes the transaction a rule is due for and moves the rule forward.
 *  A rule that was missed for several periods catches up one step at a time,
 *  so every occurrence is recorded rather than collapsed into one. */
export async function postRule(rule: Recurring, now = new Date()): Promise<number> {
  let posted = 0
  let next = new Date(rule.nextRunAt)

  while (next.getTime() <= now.getTime() && posted < 60) {
    await saveTransaction({ ...rule.template, happenedAt: next.toISOString() })
    next = nextDate(next, rule.frequency, rule.interval)
    posted++
  }

  if (posted > 0) await saveRecurring({ ...rule, nextRunAt: next.toISOString() })
  return posted
}

/** Runs on startup for the rules that post by themselves. */
export async function postDueAutomatic(now = new Date()): Promise<number> {
  const rules = await listRecurring()
  let posted = 0
  for (const rule of rules) {
    if (rule.autoPost && isDue(rule, now)) posted += await postRule(rule, now)
  }
  return posted
}
