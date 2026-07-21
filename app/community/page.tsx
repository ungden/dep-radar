import Link from "next/link"
import { ArrowRight, BookOpenCheck, MessageSquareQuote, ShieldCheck, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getCommunityReviews, getKols, getProducts } from "@/lib/data"

export const dynamic = "force-dynamic"

export default async function CommunityPage() {
  const [reviews, products, kols] = await Promise.all([
    getCommunityReviews(),
    getProducts(),
    getKols(),
  ])
  const productsById = new Map(products.map((product) => [product.id, product]))
  const kolsById = new Map(kols.map((kol) => [kol.id, kol]))

  return (
    <main className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <div className="container mx-auto px-4 md:px-6">
        <section className="rounded-3xl bg-slate-950 p-7 text-white md:p-10 dark:bg-slate-900">
          <div className="max-w-3xl">
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">Dữ liệu đã duyệt</Badge>
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight md:text-5xl">Review cộng đồng có ngữ cảnh</h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">
              Trang này chỉ hiển thị review được lưu thật và đã qua duyệt. Bài của Beauty Desk nằm ở mục Kiến thức; chúng tôi không gắn nhãn nội dung biên tập thành bài của người dùng.
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <TrustMetric value={reviews.length} label="review đã duyệt" />
            <TrustMetric value={new Set(reviews.map((review) => review.product_id)).size} label="sản phẩm có review" />
            <TrustMetric value={reviews.filter((review) => review.proof_url).length} label="review có nguồn đối chiếu" />
          </div>
        </section>

        <section className="py-10" aria-labelledby="approved-reviews-title">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Cộng đồng</div>
              <h2 id="approved-reviews-title" className="mt-2 font-display text-3xl font-black text-slate-950 dark:text-white">Review đã được công khai</h2>
            </div>
            <Link href="/products" className="inline-flex min-h-11 items-center gap-2 font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
              Chọn sản phẩm để gửi review <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {reviews.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {reviews.map((review) => {
                const product = productsById.get(review.product_id)
                const linkedKol = review.linked_kol_id ? kolsById.get(review.linked_kol_id) : undefined
                return (
                  <Card key={review.id} className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-950 dark:text-white">{review.reviewer_alias || "Người dùng 360dep.vn"}</div>
                          <div className="mt-1 flex items-center gap-1" aria-label={`${review.rating} trên 5 sao`}>
                            {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />)}
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Đã duyệt</Badge>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">“{review.review}”</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {review.skin_type && <Badge variant="secondary">{review.skin_type}</Badge>}
                        {review.usage_duration && <Badge variant="secondary">{review.usage_duration}</Badge>}
                        {review.purchase_source && <Badge variant="secondary">{review.purchase_source}</Badge>}
                        {linkedKol && <Badge variant="secondary">Đối chiếu: {linkedKol.name}</Badge>}
                      </div>
                      {product ? (
                        <Link href={`/products/${product.id}`} className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
                          {product.brand} {product.name} <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <p className="mt-5 text-xs font-medium text-slate-400">Sản phẩm liên quan hiện không còn public.</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900 md:p-12">
              <MessageSquareQuote className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 font-display text-2xl font-black text-slate-950 dark:text-white">Chưa có review nào đã qua duyệt</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Đây là trạng thái dữ liệu thật, không phải feed mẫu. Review được gửi từ trang sản phẩm và chỉ xuất hiện ở đây sau khi được kiểm tra chống spam và gắn đúng sản phẩm.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white dark:bg-white dark:text-slate-950">Chọn sản phẩm <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-5 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><BookOpenCheck className="h-4 w-4" /> Đọc kiến thức đã biên tập</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function TrustMetric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="font-display text-3xl font-black">{value}</div><div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div></div>
}
