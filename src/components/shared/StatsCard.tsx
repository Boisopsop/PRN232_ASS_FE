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
  color = 'text-slate-900',
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
          <div className="text-sm font-semibold text-slate-600">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
          <div className={cn('mt-3 text-3xl font-bold text-slate-900', color)}>{value}</div>
          {trend ? (
            <div className="mt-2">
              <Badge
                variant="outline"
                className={cn(
                  'rounded-lg border px-2 py-0.5 text-xs font-semibold',
                  trend.isPositive
                    ? 'border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]'
                    : 'border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]',
                )}
              >
                {trend.isPositive ? '▲' : '▼'} {trend.value}
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="shrink-0">
          <Icon className="h-7 w-7 text-slate-400" />
        </div>
      </div>
    </Card>
  )
}

