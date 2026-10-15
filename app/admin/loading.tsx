import { Skeleton } from "@/components/ui"

/** The desk reads a lot on the server before it shows; this holds its shape meanwhile. */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl md:pt-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải trang vận hành…</span>
      <Skeleton className="mt-4 h-9 w-48" />
      <div className="mt-6 md:grid md:grid-cols-[208px_minmax(0,1fr)] md:gap-8">
        <div className="hidden space-y-2 md:block">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
