/**
 * Thanh hiển thị mức độ chiếm chỗ slot (X/Y nhóm).
 */
import { cn } from '@/lib/utils'

export function OccupancyBar({
  current,
  max,
  label,
}: {
  current: number
  max: number
  label?: string
}) {
  const ratio = max <= 0 ? 0 : current / max
  const isThreeGroup = max === 3

  const color = (() => {
    if (isThreeGroup) return current >= 3 ? 'bg-[#DC2626]' : 'bg-[#16A34A]'
    if (ratio >= 1) return 'bg-[#DC2626]'
    if (ratio >= 0.5) return 'bg-[#D97706]'
    return 'bg-[#16A34A]'
  })()

  const textColor = (() => {
    if (isThreeGroup) return current >= 3 ? 'text-[#DC2626]' : 'text-[#16A34A]'
    if (ratio >= 1) return 'text-[#DC2626]'
    if (ratio >= 0.5) return 'text-[#D97706]'
    return 'text-[#16A34A]'
  })()

  const displayLabel = label ?? `${current}/${max} nhóm`

  const widthClass = (() => {
    if (ratio <= 0) return 'w-0'
    if (ratio < 0.5) return 'w-1/2'
    if (ratio < 1) return 'w-3/4'
    return 'w-full'
  })()

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
        <div className={cn('h-2 rounded-full transition-all duration-200', color, widthClass)} />
      </div>
      <div className={cn('shrink-0 text-xs font-semibold', textColor)}>{displayLabel}</div>
    </div>
  )
}

