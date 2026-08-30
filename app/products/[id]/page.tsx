export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, ShieldCheck, MessageSquare, ArrowLeft, ShoppingCart, BookOpen, ArrowRight, CalendarDays, ExternalLink, Store, Layers3, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCommunityReviews, getCreatorProductEvents, getKols, getPost, getProduct, getProductOffers } from "@/lib/data"
import { getMatrixNodesByProductId, getMatrixProductGroups } from "@/lib/content-matrix"
import { buildProductObservationSummary, productObservationStatusLabel } from "@/lib/product-observation"
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
    recommended: "Creator khuyên dùng",
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

  const [KOLS, communityReviews, productOffers, timelineEvents] = await Promise.all([
    getKols(),
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
  const graphPostSlugs = unique(matrixNodes.flatMap((node) => [node.articleSlug, ...node.nextArticleSlugs])).slice(0, 4)
  const graphPosts = (await Promise.all(graphPostSlugs.map((slug) => getPost(slug)))).filter((post): post is Post => Boolean(post))
  const matrixProductGroups = getMatrixProductGroups(unique(matrixNodes.flatMap((node) => node.productGroupKeys))).filter((group) => [
    ...group.productIds,
    ...group.comparisonProductIds,
  ].includes(product.id))
  const signalCreatorIds = unique(timelineEvents.map((event) => event.creator_id))
  const signalCreators = signalCreatorIds.map((creatorId) => KOLS.find((kol) => kol.id === creatorId)).filter((kol): kol is Kol => Boolean(kol)).slice(0, 4)
  const observation = buildProductObservationSummary(timelineEvents)
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
                    {productObservationStatusLabel(observation.observationStatus)}
                  </Badge>
                  {observation.hasMostlyCommercialSources && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                      Phần lớn clip có yếu tố thương mại
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

                <div className="mb-8 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-relaxed text-cyan-950 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-cyan-100">
                  <span className="font-bold">Phạm vi của 360dep:</span> chúng tôi chỉ đối chiếu đúng creator, đúng sản phẩm và đúng clip công khai. Nhận xét, trải nghiệm và lời khuyên là phát ngôn của creator; 360dep không xác nhận hiệu quả và không dùng số lần xuất hiện để kết luận sản phẩm tốt hay đáng mua.
                </div>

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
                  <DecisionMetric icon={<Users className="h-4 w-4" />} label="Creator được ghi nhận" value={`${observation.independentCreatorCount}`} detail={signalCreators.length ? signalCreators.map((kol) => kol.name).join(", ") : "Chưa có creator với clip đã duyệt"} />
                  <DecisionMetric icon={<ShieldCheck className="h-4 w-4" />} label="Clip đã đối chiếu SKU" value={`${observation.verifiedClipCount}`} detail="Đếm clip đúng creator, đúng sản phẩm và có URL gốc" />
                  <DecisionMetric icon={<CalendarDays className="h-4 w-4" />} label="Clip có hành vi sử dụng" value={`${observation.directUseCount}`} detail="Dùng, dùng hết, mua lại, chuyển sang hoặc ngừng dùng" />
                  <DecisionMetric icon={<Store className="h-4 w-4" />} label="Clip có yếu tố thương mại" value={`${observation.commercialClipCount}/${observation.verifiedClipCount}`} detail={`${observation.commercialShare}% clip có PR, tài trợ hoặc liên kết tiếp thị`} />
                  <DecisionMetric icon={<MessageSquare className="h-4 w-4" />} label="Đánh giá cộng đồng" value={`${communityReviews.length}`} detail="Tách riêng với phát ngôn của creator" />
                  <DecisionMetric icon={<Store className="h-4 w-4" />} label="Nơi mua đã kiểm tra" value={preferredOffer ? "Đã có" : "Chưa có"} detail={preferredOffer?.shop_name ?? "Chưa có đường dẫn mua đã được kiểm tra"} />
                </div>

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
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Ai đã dùng hoặc nhắc sản phẩm này?</h2>
                </div>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Danh sách quan sát theo clip công khai. Việc xuất hiện nhiều lần không đồng nghĩa sản phẩm hiệu quả hơn.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {timelineEvents.length} clip đã duyệt
              </Badge>
            </div>

            {timelineEvents.length > 0 ? (
              <div className="space-y-4">
                {timelineEvents.map((event) => {
                  const kol = kolForEvent(event, KOLS)
                  if (!kol) return null
                  const sourcePostId = event.source_post_id ?? getTikTokPostId(event.source_url)
                  const directQuote = event.evidence_spans?.find((span) => span.kind === "quote" || span.kind === "caption")
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
                            <Badge variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                              {disclosureLabel(event)}
                            </Badge>
                            <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                              Khớp SKU/clip {event.confidence_score ?? "đã duyệt"}{event.confidence_score != null ? "%" : ""}
                            </Badge>
                          </div>
                          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {formatTimelineDate(event.event_date)} &bull; {eventTypeLabel(event)} &bull; {event.source_platform}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{event.source_title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300"><span className="font-bold">360dep ghi nhận:</span> {event.source_excerpt}</p>
                          {directQuote && (
                            <blockquote className="mt-2 border-l-2 border-rose-300 pl-3 text-sm italic leading-relaxed text-slate-700 dark:border-rose-800 dark:text-slate-200">
                              “{directQuote.value}”
                            </blockquote>
                          )}
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
                <p className="font-medium text-slate-500 dark:text-slate-400">Chưa có clip công khai đã đối chiếu cho sản phẩm này.</p>
              </div>
            )}
          </section>

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
