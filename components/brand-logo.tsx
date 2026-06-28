import Link from "next/link"

type BrandLogoProps = {
  href?: string
  variant?: "light" | "dark"
  className?: string
  markClassName?: string
}

export function BrandLogo({ href = "/", variant = "light", className = "", markClassName = "" }: BrandLogoProps) {
  const textClass = variant === "dark" ? "text-white" : "text-slate-950 dark:text-white"
  const subTextClass = variant === "dark" ? "text-stone-400" : "text-stone-500 dark:text-stone-400"

  return (
    <Link href={href} className={`group inline-flex items-center gap-3 ${className}`} aria-label="360dep.vn">
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-950 text-stone-50 shadow-sm ring-1 ring-stone-950/15 transition-transform duration-300 group-hover:scale-[1.03] dark:ring-white/10 ${markClassName}`}
      >
        <span className="absolute inset-[5px] rounded-lg border border-stone-50/10" />
        <span className="absolute left-[7px] top-[24px] h-4 w-8 -rotate-[18deg] rounded-[999px] border-t-2 border-[#c88f7a]" />
        <span className="absolute right-[8px] top-[10px] h-1.5 w-1.5 rounded-full bg-[#d8a48f]" />
        <span className="relative -mt-0.5 font-display text-[31px] font-black leading-none tracking-normal text-stone-50">đ</span>
      </span>
      <span className="min-w-0 leading-none">
        <span className={`block font-display text-2xl font-black tracking-normal ${textClass}`}>
          360<span className="text-[#a94f43] dark:text-[#d8a48f]">dep</span><span className="text-stone-500 dark:text-stone-400">.vn</span>
        </span>
        <span className={`mt-1 hidden text-[10px] font-bold uppercase tracking-[0.24em] sm:block ${subTextClass}`}>
          Beauty radar
        </span>
      </span>
    </Link>
  )
}
