/**
 * Top navbar cho sinh viên: logo, nav links, theme toggle, notifications, user menu.
 */
import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { GraduationCap, Menu, X } from 'lucide-react'
import { useIsFetching } from '@tanstack/react-query'

import { NotificationBell } from '@/components/layout/NotificationBell'
import { UserAvatarDropdown } from '@/components/layout/UserAvatarDropdown'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { getNavLinks } from '@/components/layout/getNavLinks'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

export function StudentNavbar() {
  const { currentUser } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const fetchingCount = useIsFetching()

  const navLinks = useMemo(() => {
    const role = currentUser?.role ?? 'STUDENT'
    return getNavLinks(role)
  }, [currentUser?.role])

  return (
    <header className="relative border-b border-border bg-card">
      {fetchingCount > 0 ? (
        <div
          className="absolute left-0 top-0 h-0.5 w-full origin-left animate-pulse bg-primary"
          role="status"
          aria-label="Đang tải dữ liệu"
        />
      ) : null}

      <div className="mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo + Mobile toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-sora text-lg font-bold text-foreground">CapReview</span>
          </div>

          {/* Desktop nav links */}
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to !== '/student/calendar'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-muted',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground',
                  )
                }
              >
                <item.Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <UserAvatarDropdown />

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="rounded-lg p-2 transition-all duration-150 hover:bg-muted md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Mở menu điều hướng"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {sidebarOpen ? (
        <nav className="border-t border-border px-4 pb-3 pt-2 md:hidden">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to !== '/student/calendar'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 hover:bg-muted',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
                )
              }
            >
              <item.Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}
    </header>
  )
}
