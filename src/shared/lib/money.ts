/** Money is handled as integer minor units (kopecks, cents) everywhere.
 *  Floating point never touches a balance. */

export type Minor = number

export const toMinor = (major: number): Minor => Math.round(major * 100)
export const toMajor = (minor: Minor): number => minor / 100

/** Parses what a person types: "12,50", "12.5", "1 200,99", "-48,70". */
export function parseAmount(input: string): Minor | null {
  const cleaned = input.replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '-' || cleaned === '.') {
    return null
  }
  return toMinor(Number(cleaned))
}

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(currency: string, withSymbol: boolean) {
  const key = `${currency}:${withSymbol}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat('ru-BY', {
      style: withSymbol ? 'currency' : 'decimal',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    formatters.set(key, f)
  }
  return f
}

export function formatMoney(minor: Minor, currency = 'BYN', withSymbol = false): string {
  return formatter(currency, withSymbol).format(toMajor(minor))
}

/** Signed display: expenses carry a minus, income a plus. */
export function formatSigned(minor: Minor, currency = 'BYN'): string {
  const sign = minor > 0 ? '+' : minor < 0 ? '−' : ''
  return sign + formatMoney(Math.abs(minor), currency)
}

/** Converts between currencies using rates quoted against the base currency.
 *  `rates[c]` is how many base units one unit of `c` is worth. */
export function convert(
  minor: Minor,
  from: string,
  to: string,
  rates: Record<string, number>,
): Minor {
  if (from === to) return minor
  const fromRate = rates[from]
  const toRate = rates[to]
  if (!fromRate || !toRate) throw new Error(`No rate for ${from} or ${to}`)
  return Math.round((minor * fromRate) / toRate)
}
