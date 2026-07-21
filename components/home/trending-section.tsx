"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Sparkles } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { containerVariants, itemVariants } from "@/lib/animations"
import { getHomeRecencyLabel, type HomeProductSignal } from "@/lib/home-briefing"

export function TrendingSection({ productSignals }: { productSignals: HomeProductSignal[] }) {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 4200, stopOnInteraction: true }),
  ])
  const visibleSignals = productSignals.slice(0, 10)

  return (
    <section className="container mx-auto overflow-hidden px-4 md:px-6">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 shadow-sm dark:bg-slate-900 dark:text-rose-300">
            <Sparkles className="h-3.5 w-3.5" />
            Đang được bàn luận
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
            Sản phẩm nổi lên từ nguồn công khai
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Xếp theo số lần được người sáng tạo nhắc và độ mới của nguồn, không đặt giá hay khuyến mãi lên trước.
          </p>
        </div>
        <Link href="/products" className="hidden shrink-0 text-sm font-bold text-rose-500 hover:text-rose-600 sm:inline-flex">
          Xem tất cả sản phẩm <span aria-hidden="true" className="ml-1">&rarr;</span>
        </Link>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <motion.div
          className="-ml-4 flex"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {visibleSignals.map((signal, index) => (
            <motion.div
              key={signal.product.id}
              variants={itemVariants}
              className="min-w-0 shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <Link href={`/products/${signal.product.id}`} className="group block h-full">
                <Card className="flex h-full flex-col overflow-hidden border-slate-100 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <Image
                      src={signal.product.image}
                      alt={signal.product.name}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      priority={index === 0}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <Badge className="absolute left-3 top-3 border-none bg-white/90 text-slate-900 shadow-sm backdrop-blur hover:bg-white">
                      {signal.categoryLabel}
                    </Badge>
                    {signal.latestDate && (
                      <Badge className="absolute bottom-3 left-3 border-none bg-slate-950/80 text-white backdrop-blur hover:bg-slate-950/80">
                        {getHomeRecencyLabel(signal.latestDate)}
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="flex-1 p-4 pb-2">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-rose-500">
                      {signal.product.brand}
                    </div>
                    <CardTitle className="text-base font-semibold leading-tight text-slate-900 line-clamp-2 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                      {signal.product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <MessageCircle className="h-4 w-4 text-rose-500" />
                      {signal.mentions || 1} lượt nhắc
                    </div>
                    <p className="text-sm leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">
                      {signal.creatorNames.length
                        ? `${signal.creatorNames.slice(0, 2).join(", ")} vừa nhắc đến sản phẩm này.`
                        : "Sản phẩm vừa xuất hiện trong dòng tin beauty."}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
