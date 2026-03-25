/**
 * Trang mặc định để xác nhận ứng dụng CapReview đã chạy.
 */
export function HomePage() {
  return (
    <main className="min-h-screen bg-background font-dm">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-sora text-3xl font-bold text-slate-900">
          CapReview — Đăng ký phản biện đồ án
        </h1>
        <p className="mt-2 text-slate-600">
          Dự án frontend đã được khởi tạo (React 18 + TypeScript + Tailwind + Router + React
          Query).
        </p>
      </div>
    </main>
  )
}

