export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, ShieldCheck, ThumbsUp, MessageSquare, ArrowLeft, ShoppingCart, BookOpen, ArrowRight, CalendarDays, ExternalLink, Store } from "lucide-react"
import * as motion from "motion/react-client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCommunityReviews, getCreatorProductEvents, getKols, getPost, getProduct, getProductOffers, getReviews } from "@/lib/data"
import { getMatrixNodesByProductId } from "@/lib/content-matrix"
import { credibilityToneClass, getKolCredibility } from "@/lib/kol-credibility"
import { AffiliateButton } from "@/components/affiliate-button"
import { SocialShare } from "@/components/social-share"
import { RelatedProducts } from "@/components/related-products"
import { CommentSection } from "@/components/comment-section"
import { WishlistButton } from "@/components/wishlist-button"
import { RealReviewPanel } from "@/components/real-review-panel"
import type { CreatorProductEvent, Kol, Post, ProductOffer } from "@/lib/types"

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function buildProductJsonLd(product: Awaited<ReturnType<typeof getProduct>>, siteUrl: string, preferredOffer?: ProductOffer | null) {
  if (!product) return null
  const numericPrice = (preferredOffer?.price_snapshot ?? product.price).replace(/[^\d]/g, "")
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image.startsWith("/") ? `${siteUrl}${product.image}` : product.image,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
    offers: numericPrice
      ? {
          "@type": "Offer",
          priceCurrency: "VND",
          price: numericPrice,
          availability: "https://schema.org/InStock",
          url: preferredOffer?.affiliate_url ?? preferredOffer?.seller_url ?? `${siteUrl}/products/${product.id}`,
        }
      : undefined,
  }
}

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

function eventTypeLabel(event: CreatorProductEvent) {
  const labels: Record<CreatorProductEvent["event_type"], string> = {
    first_seen: "Bắt đầu theo dõi",
    used: "Đã dùng",
    reviewed: "Đã review",
    recommended: "Recommend",
    disliked: "Không hợp",
    emptied: "Dùng hết",
    repurchased: "Mua lại",
    live_sold: "Live bán",
    sponsored: "Tài trợ",
  }
  return labels[event.event_type]
}

function disclosureLabel(event: CreatorProductEvent) {
  const labels: Record<CreatorProductEvent["disclosure"], string> = {
    organic: "Tự mua/organic",
    pr: "PR",
    sponsored: "Tài trợ",
    affiliate: "Affiliate",
    unknown: "Chưa rõ",
  }
  return labels[event.disclosure]
}

function sentimentClass(event: CreatorProductEvent) {
  if (event.sentiment === "positive") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  if (event.sentiment === "negative") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  if (event.sentiment === "mixed") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
}

function kolForEvent(event: CreatorProductEvent, kols: Kol[]) {
  return kols.find((kol) => kol.id === event.creator_id)
}

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
  const communityReviews = await getCommunityReviews({ productId: id });
  const productOffers = await getProductOffers({ productId: id });
  const preferredOffer = productOffers.find((offer) => offer.is_preferred && offer.affiliate_url)
    ?? productOffers.find((offer) => offer.affiliate_url)
    ?? productOffers.find((offer) => offer.is_preferred)
    ?? productOffers[0]
    ?? null
  const affiliateHref = preferredOffer?.affiliate_url ?? product.affiliate_url
  const timelineEvents = await getCreatorProductEvents({ productId: id })
  const matrixNodes = getMatrixNodesByProductId(product.id)
  const graphKolIds = new Set(matrixNodes.flatMap((node) => node.kolIds))
  const sortedReviews = [...reviews].sort((a, b) => Number(graphKolIds.has(b.kolid)) - Number(graphKolIds.has(a.kolid)))
  const graphPostSlugs = unique(matrixNodes.flatMap((node) => [node.articleSlug, ...node.nextArticleSlugs])).slice(0, 4)
  const graphPosts = (await Promise.all(graphPostSlugs.map((slug) => getPost(slug)))).filter((post): post is Post => Boolean(post))
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://360dep.vn"
  const productJsonLd = buildProductJsonLd(product, siteUrl, preferredOffer)
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      {productJsonLd && <JsonLd data={productJsonLd} />}
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
                    {affiliateHref ? (
                      <div className="flex-1">
                        <AffiliateButton href={affiliateHref} productId={product.id} offerId={preferredOffer?.id} />
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
                  {preferredOffer && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-50">
                          <Store className="h-4 w-4 text-orange-500" />
                          {preferredOffer.shop_name}
                        </div>
                        <Badge variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {preferredOffer.marketplace === "shopee" ? "Shopee" : preferredOffer.marketplace}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span>Snapshot: {preferredOffer.price_snapshot ?? product.price}</span>
                        <span>&bull;</span>
                        <span>{preferredOffer.affiliate_url ? "Đã có affiliate URL" : "Đang chờ affiliate URL thật"}</span>
                        {preferredOffer.seller_url && (
                          <>
                            <span>&bull;</span>
                            <a href={preferredOffer.seller_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 dark:text-orange-300">
                              Xem nguồn Shopee <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {graphPosts.length > 0 && (
            <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <div className="mb-5 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-rose-500" />
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Bài nên đọc trước khi mua</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {graphPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group rounded-2xl bg-slate-50 p-4 transition-colors hover:text-rose-600 dark:bg-slate-950 dark:hover:text-rose-300"
                  >
                    <Badge variant="secondary" className="mb-2 bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {post.category}
                    </Badge>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-lg font-black leading-tight text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                        {post.title}
                      </h3>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-500" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-indigo-500" />
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Dòng thời gian KOL/KOC</h2>
                </div>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Các lần sản phẩm xuất hiện trong review, routine, livestream hoặc watchlist theo nguồn đã ghi nhận.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {timelineEvents.length} tín hiệu
              </Badge>
            </div>

            {timelineEvents.length > 0 ? (
              <div className="space-y-4">
                {timelineEvents.map((event) => {
                  const kol = kolForEvent(event, KOLS)
                  if (!kol) return null
                  return (
                    <div key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex gap-4">
                        <Link href={`/koc-tracker/${kol.id}`}>
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm dark:border-slate-800">
                            <AvatarImage src={kol.avatar} />
                            <AvatarFallback>{kol.name[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Link href={`/koc-tracker/${kol.id}`} className="font-bold text-slate-900 transition-colors hover:text-rose-600 dark:text-slate-50 dark:hover:text-rose-300">
                              {kol.name}
                            </Link>
                            <Badge className={sentimentClass(event)}>{event.sentiment}</Badge>
                            <Badge variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                              {disclosureLabel(event)}
                            </Badge>
                          </div>
                          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {formatTimelineDate(event.event_date)} &bull; {eventTypeLabel(event)} &bull; {event.source_platform}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{event.source_title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{event.source_excerpt}</p>
                          {event.usage_context && (
                            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Ngữ cảnh: {event.usage_context}</p>
                          )}
                          {event.source_url && (
                            <a href={event.source_url} target={event.source_url.startsWith("/") ? undefined : "_blank"} rel={event.source_url.startsWith("/") ? undefined : "noopener noreferrer"} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
                              Xem nguồn <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center dark:border-slate-800 dark:bg-slate-950">
                <p className="font-medium text-slate-500 dark:text-slate-400">Chưa có tín hiệu lịch sử cho sản phẩm này.</p>
              </div>
            )}
          </section>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50 mb-8">Đánh giá từ KOL/KOC</h2>
            
            {sortedReviews.length > 0 ? (
              <div className="space-y-6">
                {sortedReviews.map((review) => {
                  const kol = KOLS.find(k => k.id === review.kolid);
                  if (!kol) return null;
                  const credibility = getKolCredibility(kol);
                  
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
                            <Badge variant="outline" className={`rounded-full border text-[10px] ${credibilityToneClass(credibility.tier)}`}>
                              {credibility.shortLabel}
                            </Badge>
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

          <div className="mt-8">
            <RealReviewPanel productId={product.id} productName={product.name} initialReviews={communityReviews} kols={KOLS} />
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

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}
