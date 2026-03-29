/**
 * Skeleton loading cho card/table/stats.
 */
import { Skeleton } from '@/components/ui/skeleton'

export function SlotCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-5 w-24 rounded-lg" />
      </div>
    </div>
  )
}

