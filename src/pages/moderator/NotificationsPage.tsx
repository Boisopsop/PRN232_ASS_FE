/**
 * Trung tâm thông báo cho moderator với filter và gửi nhắc nhở.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import React from 'react'
import { Bell, BellRing, ChevronDown, ChevronUp, Info, OctagonAlert } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useMarkAllAsRead, useNotifications } from '@/hooks/useNotifications'
import { sendReminder } from '@/lib/mock/api'
import { mockUsers } from '@/lib/mock/users'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

type FilterTab = 'ALL' | 'UNREAD' | 'REMINDER' | 'ALERT' | 'INFO'
type RecipientMode = 'ALL_STUDENT' | 'ALL_REVIEWER' | 'SPECIFIC'

function metaByType(type: Notification['type']) {
  switch (type) {
    case 'ALERT':
      return {
        borderClass: 'border-destructive',
        icon: OctagonAlert,
      }
    case 'REMINDER':
      return {
        borderClass: 'border-amber-600',
        icon: BellRing,
      }
    case 'INFO':
    default:
      return {
        borderClass: 'border-blue-600',
        icon: Info,
      }
  }
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const { currentUser } = useAuthStore()
  const userId = currentUser?.user_id ?? 0
  const notificationsQuery = useNotifications(userId)
  const markAllMutation = useMarkAllAsRead()

  const [tab, setTab] = React.useState<FilterTab>('ALL')
  const [localNotifications, setLocalNotifications] = React.useState<Notification[]>([])
  const [formOpen, setFormOpen] = React.useState(true)
  const [recipientMode, setRecipientMode] = React.useState<RecipientMode>('ALL_STUDENT')
  const [specificUserId, setSpecificUserId] = React.useState<number | null>(null)
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    setLocalNotifications(notificationsQuery.data ?? [])
  }, [notificationsQuery.data])

  const sendMutation = useMutation({
    mutationFn: async (payload: { recipientIds: number[]; message: string }) => {
      for (const id of payload.recipientIds) {
        await sendReminder(id, payload.message)
      }
    },
    onSuccess: async () => {
      toast.success('Đã gửi nhắc nhở thành công')
      setMessage('')
      await qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi nhắc nhở')
    },
  })

  const unreadCount = localNotifications.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0)
  const sortedNotifications = [...localNotifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const filtered = sortedNotifications.filter((n) => {
    if (tab === 'ALL') return true
    if (tab === 'UNREAD') return !n.is_read
    return n.type === tab
  })

  const specificCandidates = mockUsers.filter((u) => u.role !== 'MODERATOR')

  const markOneAsRead = (notificationId: number) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n)),
    )
  }

  const markAllAsRead = async () => {
    if (!userId) return
    await markAllMutation.mutateAsync({ user_id: userId })
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const onSendReminder = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập nội dung nhắc nhở')
      return
    }

    let recipientIds: number[] = []
    if (recipientMode === 'ALL_STUDENT') {
      recipientIds = mockUsers.filter((u) => u.role === 'STUDENT').map((u) => u.user_id)
    } else if (recipientMode === 'ALL_REVIEWER') {
      recipientIds = mockUsers.filter((u) => u.role === 'GV_REVIEW').map((u) => u.user_id)
    } else if (specificUserId) {
      recipientIds = [specificUserId]
    }

    if (recipientIds.length === 0) {
      toast.error('Vui lòng chọn người nhận hợp lệ')
      return
    }

    await sendMutation.mutateAsync({ recipientIds, message: trimmed })
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-sora text-xl font-bold text-foreground">Trung tâm Thông báo</h1>
          <Button type="button" variant="outline" onClick={() => void markAllAsRead()}>
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl p-4 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            <TabsTrigger value="UNREAD">Chưa đọc</TabsTrigger>
            <TabsTrigger value="REMINDER">Nhắc nhở</TabsTrigger>
            <TabsTrigger value="ALERT">Cảnh báo</TabsTrigger>
            <TabsTrigger value="INFO">Thông tin</TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      {currentUser?.role === 'MODERATOR' ? (
        <Card className="rounded-xl p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="font-sora text-base font-semibold text-foreground">Gửi nhắc nhở</div>
            {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {formOpen ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Người nhận</Label>
                  <Select value={recipientMode} onValueChange={(v) => setRecipientMode(v as RecipientMode)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_STUDENT">All SV</SelectItem>
                      <SelectItem value="ALL_REVIEWER">All GV Review</SelectItem>
                      <SelectItem value="SPECIFIC">Specific user</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipientMode === 'SPECIFIC' ? (
                  <div className="space-y-2">
                    <Label>Chọn người dùng</Label>
                    <Select
                      value={specificUserId ? String(specificUserId) : undefined}
                      onValueChange={(v) => setSpecificUserId(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn user cụ thể" />
                      </SelectTrigger>
                      <SelectContent>
                        {specificCandidates.map((u) => (
                          <SelectItem key={u.user_id} value={String(u.user_id)}>
                            {u.full_name} - {u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Nội dung nhắc nhở</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập nội dung nhắc nhở..."
                  rows={4}
                />
              </div>

              <Button type="button" onClick={() => void onSendReminder()} disabled={sendMutation.isPending}>
                {sendMutation.isPending ? 'Đang gửi...' : 'Gửi nhắc nhở'}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {notificationsQuery.isPending ? (
        <Card className="rounded-xl p-6 shadow-sm">Đang tải thông báo...</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Không có thông báo phù hợp"
          description="Thử đổi bộ lọc hoặc gửi nhắc nhở mới."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => {
            const meta = metaByType(notification.type)
            const Icon = meta.icon
            return (
              <Card
                key={notification.notification_id}
                className={cn(
                  'cursor-pointer rounded-xl border-l-4 p-4 shadow-sm transition-all duration-200',
                  meta.borderClass,
                  notification.is_read ? 'bg-card' : 'bg-primary/10',
                )}
                onClick={() => markOneAsRead(notification.notification_id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-card/80 p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={cn('text-sm', notification.is_read ? 'font-medium' : 'font-bold')}>
                          {notification.title}
                        </div>
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(notification.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  {!notification.is_read ? (
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground">Chưa đọc: {unreadCount}</div>
    </div>
  )
}

