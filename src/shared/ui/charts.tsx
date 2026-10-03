import { motion } from 'motion/react'

const ease = [0.33, 1, 0.3, 1] as const

/** A filled line chart drawn by hand: the line draws itself, the fill follows. */
export function Area({
  points,
  color = 'var(--accent)',
  height = 112,
  scaleTo,
}: {
  points: number[]
  color?: string
  height?: number
  /** Share a scale with another series so the two can be compared by eye. */
  scaleTo?: number
}) {
  if (points.length < 2) {
    return <div style={{ height }} className="text-tx-2 grid place-items-center text-xs">Мало данных</div>
  }

  const width = 320
  const max = Math.max(scaleTo ?? 0, ...points)
  const min = Math.min(...points, 0)
  const span = max - min || 1
  const id = `area-${color.replace(/\W/g, '')}`

  const coords = points.map((value, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - 8 - ((value - min) / span) * (height - 20)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const line = `M${coords.join(' L')}`
  const last = coords.at(-1)!.split(',')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="mt-2 w-full" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${line} L${width},${height} L0,${height} Z`}
        fill={`url(#${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease }}
      />
      <motion.circle
        cx={last[0]}
        cy={last[1]}
        r="4"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 400, damping: 20 }}
      />
    </svg>
  )
}

/** Vertical bars that grow from zero, with the tallest highlighted. */
export function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1)

  return (
    <>
      <div className="mt-3 flex h-22 items-end gap-1.5">
        {values.map((v, i) => (
          <motion.i
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 2)}%` }}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease }}
            className="flex-1 rounded-t-[6px] rounded-b-[3px]"
            style={{
              background:
                v === max && v > 0
                  ? 'linear-gradient(180deg, var(--accent), var(--accent-2))'
                  : 'var(--card-2)',
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {labels.map((l) => (
          <span key={l} className="text-tx-2 flex-1 text-center text-[9.5px]">
            {l}
          </span>
        ))}
      </div>
    </>
  )
}

/** A progress ring. `value` over `limit`, clamped for drawing but not for colour. */
export function Ring({
  value,
  limit,
  color,
  size = 74,
  label,
  caption,
}: {
  value: number
  limit: number
  color: string
  size?: number
  label: string
  caption: string
}) {
  const radius = size / 2 - 5
  const circumference = 2 * Math.PI * radius
  const share = limit > 0 ? value / limit : 0
  const over = share > 1
  const stroke = over ? 'var(--down)' : color

  return (
    <div className="w-21 flex-none text-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--card-2)"
          strokeWidth="8"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - Math.min(share, 1)) }}
          transition={{ delay: 0.2, duration: 0.9, ease }}
        />
      </svg>
      <p className="num text-[12.5px] font-bold" style={{ color: over ? 'var(--down)' : undefined }}>
        {label}
      </p>
      <p className="text-tx-2 truncate text-[11px]">{caption}</p>
    </div>
  )
}
