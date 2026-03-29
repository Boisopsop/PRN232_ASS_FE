/**
 * Trang 404 — không tìm thấy đường dẫn.
 */
import { Card } from '@/components/ui/card'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl rounded-xl p-6 shadow-sm">
        <h1 className="font-sora text-xl font-bold text-foreground">Trang không tồn tại</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đường dẫn bạn truy cập không có trong hệ thống. Hãy quay lại trang chủ.
        </p>
        <div className="mt-4">
          <Link
            to="/"
            className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary/90"
          >
            Về trang chủ
          </Link>
        </div>
      </Card>
    </div>
  )
}

