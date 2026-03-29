/**
 * UI lỗi dùng trong từng trang khi query thất bại.
 */
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function PageError({
  error,
  onRetry,
}: {
  error: Error
  onRetry: () => void
}) {
  return (
    <Card className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-destructive">Không thể tải dữ liệu</div>
          <p className="mt-1 text-sm text-destructive/80">{error.message}</p>
          <div className="mt-3">
            <Button type="button" variant="outline" onClick={onRetry} aria-label="Thử tải lại dữ liệu">
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

