/**
 * Hook trả về tiêu đề trang dựa trên pathname hiện tại.
 */
import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'

export function usePageTitle() {
  const { pathname } = useLocation()

  return useMemo(() => {
    const map: Array<[RegExp, string]> = [
      [/^\/student\/dashboard$/, 'Tổng quan'],
      [/^\/student\/register$/, 'Đăng ký Slot'],
      [/^\/student\/schedule$/, 'Lịch của tôi'],

      [/^\/reviewer\/dashboard$/, 'Tổng quan'],
      [/^\/reviewer\/register$/, 'Đăng ký Slot'],
      [/^\/reviewer\/schedule$/, 'Lịch của tôi'],

      [/^\/moderator\/dashboard$/, 'Tổng quan'],
      [/^\/moderator\/rounds$/, 'Quản lý Round'],
      [/^\/moderator\/slots$/, 'Quản lý Slot'],
      [/^\/moderator\/config$/, 'Cấu hình GV Review'],
      [/^\/moderator\/notifications$/, 'Thông báo'],
    ]

    const found = map.find(([re]) => re.test(pathname))
    return found?.[1] ?? 'CapReview'
  }, [pathname])
}

