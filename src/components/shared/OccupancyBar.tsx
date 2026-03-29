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
    if (isThreeGroup) return current >= 3 ? 'bg-destructive' : 'bg-green-600'
    if (ratio >= 1) return 'bg-destructive'
    if (ratio >= 0.5) return 'bg-amber-600'
    return 'bg-green-600'
  })()

  const textColor = (() => {
    if (isThreeGroup) return current >= 3 ? 'text-destructive' : 'text-green-600 dark:text-green-400'
    if (ratio >= 1) return 'text-destructive'
    if (ratio >= 0.5) return 'text-amber-600 dark:text-amber-400'
    return 'text-green-600 dark:text-green-400'
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

