import Link from "next/link"

type BrandLogoProps = {
  href?: string
  variant?: "light" | "dark"
  className?: string
  markClassName?: string
}

export function BrandLogo({ href = "/", variant = "light", className = "", markClassName = "" }: BrandLogoProps) {
  const textClass = variant === "dark" ? "text-white" : "text-slate-950 dark:text-white"
  const subTextClass = variant === "dark" ? "text-slate-400" : "text-slate-500 dark:text-slate-400"

  return (
    <Link href={href} className={`group inline-flex items-center gap-3 ${className}`} aria-label="360 độ đẹp">
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm ring-1 ring-slate-900/10 dark:bg-white dark:text-slate-950 ${markClassName}`}
      >
        <span className="absolute inset-1 rounded-[14px] border border-rose-300/45" />
        <span className="absolute h-7 w-7 rounded-full border border-cyan-300/45" />
        <span className="absolute h-3 w-3 rounded-full bg-rose-500" />
        <span className="relative font-display text-[11px] font-black leading-none tracking-tight">360</span>
      </span>
      <span className="min-w-0 leading-none">
        <span className={`block font-display text-2xl font-black tracking-tight ${textClass}`}>
          360 độ <span className="text-rose-600 dark:text-rose-400">đẹp</span>
        </span>
        <span className={`mt-1 hidden text-[10px] font-bold uppercase tracking-[0.22em] sm:block ${subTextClass}`}>
          Beauty radar
        </span>
      </span>
    </Link>
  )
}
