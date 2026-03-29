/**
 * Helper tạo danh sách nav link theo role người dùng.
 */
import type { LucideIcon } from 'lucide-react'

import type { UserRole } from '@/types'
import { CalendarPlus, Calendar, LayoutDashboard, RefreshCw, Clock, Settings, Bell } from 'lucide-react'

export type NavLinkItem = {
  to: string
  label: string
  Icon: LucideIcon
}

export function getNavLinks(role: UserRole): NavLinkItem[] {
  if (role === 'STUDENT') {
    return [
      { to: '/student/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
      { to: '/student/calendar', label: 'Lịch đăng ký', Icon: Calendar },
    ]
  }

  if (role === 'GV_REVIEW') {
    return [
      { to: '/reviewer/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
      { to: '/reviewer/register', label: 'Đăng ký Slot', Icon: CalendarPlus },
      { to: '/reviewer/schedule', label: 'Lịch của tôi', Icon: Calendar },
    ]
  }

  if (role === 'GVHD') {
    return [{ to: '/reviewer/dashboard', label: 'Tổng quan', Icon: LayoutDashboard }]
  }

  return [
    { to: '/moderator/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
    { to: '/moderator/rounds', label: 'Quản lý Round', Icon: RefreshCw },
    { to: '/moderator/slots', label: 'Quản lý Slot', Icon: Clock },
    { to: '/moderator/config', label: 'Cấu hình GV Review', Icon: Settings },
    { to: '/moderator/notifications', label: 'Thông báo', Icon: Bell },
  ]
}

