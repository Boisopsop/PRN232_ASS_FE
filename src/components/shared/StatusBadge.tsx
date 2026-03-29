/**
 * Badge hiển thị trạng thái với màu sắc và nhãn tiếng Việt.
 */
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusBadgeSize = 'sm' | 'md'

function mapStatus(status: string): { label: string; className: string } {
  const normalized = status.trim().toUpperCase()

  switch (normalized) {
    case 'FULL':
      return { label: 'Đã đầy', className: 'border-destructive/30 bg-destructive/10 text-destructive' }
    case 'LOCKED':
      return { label: 'Đã khóa', className: 'border-border bg-black/5 text-muted-foreground' }
    case 'CANCELLED':
      return { label: 'Đã hủy', className: 'border-border bg-black/5 text-muted-foreground' }
    case 'UPCOMING':
      return { label: 'Sắp diễn ra', className: 'border-blue-600/30 bg-blue-600/10 text-blue-600 dark:text-blue-400' }
    case 'COMPLETED':
      return { label: 'Hoàn thành', className: 'border-purple-600/30 bg-purple-600/10 text-purple-600 dark:text-purple-400' }
    case 'REGISTERED':
      return { label: 'Đã đăng ký', className: 'border-[#4F46E5]/30 bg-primary/10 text-primary' }
    case 'OPEN (ROUND)':
    case 'OPEN_ROUND':
    case 'OPEN-ROUND':
    case 'OPEN_REGISTRATION':
      return { label: 'Đang mở đăng ký', className: 'border-green-600/30 bg-green-600/10 text-green-600 dark:text-green-400' }
    case 'OPEN':
    default:
      return { label: 'Đang mở', className: 'border-green-600/30 bg-green-600/10 text-green-600 dark:text-green-400' }
  }
}

export function StatusBadge({
  status,
  size = 'md',
}: {
  status: string
  size?: StatusBadgeSize
}) {
  const mapped = mapStatus(status)
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-lg',
        mapped.className,
        size === 'sm' ? 'h-6 px-2 text-[11px] font-semibold' : 'h-7 px-2 text-xs font-medium',
      )}
    >
      {mapped.label}
    </Badge>
  )
}

