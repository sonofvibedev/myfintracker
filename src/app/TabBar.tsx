import { NavLink, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import {
  AnalyticsIcon,
  BudgetIcon,
  ListIcon,
  OverviewIcon,
  PlusIcon,
} from '@/shared/ui/icons'

const tabs = [
  { to: '/', label: 'Обзор', Icon: OverviewIcon, end: true },
  { to: '/transactions', label: 'Операции', Icon: ListIcon, end: false },
  { to: '/budget', label: 'Бюджет', Icon: BudgetIcon, end: false },
  { to: '/analytics', label: 'Аналитика', Icon: AnalyticsIcon, end: false },
]

export function TabBar() {
  const navigate = useNavigate()

  return (
    <nav
      className="border-line bg-card/85 fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-[430px] grid-cols-5 items-end border-t px-1 pt-2 backdrop-blur-xl"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {tabs.slice(0, 2).map((t) => (
        <Tab key={t.to} {...t} />
      ))}

      <button
        type="button"
        onClick={() => navigate('/add')}
        aria-label="Добавить операцию"
        className="from-accent to-accent-2 text-accent-ink mb-1 grid h-[54px] w-[54px] cursor-pointer place-items-center justify-self-center rounded-[18px] bg-linear-140 shadow-[var(--sh-3)] transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-90 active:rotate-90"
      >
        <PlusIcon />
      </button>

      {tabs.slice(2).map((t) => (
        <Tab key={t.to} {...t} />
      ))}
    </nav>
  )
}

function Tab({ to, label, Icon, end }: (typeof tabs)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className="text-tx-2 relative flex cursor-pointer flex-col items-center gap-0.5 py-1.5 text-[9.5px] font-semibold transition-colors duration-[var(--dur-fast)] aria-[current=page]:text-[var(--accent)]"
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="tab-indicator"
              className="bg-accent absolute top-0 h-[2.5px] w-[22px] rounded-full"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <Icon className={isActive ? 'scale-110 transition-transform' : 'transition-transform'} />
          {label}
        </>
      )}
    </NavLink>
  )
}
