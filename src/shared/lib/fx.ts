import { getSettings, saveSettings } from './db'

/** One entry of the NBRB daily rates feed. */
type NbrbRate = {
  Cur_Abbreviation: string
  Cur_Scale: number
  Cur_OfficialRate: number
}

const ENDPOINT = 'https://api.nbrb.by/exrates/rates?periodicity=0'

/** NBRB quotes against the Belarusian ruble, sometimes per 10 or 100 units.
 *  Normalising to one unit gives "how many BYN is one unit of this currency". */
export function normalise(rates: NbrbRate[]): Record<string, number> {
  const out: Record<string, number> = { BYN: 1 }
  for (const r of rates) {
    if (r.Cur_Scale > 0) out[r.Cur_Abbreviation] = r.Cur_OfficialRate / r.Cur_Scale
  }
  return out
}

/** The local calendar day, not the UTC one — a refresh late in the evening
 *  should count as today, not yesterday. */
const today = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/** Refreshes once a day at most. A failed fetch keeps the cached rates —
 *  stale numbers beat no numbers, and the app still works offline. */
export async function refreshRates(): Promise<Record<string, number>> {
  const settings = await getSettings()
  if (settings.ratesUpdatedAt === today()) return settings.rates

  try {
    const response = await fetch(ENDPOINT)
    if (!response.ok) throw new Error(`NBRB responded ${response.status}`)

    const rates = normalise((await response.json()) as NbrbRate[])
    const saved = await saveSettings({ rates, ratesUpdatedAt: today() })
    return saved.rates
  } catch {
    return settings.rates
  }
}

/** Currencies offered in pickers: the common ones first, then whatever else
 *  the rates feed knows about. */
export function currencyOptions(rates: Record<string, number>): string[] {
  const common = ['BYN', 'USD', 'EUR', 'RUB', 'PLN']
  const rest = Object.keys(rates)
    .filter((c) => !common.includes(c))
    .sort()
  return [...common, ...rest]
}
