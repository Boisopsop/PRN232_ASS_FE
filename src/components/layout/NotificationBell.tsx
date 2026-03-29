/**
 * Nút chuông thông báo kèm dropdown danh sách thông báo.
 */
import { Bell } from 'lucide-react'
import { useState } from 'react'

import { useAuthStore } from '@/stores/authStore'
import { useUnreadCount } from '@/hooks/useNotifications'
import { NotificationDropdown } from '@/components/shared/NotificationDropdown'

export function NotificationBell() {
  const { currentUser } = useAuthStore()
  const userId = currentUser?.user_id ?? 0

  const unreadCount = useUnreadCount(userId)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-lg p-2 transition-all duration-150 hover:bg-muted"
        aria-label="Mở thông báo"
        onClick={() => setIsOpen((v) => !v)}
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      <NotificationDropdown user_id={userId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}

