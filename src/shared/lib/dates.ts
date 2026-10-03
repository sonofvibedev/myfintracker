const dayFormat = new Intl.DateTimeFormat('ru-BY', { day: 'numeric', month: 'long' })
const dayWithYear = new Intl.DateTimeFormat('ru-BY', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const timeFormat = new Intl.DateTimeFormat('ru-BY', { hour: '2-digit', minute: '2-digit' })

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** "Сегодня" / "Вчера" where it helps, a date otherwise. */
export function dayLabel(iso: string): string {
  const date = new Date(iso)
  const today = startOfDay(new Date())
  const diff = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000)

  if (diff === 0) return 'Сегодня'
  if (diff === -1) return 'Вчера'
  if (diff === 1) return 'Завтра'

  const sameYear = date.getFullYear() === new Date().getFullYear()
  return (sameYear ? dayFormat : dayWithYear).format(date)
}

export const timeLabel = (iso: string) => timeFormat.format(new Date(iso))

export const dayKey = (iso: string) => iso.slice(0, 10)
