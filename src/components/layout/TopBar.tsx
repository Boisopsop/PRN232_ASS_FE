/**
 * Thanh điều hướng trên cùng: hiển thị tiêu đề trang, chuông thông báo và menu user.
 */
import { useIsFetching } from '@tanstack/react-query'
import { Menu } from 'lucide-react'

import { NotificationBell } from '@/components/layout/NotificationBell'
import { UserAvatarDropdown } from '@/components/layout/UserAvatarDropdown'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useUiStore } from '@/stores/uiStore'

export function TopBar() {
  const title = usePageTitle()
  const { toggleSidebar } = useUiStore()
  const fetchingCount = useIsFetching()

  return (
    <header className="relative border-b border-border bg-background">
      {fetchingCount > 0 ? (
        <div
          className="absolute left-0 top-0 h-0.5 w-full origin-left animate-pulse bg-primary"
          role="status"
          aria-label="Đang tải dữ liệu"
        />
      ) : null}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 transition-all duration-150 hover:bg-accent md:hidden"
            onClick={toggleSidebar}
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <h1 className="truncate font-sora text-base font-bold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <UserAvatarDropdown />
        </div>
      </div>
    </header>
  )
}

