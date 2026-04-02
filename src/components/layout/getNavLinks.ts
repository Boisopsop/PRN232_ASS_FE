/**
 * Helper tạo danh sách nav link theo role người dùng.
 */
import type { LucideIcon } from 'lucide-react'

import type { UserRole } from '@/types'
import { Calendar, LayoutDashboard, RefreshCw, Clock, Settings, Bell, BookOpen, Users } from 'lucide-react'

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
      { to: '/reviewer/calendar', label: 'Lịch đăng ký', Icon: Calendar },
    ]
  }

  if (role === 'GVHD') {
    return [
      { to: '/reviewer/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
      { to: '/reviewer/calendar', label: 'Lịch đăng ký', Icon: Calendar },
    ]
  }

  return [
    { to: '/moderator/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
    { to: '/moderator/semesters', label: 'Quản lý Học kỳ', Icon: BookOpen },
    { to: '/moderator/rounds', label: 'Quản lý Round', Icon: RefreshCw },
    { to: '/moderator/slots', label: 'Quản lý Slot', Icon: Clock },
    { to: '/moderator/groups', label: 'Quản lý Nhóm', Icon: Users },
    { to: '/moderator/config', label: 'Cấu hình GV Review', Icon: Settings },
    { to: '/moderator/notifications', label: 'Thông báo', Icon: Bell },
  ]
}

