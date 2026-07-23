export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, ShieldCheck, ThumbsUp, MessageSquare, ArrowLeft, ShoppingCart, BookOpen, ArrowRight, CalendarDays, ExternalLink, Store, CheckCircle2, Layers3, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCommunityReviews, getCreatorProductEvents, getKols, getPost, getProduct, getProductOffers, getReviews } from "@/lib/data"
import { getMatrixNodesByProductId, getMatrixProductGroups, researchStageLabels } from "@/lib/content-matrix"
import { buildCreatorEvidenceMetrics, buildProductDecisionSignal, productEvidenceStatusLabel } from "@/lib/product-decision-signal"
import { getProductCategoryLabel, getProductSubcategoryLabel } from "@/lib/product-taxonomy"
import { AffiliateButton } from "@/components/affiliate-button"
import { TrackProductView } from "@/components/analytics/public-events"
import { TrackedEvidenceLink } from "@/components/analytics/tracked-evidence-link"
import { SocialShare } from "@/components/social-share"
import { WishlistButton } from "@/components/wishlist-button"
import { ProductCommunityModules } from "@/components/product-community-modules"
import { absoluteUrl } from "@/lib/seo"
import { getTikTokPostId } from "@/lib/evidence-source"
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
  const numericPrice = preferredOffer?.price_snapshot?.replace(/[^\d]/g, "") ?? ""
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
    aggregateRating: product.reviews > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviews,
        }
      : undefined,
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
    first_seen: "Tin mới ghi nhận",
    mentioned: "Được nhắc tới",
    unboxed: "Mở hộp",
    used: "Đã dùng",
    reviewed: "Đã review",
    recommended: "Recommend",
    disliked: "Không hợp",
    emptied: "Dùng hết",
    repurchased: "Mua lại",
    switched_to: "Chuyển sang dùng",
    stopped_using: "Ngừng dùng",
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
    return { title: 'Sản phẩm không tồn tại' }
  }

  const description = product.description?.length > 160
    ? product.description.substring(0, 157) + '...'
    : product.description
  const title = `${product.name} - ${product.brand}`
  const url = absoluteUrl(`/products/${product.id}`)
  const image = absoluteUrl(product.image)

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: "360dep.vn",
      url,
      title: `${title} | 360dep.vn`,
      description,
      images: [
        {
          url: image,
          alt: `${product.name} - ${product.brand}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 360dep.vn`,
      description,
      images: [image],
    },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await getProduct(id);
  if (!product) return notFound();

  const [KOLS, reviews, communityReviews, productOffers, timelineEvents] = await Promise.all([
    getKols(),
    getReviews({ productId: id }),
    getCommunityReviews({ productId: id }),
    getProductOffers({ productId: id }),
    getCreatorProductEvents({ productId: id }),
  ])
  const preferredOffer = productOffers.find((offer) => offer.is_preferred && offer.affiliate_url)
    ?? productOffers.find((offer) => offer.affiliate_url)
    ?? productOffers.find((offer) => offer.is_preferred)
    ?? productOffers[0]
    ?? null
  const affiliateHref = preferredOffer?.affiliate_url ?? preferredOffer?.seller_url ?? product.affiliate_url
  const matrixNodes = getMatrixNodesByProductId(product.id)
  const graphKolIds = new Set(matrixNodes.flatMap((node) => node.kolIds))
  const auditedReviews = reviews.filter((review) => timelineEvents.some((event) => event.creator_id === review.kolid && event.product_id === review.productid))
  const sortedReviews = [...auditedReviews].sort((a, b) => Number(graphKolIds.has(b.kolid)) - Number(graphKolIds.has(a.kolid)))
  const graphPostSlugs = unique(matrixNodes.flatMap((node) => [node.articleSlug, ...node.nextArticleSlugs])).slice(0, 4)
  const graphPosts = (await Promise.all(graphPostSlugs.map((slug) => getPost(slug)))).filter((post): post is Post => Boolean(post))
  const matrixProductGroups = getMatrixProductGroups(unique(matrixNodes.flatMap((node) => node.productGroupKeys))).filter((group) => [
    ...group.productIds,
    ...group.comparisonProductIds,
  ].includes(product.id))
  const researchStages = unique(matrixNodes.map((node) => researchStageLabels[node.stage])).slice(0, 3)
  const signalCreatorIds = unique([...timelineEvents.map((event) => event.creator_id), ...auditedReviews.map((review) => review.kolid)])
  const signalCreators = signalCreatorIds.map((creatorId) => KOLS.find((kol) => kol.id === creatorId)).filter((kol): kol is Kol => Boolean(kol)).slice(0, 4)
  const decisionSignal = buildProductDecisionSignal(timelineEvents)
  const leadGroup = matrixProductGroups[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://360dep.vn"
  const productJsonLd = buildProductJsonLd(product, siteUrl, preferredOffer)
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      {productJsonLd && <JsonLd data={productJsonLd} />}
      <TrackProductView productId={product.id} brand={product.brand} category={product.category_key ?? product.category} />
      <div className="container mx-auto px-4 md:px-6">
        <div>
          <Link href="/products" className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
          </Link>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                  className="object-contain p-6"
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
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {product.reviews > 0 ? (
                    <>
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-lg text-amber-700 dark:text-amber-500 font-bold">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {product.rating}
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{product.reviews.toLocaleString()} đánh giá cộng đồng đã duyệt</span>
                    </>
                  ) : (
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Chưa có đánh giá cộng đồng
                    </span>
                  )}
                  {product.sold && product.sold !== "Đang cập nhật" && (
                    <><span className="text-slate-300 dark:text-slate-700">&bull;</span><span className="text-slate-500 dark:text-slate-400 font-medium">{product.sold} đã bán</span></>
                  )}
                  <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300">
                    {productEvidenceStatusLabel(decisionSignal.evidenceStatus)}
                  </Badge>
                  {decisionSignal.commercialBuzz && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                      Độ phủ thương mại cao
                    </Badge>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">{preferredOffer?.price_snapshot ?? product.price}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{preferredOffer ? `Giá ghi nhận gần nhất từ ${preferredOffer.shop_name}` : "Giá tham khảo, chưa phải giá bán đã được kiểm tra"}</div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  {product.description}
                </p>

                {product.source_url && (
                  <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-rose-200 hover:text-rose-600 dark:border-slate-700 dark:text-slate-200 dark:hover:text-rose-300">
                    Nguồn dữ liệu: {product.source_label || "Trang sản phẩm"} <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge className="bg-slate-900 text-white hover:bg-slate-900 dark:bg-slate-50 dark:text-slate-900">
                    {getProductCategoryLabel(product.category_key, product.category)}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {getProductSubcategoryLabel(product.category_key, product.subcategory_key)}
                  </Badge>
                  {product.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{tag}</Badge>
                  ))}
                </div>

                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  <DecisionMetric icon={<Users className="h-4 w-4" />} label="Nguồn creator độc lập" value={`${decisionSignal.independentCreatorCount}`} detail={signalCreators.length ? signalCreators.map((kol) => kol.name).join(", ") : "Chưa có nguồn creator đã duyệt"} />
                  <DecisionMetric icon={<ShieldCheck className="h-4 w-4" />} label="Mức độ bằng chứng" value={`${decisionSignal.supportScore}/100`} detail={`${decisionSignal.supportCount} tín hiệu ủng hộ · ${decisionSignal.cautionCount} điểm cần lưu ý`} />
                  <DecisionMetric icon={<Store className="h-4 w-4" />} label="Nội dung thương mại" value={`${decisionSignal.commercialShare}%`} detail="Tỷ lệ nguồn có PR, tài trợ hoặc liên kết tiếp thị" />
                  <DecisionMetric icon={<MessageSquare className="h-4 w-4" />} label="Đánh giá đã đối chiếu" value={`${auditedReviews.length + communityReviews.length}`} detail={`${auditedReviews.length} từ creator · ${communityReviews.length} từ cộng đồng`} />
                  <DecisionMetric icon={<Layers3 className="h-4 w-4" />} label="Bài hướng dẫn liên quan" value={`${matrixNodes.length}`} detail={researchStages.length ? researchStages.join(" / ") : "Chưa có bài hướng dẫn phù hợp"} />
                  <DecisionMetric icon={<Store className="h-4 w-4" />} label="Nơi mua đã kiểm tra" value={preferredOffer ? "Đã có" : "Chưa có"} detail={preferredOffer?.shop_name ?? "Chưa có đường dẫn mua đã được kiểm tra"} />
                </div>

                {(leadGroup || decisionSignal.supportCount > 0 || decisionSignal.cautionCount > 0) && (
                  <div className="mb-8 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Tóm tắt trước khi mua
                    </div>
                    <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {leadGroup && <p><span className="font-bold text-slate-900 dark:text-slate-50">Nên cân nhắc:</span> {leadGroup.whenToConsider}</p>}
                      {leadGroup && <p><span className="font-bold text-slate-900 dark:text-slate-50">Tránh khi:</span> {leadGroup.whenToAvoid}</p>}
                      {(decisionSignal.supportCount > 0 || decisionSignal.cautionCount > 0) && (
                        <p><span className="font-bold text-slate-900 dark:text-slate-50">Nguồn đã đối chiếu:</span> {decisionSignal.supportCount} tín hiệu ủng hộ, {decisionSignal.cautionCount} điểm cần đọc kèm bối cảnh; {decisionSignal.commercialShare}% nguồn có yếu tố thương mại.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-4">
                  <div className="flex gap-4">
                    {affiliateHref ? (
                      <div className="flex-1">
                        <AffiliateButton href={affiliateHref} productId={product.id} offerId={preferredOffer?.id} />
                      </div>
                    ) : (
                      <Button className="flex-1 h-14 rounded-xl bg-slate-200 text-slate-600 font-bold text-base shadow-none disabled:opacity-100 dark:bg-slate-800 dark:text-slate-300" disabled>
                        <ShoppingCart className="h-5 w-5 mr-2" /> Chưa có nơi mua đã kiểm tra
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
                        <span>Giá ghi nhận: {preferredOffer.price_snapshot ?? product.price}</span>
                        <span>&bull;</span>
                        <span>{preferredOffer.affiliate_url ? "Liên kết tiếp thị; giá mua không đổi" : "Liên kết trực tiếp từ cửa hàng"}</span>
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

          {matrixProductGroups.length > 0 && (
            <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Layers3 className="h-5 w-5 text-emerald-500" />
                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Có phù hợp với bạn không?</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Đối chiếu nhu cầu và dấu hiệu nên tránh trước khi tìm nơi mua.
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {matrixProductGroups.length} nhóm
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {matrixProductGroups.map((group) => (
                  <div key={group.key} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="font-display text-lg font-black text-slate-900 dark:text-slate-50">{group.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{group.description}</p>
                    <div className="mt-4 grid gap-3">
                      <DecisionNote label="Nên cân nhắc" value={group.whenToConsider} tone="good" />
                      <DecisionNote label="Tránh khi" value={group.whenToAvoid} tone="caution" />
                    </div>
                  </div>
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
                  Các lần sản phẩm xuất hiện trong review, routine, livestream hoặc tin công khai đã ghi nhận.
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
                  const sourcePostId = event.source_post_id ?? getTikTokPostId(event.source_url)
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
                            <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                              Độ tin cậy {event.confidence}/100
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
                            <TrackedEvidenceLink href={event.source_url} creatorId={event.creator_id} productId={event.product_id} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
                              Mở clip TikTok gốc{sourcePostId ? ` · ID ${sourcePostId}` : ""} <ExternalLink className="h-3 w-3" />
                            </TrackedEvidenceLink>
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
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50 mb-8">Đánh giá creator có nguồn</h2>
            
            {sortedReviews.length > 0 ? (
              <div className="space-y-6">
                {sortedReviews.map((review) => {
                  const kol = KOLS.find(k => k.id === review.kolid);
                  if (!kol) return null;
                  const creatorMetrics = buildCreatorEvidenceMetrics(kol, timelineEvents.filter((event) => event.creator_id === kol.id));
                  const reviewEvidence = timelineEvents.find((event) => event.creator_id === review.kolid && event.product_id === review.productid);
                  
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
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                              Mức đủ nguồn {creatorMetrics.evidenceCompleteness}/100
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
                          {reviewEvidence && (
                            <Badge variant="secondary" className="bg-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {disclosureLabel(reviewEvidence)}
                            </Badge>
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

          <ProductCommunityModules
            productId={product.id}
            productName={product.name}
            category={product.category}
            initialReviews={communityReviews}
            kols={KOLS}
          />
        </div>
      </div>
    </div>
  )
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function DecisionMetric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <span className="text-rose-500">{icon}</span>
        {label}
      </div>
      <div className="font-display text-xl font-black text-slate-900 dark:text-slate-50">{value}</div>
      <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{detail}</div>
    </div>
  )
}

function DecisionNote({ label, value, tone }: { label: string; value: string; tone: "good" | "caution" | "neutral" }) {
  const toneClass = tone === "good"
    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
    : tone === "caution"
      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
      : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300"

  return (
    <div className={`rounded-xl p-3 text-sm leading-relaxed ${toneClass}`}>
      <span className="font-bold">{label}:</span> {value}
    </div>
  )
}
