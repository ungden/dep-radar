import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getHomeRecencyLabel, type HomeProductSignal } from "@/lib/home-briefing"

export function TrendingSection({ productSignals }: { productSignals: HomeProductSignal[] }) {
  const visibleSignals = productSignals.slice(0, 4)

  return (
    <section className="border-b border-stone-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-950 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">Từ nguồn công khai</p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white md:text-4xl">Sản phẩm đang được nhắc đến</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">Sắp theo số clip và ngày ghi nhận; không phải bảng xếp hạng chất lượng sản phẩm.</p>
          </div>
          <Link href="/products" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-black text-rose-600 hover:text-rose-700 sm:self-auto">
            Xem thư viện sản phẩm <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
          {visibleSignals.map((signal, index) => (
            <Link key={signal.product.id} href={`/products/${signal.product.id}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 dark:bg-slate-900">
                <Image
                  src={signal.product.image}
                  alt={signal.product.name}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  priority={index === 0}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">{signal.product.brand}</p>
              <h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-900 transition-colors group-hover:text-rose-600 dark:text-white md:text-base">{signal.product.name}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {signal.clipCount} clip đã đối chiếu{signal.latestDate ? ` · ${getHomeRecencyLabel(signal.latestDate)}` : ""}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
