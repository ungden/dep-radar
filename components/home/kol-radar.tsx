"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { CircleCheck, Star, ChevronRight } from "lucide-react"
import { motion } from "motion/react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PlatformBadge } from "@/components/platform-badge"
import { getKols, getProducts, getReviews } from "@/lib/data"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Review, Kol, Product } from "@/lib/types"

type KolSummary = Pick<Kol, 'id' | 'name' | 'avatar' | 'platform' | 'verified'>
type ProductSummary = Pick<Product, 'id' | 'name' | 'brand' | 'image'>

export function KolRadar() {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [kols, setKols] = React.useState<KolSummary[]>([])
  const [products, setProducts] = React.useState<ProductSummary[]>([])

  React.useEffect(() => {
    Promise.all([
      getReviews(),
      getKols(),
      getProducts(),
    ]).then(([reviewsData, kolsData, productsData]) => {
      setReviews(reviewsData.slice(0, 3))
      setKols(kolsData)
      setProducts(productsData)
    })
  }, [])

  const kolMap = React.useMemo(() => new Map<string, KolSummary>(kols.map(k => [k.id, k])), [kols])
  const productMap = React.useMemo(() => new Map<string, ProductSummary>(products.map(p => [p.id, p])), [products])

  return (
    <section className="bg-slate-100 dark:bg-slate-900/50 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
              KOL Radar
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Cập nhật liên tục đánh giá mới nhất từ các Beauty Blogger và KOC hàng đầu.
              Phân biệt rõ ràng review chân thực và sản phẩm tài trợ.
            </p>
          </div>
          <Link href="/koc-tracker" className="shrink-0">
            <span className="text-rose-500 font-semibold hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2">
              Xem tất cả KOLs <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {reviews.map((review) => {
            const kol = kolMap.get(review.kolid)
            const product = productMap.get(review.productid)
            if (!kol || !product) return null

            return (
              <motion.div key={review.id} variants={itemVariants}>
                <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 h-full">
                  <CardHeader className="p-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <Link href={`/koc-tracker/${kol.id}`} className="flex flex-row items-center gap-4 p-5 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-900 shadow-md ring-2 ring-slate-50 dark:ring-slate-800 group-hover:ring-rose-100 dark:group-hover:ring-rose-900/30 transition-all">
                        <AvatarImage src={kol.avatar} alt={kol.name} />
                        <AvatarFallback>{kol.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-50 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{kol.name}</h3>
                          {kol.verified && <CircleCheck className="h-4 w-4 text-blue-500 shrink-0" />}
                          <PlatformBadge platform={kol.platform} />
                        </div>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {review.timeago}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors shrink-0" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-5 bg-white dark:bg-slate-900">
                    <div className="flex gap-4 mb-4">
                      <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                        <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-xs font-medium text-rose-500 uppercase tracking-wider mb-1">{product.brand}</div>
                        <Link href={`/products/${product.id}`} className="font-semibold text-slate-900 dark:text-slate-50 hover:text-rose-500 dark:hover:text-rose-400 line-clamp-2 leading-tight">
                          {product.name}
                        </Link>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 relative">
                      <div className="absolute -top-3 right-4">
                        {review.ispr ? (
                          <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium text-[10px] uppercase tracking-wider px-2 py-0.5">
                            Tài trợ / PR
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 font-medium text-[10px] uppercase tracking-wider px-2 py-0.5">
                            Tự mua
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed line-clamp-3">
                        &quot;{review.content}&quot;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
