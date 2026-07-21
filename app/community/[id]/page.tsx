import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ExternalLink, ShieldCheck, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getCommunityReviews, getPost, getProduct } from "@/lib/data"

export const dynamic = "force-dynamic"

export default async function CommunityReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const reviews = await getCommunityReviews()
  const review = reviews.find((item) => item.id === id)

  if (!review) {
    const legacyEditorialPost = await getPost(id)
    if (legacyEditorialPost) redirect(`/blog/${legacyEditorialPost.slug}`)
    return notFound()
  }

  const product = await getProduct(review.product_id)
  return (
    <main className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <article className="container mx-auto max-w-3xl px-4 md:px-6">
        <Link href="/community" className="inline-flex min-h-11 items-center gap-2 font-bold text-slate-600 hover:text-rose-600 dark:text-slate-300"><ArrowLeft className="h-4 w-4" /> Quay lại cộng đồng</Link>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-display text-2xl font-black text-slate-950 dark:text-white">{review.reviewer_alias || "Người dùng 360dep.vn"}</div>
              <div className="mt-2 flex items-center gap-1" aria-label={`${review.rating} trên 5 sao`}>
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-5 w-5 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />)}
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Đã duyệt</Badge>
          </div>
          <p className="mt-7 text-lg leading-8 text-slate-700 dark:text-slate-200">“{review.review}”</p>
          <dl className="mt-7 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm dark:bg-slate-950 sm:grid-cols-2">
            <Context label="Loại da / bối cảnh" value={review.skin_type} />
            <Context label="Thời gian dùng" value={review.usage_duration} />
            <Context label="Nguồn mua" value={review.purchase_source} />
            <Context label="Mua lại" value={review.would_repurchase === null ? null : review.would_repurchase ? "Có" : "Không chắc / không"} />
          </dl>
          {review.proof_url && <a href={review.proof_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">Mở nguồn đối chiếu <ExternalLink className="h-4 w-4" /></a>}
          {product && <Link href={`/products/${product.id}`} className="mt-7 flex min-h-14 items-center justify-between rounded-2xl bg-slate-950 px-5 font-bold text-white dark:bg-white dark:text-slate-950"><span>{product.brand} {product.name}</span><span aria-hidden="true">→</span></Link>}
        </div>
      </article>
    </main>
  )
}

function Context({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{value || "Không cung cấp"}</dd></div>
}
