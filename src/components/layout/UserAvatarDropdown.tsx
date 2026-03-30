/**
 * Dropdown hiển thị avatar + tên user và action đăng xuất.
 */
import { LogOut } from 'lucide-react'
import { useMemo } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

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

export function UserAvatarDropdown() {
  const { currentUser, logout } = useAuthStore()

  const { initials, avatarBg } = useMemo(() => {
    const name = currentUser?.full_name ?? 'CapReview'
    const init = getInitials(name)
    return { initials: init, avatarBg: getAvatarColorClass(init) }
  }, [currentUser?.full_name])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg transition-all duration-150 hover:bg-muted"
        >
          <Avatar className={cn('size-10', avatarBg)}>
            <AvatarFallback className="text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left md:block">
            <div className="truncate text-sm font-semibold text-foreground">
              {currentUser?.full_name ?? ''}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={() => logout()}
          className="text-red-600 data-disabled:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

