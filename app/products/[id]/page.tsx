export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, ShieldCheck, ThumbsUp, MessageSquare, ArrowLeft, ShoppingCart } from "lucide-react"
import * as motion from "motion/react-client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getKols, getProduct, getReviews } from "@/lib/data"
import { AffiliateButton } from "@/components/affiliate-button"
import { SocialShare } from "@/components/social-share"
import { RelatedProducts } from "@/components/related-products"
import { UserRating } from "@/components/user-rating"
import { CommentSection } from "@/components/comment-section"
import { WishlistButton } from "@/components/wishlist-button"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return { title: 'Sản phẩm không tồn tại | 360dep.vn' }
  }

  const description = product.description?.length > 160
    ? product.description.substring(0, 157) + '...'
    : product.description

  return {
    title: `${product.name} - ${product.brand} | 360dep.vn`,
    description,
    openGraph: {
      title: `${product.name} - ${product.brand} | 360dep.vn`,
      description,
      images: product.image ? [product.image] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await getProduct(id);
  if (!product) return notFound();

  const KOLS = await getKols();
  const reviews = await getReviews({ productId: id });
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/products" className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
          </Link>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Product Image */}
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <div className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-2">
                  {product.brand}
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-lg text-amber-700 dark:text-amber-500 font-bold">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {product.rating}
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{product.reviews.toLocaleString()} đánh giá</span>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{product.sold} đã bán</span>
                </div>

                <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-6">
                  {product.price}
                </div>

                <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {product.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{tag}</Badge>
                  ))}
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex gap-4">
                    {product.affiliate_url ? (
                      <div className="flex-1">
                        <AffiliateButton href={product.affiliate_url} productId={product.id} />
                      </div>
                    ) : (
                      <Button className="flex-1 h-14 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg shadow-lg shadow-rose-200 dark:shadow-rose-900/20" disabled>
                        <ShoppingCart className="h-5 w-5 mr-2" /> Sắp có link mua
                      </Button>
                    )}
                    <WishlistButton productId={product.id} />
                  </div>
                  <SocialShare
                    url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://360dep.vn'}/products/${product.id}`}
                    title={product.name}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50 mb-8">Đánh giá từ KOL/KOC</h2>
            
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => {
                  const kol = KOLS.find(k => k.id === review.kolid);
                  if (!kol) return null;
                  
                  return (
                    <div key={review.id} className="flex gap-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <Link href={`/koc-tracker/${kol.id}`}>
                        <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm hover:ring-2 hover:ring-rose-200 dark:hover:ring-rose-900 transition-all">
                          <AvatarImage src={kol.avatar} />
                          <AvatarFallback>{kol.name[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/koc-tracker/${kol.id}`} className="font-bold text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                              {kol.name}
                            </Link>
                            {kol.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{review.timeago}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"}`} />
                            ))}
                          </div>
                          {review.ispr ? (
                            <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px] uppercase tracking-wider px-2 py-0.5">Tài trợ / PR</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-[10px] uppercase tracking-wider px-2 py-0.5">Tự mua</Badge>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 italic">
                          &quot;{review.content}&quot;
                        </p>
                        <div className="flex gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                          <button className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><ThumbsUp className="h-4 w-4" /> Hữu ích ({review.likes})</button>
                          <button className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"><MessageSquare className="h-4 w-4" /> Thảo luận ({review.comments})</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có đánh giá nào từ KOL/KOC cho sản phẩm này.</p>
              </div>
            )}
          </div>

          {/* User Rating */}
          <div className="mt-8">
            <UserRating productId={product.id} />
          </div>

          {/* Comment Section */}
          <div className="mt-8">
            <CommentSection productId={product.id} />
          </div>

          {/* Related Products */}
          <div className="mt-8">
            <RelatedProducts category={product.category} currentProductId={product.id} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
