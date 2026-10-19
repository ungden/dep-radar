import { Skeleton } from "./ui"

/** The desk reads a lot on the server before it shows; this holds its frame meanwhile. */
export default function AdminLoading() {
  return (
    <div className="min-h-dvh" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải trang vận hành…</span>
      <div className="fixed inset-y-0 left-0 hidden w-60 space-y-2 border-r border-line bg-surface p-3 md:block">
        <Skeleton className="mb-4 h-8 w-32" />
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="h-7" />
        ))}
      </div>
      <div className="md:pl-60">
        <div className="h-14 border-b border-line bg-surface" />
        <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-6 md:px-6">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}
