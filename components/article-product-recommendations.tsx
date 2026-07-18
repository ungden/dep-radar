import Image from "next/image"
import Link from "next/link"
import { ExternalLink, ShoppingBag, Star } from "lucide-react"

import { AffiliateButton } from "@/components/affiliate-button"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"

interface ArticleProductRecommendationsProps {
  products: Product[]
}

export function ArticleProductRecommendations({ products }: ArticleProductRecommendationsProps) {
  if (products.length === 0) return null

  return (
    <section className="not-prose my-10 border-y border-rose-100 bg-rose-50/60 py-6 dark:border-rose-950/60 dark:bg-rose-950/10">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            <ShoppingBag className="h-4 w-4" />
            Mua thông minh
          </div>
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Sản phẩm hợp với chủ đề này
          </h2>
        </div>
        <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          Khi có liên kết tiếp thị, 360dep.vn sẽ ghi nhãn rõ. Ưu tiên đọc tiêu chí trong bài trước khi chốt giỏ hàng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-white bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-900"
          >
            <Link href={`/products/${product.id}`} className="group block">
              <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 768px) 16rem, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Link>

            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-wide text-rose-500">{product.brand}</p>
                {product.reviews > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {product.rating}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Chưa có đánh giá</span>
                )}
              </div>

              <Link
                href={`/products/${product.id}`}
                className="line-clamp-2 font-bold leading-snug text-slate-900 transition-colors hover:text-rose-600 dark:text-slate-50 dark:hover:text-rose-400"
              >
                {product.name}
              </Link>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-base font-black text-slate-900 dark:text-slate-50">{product.price}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{product.sold} đã bán</span>
                </div>

                {product.affiliate_url ? (
                  <AffiliateButton
                    href={product.affiliate_url}
                    productId={product.id}
                    className="h-10 rounded-xl text-sm shadow-none shadow-transparent"
                  >
                    Mua trên Shopee <ExternalLink className="ml-2 h-4 w-4" />
                  </AffiliateButton>
                ) : (
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-600 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-rose-200"
                  >
                    Xem chi tiết
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
