type IconProps = { size?: number; className?: string }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
}

export function OverviewIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </svg>
  )
}

export function ListIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  )
}

export function BudgetIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 7.5 12 14l9.5-6.5" />
    </svg>
  )
}

export function AnalyticsIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M3 17l5-6 4 3 5-8 4 4" />
    </svg>
  )
}

export function PlusIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2.6} width={size} height={size} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function GearIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

export function CloseIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
