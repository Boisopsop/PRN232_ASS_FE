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
      return { label: 'Đã đầy', className: 'border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]' }
    case 'LOCKED':
      return { label: 'Đã khóa', className: 'border-black/10 bg-black/5 text-slate-600' }
    case 'CANCELLED':
      return { label: 'Đã hủy', className: 'border-black/10 bg-black/5 text-slate-600' }
    case 'UPCOMING':
      return { label: 'Sắp diễn ra', className: 'border-[#2563EB]/30 bg-[#2563EB]/10 text-[#2563EB]' }
    case 'COMPLETED':
      return { label: 'Hoàn thành', className: 'border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED]' }
    case 'REGISTERED':
      return { label: 'Đã đăng ký', className: 'border-[#4F46E5]/30 bg-[#4F46E5]/10 text-[#4F46E5]' }
    case 'OPEN (ROUND)':
    case 'OPEN_ROUND':
    case 'OPEN-ROUND':
    case 'OPEN_REGISTRATION':
      return { label: 'Đang mở đăng ký', className: 'border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]' }
    case 'OPEN':
    default:
      return { label: 'Đang mở', className: 'border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]' }
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

