import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CircleCheck } from "lucide-react"

import type { HomeCreatorUpdate } from "@/lib/home-briefing"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "numeric", month: "long" })
}

export function KolRadar({ creatorUpdates }: { creatorUpdates: HomeCreatorUpdate[] }) {
  const latestUpdates = creatorUpdates.slice(0, 4)

  return (
    <section className="bg-[#f7f4f1] py-14 dark:bg-slate-900/50 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">Radar người sáng tạo</p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white md:text-4xl">Clip sản phẩm mới đã đối chiếu</h2>
          </div>
          <Link href="/koc-tracker" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-black text-rose-600 hover:text-rose-700 sm:self-auto">
            Xem toàn bộ radar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-stone-200 border-y border-stone-200 dark:divide-slate-800 dark:border-slate-800">
          {latestUpdates.map((update) => (
            <article key={`${update.creator.id}-${update.title}`} className="grid gap-4 py-5 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:items-center md:py-6">
              <Link href={update.href} className="flex min-h-11 items-center gap-3">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800">
                  <Image src={update.creator.avatar} alt="" fill sizes="44px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white">
                    <span className="truncate">{update.creator.name}</span>
                    {update.creator.verified && <CircleCheck aria-label="Nguồn đã đối chiếu" className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{formatDate(update.date)} · {update.sourceName}</span>
                </span>
              </Link>

              <Link href={update.href} className="group min-w-0">
                <p className="line-clamp-1 text-xs font-black uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">{update.eventLabel}</p>
                <h3 className="mt-1 line-clamp-2 font-display text-lg font-black leading-6 text-slate-950 transition-colors group-hover:text-rose-600 dark:text-white">{update.title}</h3>
              </Link>

              {update.product && (
                <Link href={`/products/${update.product.id}`} className="flex items-center gap-3 sm:w-64 sm:justify-end">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-200 dark:bg-slate-800">
                    <Image src={update.product.image} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 sm:max-w-44">
                    <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{update.product.brand}</span>
                    <span className="mt-0.5 block line-clamp-2 text-xs font-bold leading-4 text-slate-700 dark:text-slate-200">{update.product.name}</span>
                  </span>
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
