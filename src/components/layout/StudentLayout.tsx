/**
 * Layout cho sinh viên: navbar trên cùng (không có sidebar).
 */
import type { ReactElement } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { StudentNavbar } from '@/components/layout/StudentNavbar'

export function StudentLayout(): ReactElement {
  const location = useLocation()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <StudentNavbar />

      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
