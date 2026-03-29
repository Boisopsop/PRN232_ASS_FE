/**
 * Trang 404 tổng cho toàn hệ thống.
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { getRoleHomePath } from '@/router/getRoleHomePath'
import { useAuthStore } from '@/stores/authStore'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()

  const homePath = useMemo(() => {
    if (!currentUser) return '/login'
    return getRoleHomePath(currentUser.role)
  }, [currentUser])

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="font-sora text-7xl font-bold text-primary">404</div>
        <h1 className="mt-3 font-sora text-2xl font-bold text-foreground">Trang không tồn tại</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đường dẫn bạn truy cập không còn khả dụng hoặc đã bị thay đổi.
        </p>
        <div className="mt-6">
          <Button type="button" onClick={() => navigate(homePath)} aria-label="Về trang chủ theo quyền hiện tại">
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}

