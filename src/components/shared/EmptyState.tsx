/**
 * Empty state dùng cho danh sách rỗng.
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="mx-auto w-full max-w-xl rounded-xl p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-1">
          <svg
            width="112"
            height="72"
            viewBox="0 0 112 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="text-slate-200"
          >
            <rect x="8" y="24" width="96" height="40" rx="10" className="fill-current" />
            <rect x="20" y="34" width="72" height="6" rx="3" className="fill-white/90" />
            <rect x="20" y="46" width="48" height="6" rx="3" className="fill-white/90" />
            <path d="M56 8L84 22H28L56 8Z" className="fill-indigo-200" />
          </svg>
          <Icon className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/3 text-slate-500" />
        </div>
        <div className="mt-3 text-lg font-bold text-slate-900">{title}</div>
        <div className="mt-2 text-sm text-slate-600">{description}</div>
        {action ? <div className="mt-4 w-full">{action}</div> : null}
      </div>
    </Card>
  )
}

