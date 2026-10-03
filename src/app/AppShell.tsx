import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { TabBar } from './TabBar'

/** Remembers how far each tab was scrolled, so switching tabs and coming back
 *  lands where you left off instead of at the top. */
function useScrollMemory() {
  const positions = useRef(new Map<string, number>())
  const { pathname } = useLocation()
  const previous = useRef(pathname)

  useEffect(() => {
    const save = () => positions.current.set(previous.current, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [])

  useEffect(() => {
    previous.current = pathname
    window.scrollTo({ top: positions.current.get(pathname) ?? 0, behavior: 'instant' })
  }, [pathname])
}

export function AppShell() {
  const location = useLocation()
  useScrollMemory()

  return (
    <div className="mx-auto min-h-dvh max-w-[430px] pb-[98px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.26, ease: [0.33, 1, 0.3, 1] }}
          className="px-[18px]"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <TabBar />
    </div>
  )
}
