import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-slate-50 dark:bg-slate-950">
      <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4">404 - Không tìm thấy trang</h2>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <Link 
        href="/"
        className="inline-flex h-12 items-center justify-center bg-rose-600 px-8 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-rose-700 transition-colors rounded-xl"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
