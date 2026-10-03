import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { CloseIcon } from '@/shared/ui/icons'

/** Full-screen quick-add. The keypad and the form land in their own issue. */
export function AddSheet() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 36 }}
      className="bg-bg fixed inset-0 z-30 mx-auto flex max-w-[430px] flex-col px-[18px]"
    >
      <header className="flex items-center justify-between pt-7 pb-4">
        <h1 className="text-[21px] font-extrabold tracking-tight">Новая операция</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Закрыть"
          className="border-line bg-card text-tx grid h-[38px] w-[38px] cursor-pointer place-items-center rounded-md border transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-90"
        >
          <CloseIcon />
        </button>
      </header>
      <p className="text-tx-2 py-16 text-center text-sm whitespace-pre-line">
        {'Нумпад, выбор категории\nи счёта появятся здесь'}
      </p>
    </motion.div>
  )
}
