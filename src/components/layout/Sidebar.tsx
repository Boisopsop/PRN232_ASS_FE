/**
 * Sidebar điều hướng theo role và hiển thị thông tin user.
 */
import { NavLink } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getNavLinks } from '@/components/layout/getNavLinks'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import type { UserRole } from '@/types'

function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  const letters = parts.map((p) => p[0]?.toUpperCase() ?? '')
  return letters.join('') || 'U'
}

function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h
}

function getAvatarColorClass(name: string): string {
  const palette = [
    'bg-primary',
    'bg-emerald-600',
    'bg-pink-600',
    'bg-amber-600',
    'bg-sky-600',
    'bg-purple-600',
  ] as const
  const idx = hashString(name) % palette.length
  return palette[idx]
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'STUDENT':
      return 'Sinh viên'
    case 'GV_REVIEW':
      return 'GV phản biện'
    case 'GVHD':
      return 'GVHD'
    case 'MODERATOR':
      return 'Moderator'
    default:
      return 'User'
  }
}

export function Sidebar() {
  const { currentUser, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUiStore()

  const navLinks = useMemo(() => {
    const role = currentUser?.role ?? 'STUDENT'
    return getNavLinks(role)
  }, [currentUser?.role])

  const initials = currentUser ? getInitials(currentUser.full_name) : 'CR'
  const avatarBg = getAvatarColorClass(initials)
  const roleLabel = currentUser ? getRoleLabel(currentUser.role) : 'User'

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <GraduationCap className="h-6 w-6 text-sidebar-foreground" />
        <span className="font-sora text-lg font-bold text-sidebar-foreground">CapReview</span>
      </div>

      <nav className="mt-3 flex flex-1 flex-col gap-2 px-4">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to !== '/reviewer/register'}
            onClick={() => setSidebarOpen(false)}
            aria-label={`Đi tới ${item.label}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 hover:bg-sidebar-accent',
                isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-transparent',
              )
            }
          >
            <item.Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-sidebar-foreground', avatarBg)}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{currentUser?.full_name ?? ''}</div>
            <Badge
              className="mt-1 border border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
              variant="outline"
            >
              {roleLabel}
            </Badge>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-lg bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          onClick={() => logout()}
          aria-label="Đăng xuất tài khoản"
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden h-screen w-[240px] bg-sidebar md:block">
        {sidebarContent}
      </aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[240px] border-r-0 p-0 md:hidden" showCloseButton>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  )
}

