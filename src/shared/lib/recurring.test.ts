import { expect, test } from 'vitest'
import { isDue, nextDate } from './recurring'

test('daily and weekly steps are plain arithmetic', () => {
  expect(nextDate(new Date(2026, 0, 1), 'day', 1).getDate()).toBe(2)
  expect(nextDate(new Date(2026, 0, 1), 'week', 2).getDate()).toBe(15)
})

test('a monthly rule on the 31st lands on the last day of a shorter month', () => {
  const jan31 = new Date(2026, 0, 31)
  const feb = nextDate(jan31, 'month', 1)

  expect(feb.getMonth()).toBe(1)
  expect(feb.getDate()).toBe(28)
})

test('a monthly step never skips a month', () => {
  let date = new Date(2026, 0, 31)
  const months: number[] = []
  for (let i = 0; i < 4; i++) {
    date = nextDate(date, 'month', 1)
    months.push(date.getMonth())
  }
  expect(months).toEqual([1, 2, 3, 4])
})

test('29 February falls back to the 28th in a common year', () => {
  const leap = new Date(2028, 1, 29)
  expect(nextDate(leap, 'year', 1).getDate()).toBe(28)
})

test('a rule is due once its date has passed, and never while paused', () => {
  const now = new Date(2026, 5, 10)
  expect(isDue({ active: true, nextRunAt: new Date(2026, 5, 9).toISOString() }, now)).toBe(true)
  expect(isDue({ active: true, nextRunAt: new Date(2026, 5, 11).toISOString() }, now)).toBe(false)
  expect(isDue({ active: false, nextRunAt: new Date(2026, 5, 1).toISOString() }, now)).toBe(false)
})
