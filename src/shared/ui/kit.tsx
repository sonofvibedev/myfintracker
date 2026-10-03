import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloseIcon } from './icons'

const press =
  'cursor-pointer transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.97]'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  const styles = {
    primary: 'bg-accent text-accent-ink shadow-[var(--sh-3)]',
    ghost: 'border-line bg-card text-tx border',
    danger: 'bg-down text-white',
  }[variant]

  return (
    <button
      {...rest}
      className={`${press} ${styles} w-full rounded-lg px-4 py-4 text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    />
  )
}

export function Field({
  label,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-tx-2 mb-1.5 block text-[11.5px] font-semibold tracking-wider uppercase">
        {label}
      </span>
      <input
        {...rest}
        className={`bg-card-2 text-tx focus:border-accent focus:bg-card w-full rounded-md border border-transparent px-3.5 py-3.5 text-[15px] font-semibold outline-none transition-colors duration-[var(--dur-fast)] ${className}`}
      />
    </label>
  )
}

export function Select({
  label,
  children,
  ...rest
}: InputHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-tx-2 mb-1.5 block text-[11.5px] font-semibold tracking-wider uppercase">
        {label}
      </span>
      <select
        {...rest}
        className="bg-card-2 text-tx focus:border-accent focus:bg-card w-full rounded-md border border-transparent px-3.5 py-3.5 text-[15px] font-semibold outline-none transition-colors duration-[var(--dur-fast)]"
      >
        {children}
      </select>
    </label>
  )
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="bg-card border-line fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[88dvh] max-w-[430px] overflow-y-auto rounded-t-[22px] border-t px-[18px] pt-5"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[19px] font-extrabold tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className={`${press} border-line bg-card-2 text-tx grid h-9 w-9 place-items-center rounded-md border`}
              >
                <CloseIcon size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const ICONS = [
  '🛒','☕','🚌','🏠','📱','💊','👕','🎬','🎁','📦','💼','🧰','🎀','📥','🍔','🍺','⛽','🚗',
  '✈️','🏋️','📚','🐾','🧴','🧾','🪙','💵','💳','🏦','🎓','🔧','🌐','🎮','💡','🧒','💐','🩺',
]

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-card-2 grid max-h-36 grid-cols-9 gap-1 overflow-y-auto rounded-md p-2">
      {ICONS.map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-pressed={value === i}
          className={`${press} grid h-9 place-items-center rounded-sm text-lg ${
            value === i ? 'bg-card outline-accent outline-2' : ''
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  )
}

const COLORS = [
  '#5b5bd6','#8b6fef','#d96fc0','#f08b5a','#4fb8a8','#4a9ae8',
  '#1f9d6e','#e04f5f','#c99a2e','#7e4a6b','#3e8585','#6c7489',
]

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c}
          aria-pressed={value === c}
          style={{ background: c }}
          className={`${press} h-8 w-8 rounded-full ${
            value === c ? 'outline-tx outline-2 outline-offset-2' : ''
          }`}
        />
      ))}
    </div>
  )
}
