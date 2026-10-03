import { expect, test } from 'vitest'
import { currencyOptions, normalise } from './fx'

test('NBRB scales are normalised to one unit', () => {
  const rates = normalise([
    { Cur_Abbreviation: 'USD', Cur_Scale: 1, Cur_OfficialRate: 3.2 },
    { Cur_Abbreviation: 'RUB', Cur_Scale: 100, Cur_OfficialRate: 3.4 },
    { Cur_Abbreviation: 'JPY', Cur_Scale: 0, Cur_OfficialRate: 2.1 },
  ])

  expect(rates.BYN).toBe(1)
  expect(rates.USD).toBe(3.2)
  expect(rates.RUB).toBeCloseTo(0.034, 6)
  expect(rates.JPY).toBeUndefined()
})

test('common currencies lead the picker, the rest follow alphabetically', () => {
  const options = currencyOptions({ BYN: 1, USD: 3.2, CHF: 3.6, AUD: 2.1 })
  expect(options.slice(0, 5)).toEqual(['BYN', 'USD', 'EUR', 'RUB', 'PLN'])
  expect(options.slice(5)).toEqual(['AUD', 'CHF'])
})
