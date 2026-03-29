/**
 * Card thống kê hiển thị số liệu kèm icon và trend.
 */
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'text-foreground',
  subtitle,
  trend,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  subtitle?: string
  trend?: { value: number; isPositive: boolean }
}) {
  return (
    <Card className="rounded-xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-muted-foreground">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
          <div className={cn('mt-3 text-3xl font-bold text-foreground', color)}>{value}</div>
          {trend ? (
            <div className="mt-2">
              <Badge
                variant="outline"
                className={cn(
                  'rounded-lg border px-2 py-0.5 text-xs font-semibold',
                  trend.isPositive
                    ? 'border-green-600/30 bg-green-600/10 text-green-600 dark:text-green-400'
                    : 'border-destructive/30 bg-destructive/10 text-destructive',
                )}
              >
                {trend.isPositive ? '▲' : '▼'} {trend.value}
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="shrink-0">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
      </div>
    </Card>
  )
}

