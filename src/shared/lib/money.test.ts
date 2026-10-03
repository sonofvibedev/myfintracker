import { expect, test } from 'vitest'
import { convert, formatSigned, parseAmount, toMajor, toMinor } from './money'

test('parses what a person types', () => {
  expect(parseAmount('12,50')).toBe(1250)
  expect(parseAmount('12.5')).toBe(1250)
  expect(parseAmount('1 200,99')).toBe(120099)
  expect(parseAmount('0')).toBe(0)
  expect(parseAmount('-48,70')).toBe(-4870)
  expect(parseAmount('')).toBeNull()
  expect(parseAmount('abc')).toBeNull()
  expect(parseAmount('1,2,3')).toBeNull()
})

test('minor units survive a round trip that floats would break', () => {
  expect(toMinor(0.1) + toMinor(0.2)).toBe(toMinor(0.3))
  expect(toMajor(toMinor(19.99))).toBe(19.99)
})

test('signs use a real minus, not a hyphen', () => {
  expect(formatSigned(-4870)).toBe('−48,70')
  // Intl groups with a non-breaking space in ru-BY.
  expect(formatSigned(145000)).toBe('+1 450,00')
  expect(formatSigned(0)).toBe('0,00')
})

test('converts through the base currency', () => {
  const rates = { BYN: 1, USD: 3.2, EUR: 3.5 }

  expect(convert(1000, 'BYN', 'BYN', rates)).toBe(1000)
  expect(convert(10000, 'USD', 'BYN', rates)).toBe(32000)
  expect(convert(32000, 'BYN', 'USD', rates)).toBe(10000)
  expect(convert(10000, 'USD', 'EUR', rates)).toBe(9143)
  expect(() => convert(100, 'GBP', 'BYN', rates)).toThrow()
})
