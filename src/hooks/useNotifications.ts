/**
 * Custom hooks cho thông báo người dùng.
 */
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Notification } from '@/types'
import { getNotificationsForUser, markAllAsRead } from '@/lib/mock/api'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra'
}

export function useNotifications(user_id: number) {
  return useQuery({
    queryKey: ['notifications', user_id],
    queryFn: () => getNotificationsForUser(user_id) as Promise<Notification[]>,
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { user_id: number }) => markAllAsRead(vars.user_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Đã đánh dấu tất cả đã đọc')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useUnreadCount(user_id: number) {
  const { data } = useNotifications(user_id)

  return useMemo(() => {
    if (!data) return 0
    return data.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0)
  }, [data])
}

