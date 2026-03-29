/**
 * Dropdown danh sách thông báo kèm đánh dấu đã đọc.
 */
import type { Notification as NotificationType } from '@/types'
import { useMemo, useRef } from 'react'
import { formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Bell, Info, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useMarkAllAsRead, useNotifications, useUnreadCount } from '@/hooks/useNotifications'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { mockDb } from '@/lib/mock'
import { useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'

function getTypeMeta(type: string): {
  colorBgClass: string
  colorTextClass: string
  Icon: typeof Info
} {
  const normalized = type.trim().toUpperCase()
  if (normalized === 'ALERT')
    return {
      colorBgClass: 'bg-destructive',
      colorTextClass: 'text-destructive',
      Icon: AlertTriangle,
    }
  if (normalized === 'REMINDER')
    return {
      colorBgClass: 'bg-amber-600',
      colorTextClass: 'text-amber-600 dark:text-amber-400',
      Icon: Bell,
    }
  return { colorBgClass: 'bg-primary', colorTextClass: 'text-primary', Icon: Info }
}

function getRelativeTime(iso: string): string {
  const d = parseISO(iso)
  if (!isValid(d)) return ''
  return formatDistanceToNow(d, { addSuffix: true, locale: vi })
}

export function NotificationDropdown({
  user_id,
  isOpen,
  onClose,
}: {
  user_id: number
  isOpen: boolean
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const qc = useQueryClient()

  const { data } = useNotifications(user_id)
  const unreadCount = useUnreadCount(user_id)
  const markAllAsRead = useMarkAllAsRead()

  const notifications = useMemo(() => (data ? data : []), [data])

  useOnClickOutside({
    ref: panelRef,
    enabled: isOpen,
    handler: () => onClose(),
  })

  const onMarkOneRead = (notification_id: number) => {
    mockDb.notifications = mockDb.notifications.map((n) =>
      n.notification_id === notification_id ? { ...n, is_read: true } : n,
    )
    void qc.invalidateQueries({ queryKey: ['notifications', user_id] })
  }

  if (!isOpen) return null

  return (
    <div ref={panelRef} className="absolute right-0 top-full z-50 w-80 rounded-xl bg-card shadow-xl ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-foreground">Thông báo</div>
          {unreadCount > 0 ? (
            <Badge className="rounded-full bg-destructive/10 text-destructive" variant="outline">
              {unreadCount}
            </Badge>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-lg bg-black/5 px-2 py-1 text-xs font-semibold text-muted-foreground transition-all duration-150 hover:bg-black/10 disabled:opacity-50"
          onClick={() => markAllAsRead.mutate({ user_id })}
          disabled={notifications.every((n) => n.is_read)}
        >
          Đánh dấu đã đọc
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto px-2 py-2">
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Không có thông báo</div>
        ) : (
          notifications.map((n: NotificationType) => {
            const meta = getTypeMeta(n.type)
            const isUnread = !n.is_read
            return (
              <button
                key={n.notification_id}
                type="button"
                onClick={() => onMarkOneRead(n.notification_id)}
                className={[
                  'group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-150 hover:bg-primary/10',
                  isUnread ? 'bg-primary/10' : 'bg-card',
                ].join(' ')}
              >
                <span className={['mt-2 h-7 w-1 rounded-full', meta.colorBgClass].join(' ')} />
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <meta.Icon className={['mt-0.5 h-4 w-4 shrink-0', meta.colorTextClass].join(' ')} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-foreground">{n.title}</div>
                      {isUnread ? (
                        <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Mới
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.message}</div>
                    <div className="mt-2 text-[11px] text-muted-foreground">{getRelativeTime(n.created_at)}</div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Link
          to="/moderator/notifications"
          className="text-sm font-semibold text-primary transition-all duration-150 hover:text-primary"
        >
          Xem tất cả →
        </Link>
        <button type="button" className="text-sm font-semibold text-muted-foreground" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  )
}

