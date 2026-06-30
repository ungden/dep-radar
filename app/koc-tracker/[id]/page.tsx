export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Star, ShieldCheck, ArrowLeft, ExternalLink, Users, Award,
  Layers, CalendarDays, Sparkles, MapPin, Building2, Tag, UserRound, ShieldQuestion, Quote, PackageCheck,
} from "lucide-react"
import * as motion from "motion/react-client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlatformBadge } from "@/components/platform-badge"
import { getCreatorProductEvents, getKol, getPost, getProducts, getReviews } from "@/lib/data"
import { getMatrixNodesByKolId, getMatrixProductGroups } from "@/lib/content-matrix"
import { credibilityToneClass, getKolCredibility } from "@/lib/kol-credibility"
import { parseFollowers } from "@/lib/kols-data"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { CreatorProductEvent, Kol, KolSocial, Post, Product } from "@/lib/types"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const kol = await getKol(id)

  if (!kol) {
    return { title: 'KOL/KOC không tồn tại | 360dep.vn' }
  }

  const description = kol.bio
    ? kol.bio.replace(/\s+/g, " ").slice(0, 200)
    : `Hồ sơ ${kol.name} trên ${kol.platform}. ${kol.followers} followers. Xem đánh giá sản phẩm làm đẹp từ ${kol.name} tại 360dep.vn.`

  return {
    title: `${kol.name} - Hồ sơ KOL/KOC làm đẹp | 360dep.vn`,
    description,
    openGraph: {
      title: `${kol.name} - Hồ sơ KOL/KOC làm đẹp | 360dep.vn`,
      description,
    },
  }
}

function socialList(kol: Kol): KolSocial[] {
  if (kol.socials && kol.socials.length > 0) return kol.socials
  return [{ platform: kol.platform, handle: kol.handle, followers: kol.followers }]
}

function formatReach(total: number): string {
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(total >= 10_000_000 ? 0 : 1)}M`
  if (total >= 1_000) return `${Math.round(total / 1_000)}K`
  return String(total)
}

function buildSocialUrl(s: KolSocial): string {
  if (s.url) return s.url
  const h = s.handle.replace(/^@/, "")
  switch (s.platform) {
    case "Youtube": return `https://www.youtube.com/@${h}`
    case "Tiktok": return `https://www.tiktok.com/@${h}`
    case "Instagram": return `https://www.instagram.com/${h}`
    case "Facebook": return `https://www.facebook.com/${h}`
    default: return "#"
  }
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function buildKolJsonLd(kol: Kol, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: kol.realName || kol.name,
      alternateName: kol.name,
      description: kol.bio ?? kol.recentreview,
      url: `${siteUrl}/koc-tracker/${kol.id}`,
      image: kol.avatar.startsWith("/") ? `${siteUrl}${kol.avatar}` : kol.avatar,
      sameAs: socialList(kol).map(buildSocialUrl).filter((url) => url !== "#"),
      knowsAbout: [...(kol.specialties ?? []), ...(kol.categories ?? [])],
    },
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

export default async function KocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const kol = await getKol(id)
  if (!kol) return notFound()

  const PRODUCTS = await getProducts()
  const reviews = await getReviews({ kolId: id })
  const timelineEvents = await getCreatorProductEvents({ creatorId: id })
  const matrixNodes = getMatrixNodesByKolId(kol.id)
  const graphPostSlugs = unique(matrixNodes.flatMap((node) => [node.articleSlug, ...node.nextArticleSlugs])).slice(0, 5)
  const graphPosts = (await Promise.all(graphPostSlugs.map((slug) => getPost(slug)))).filter((post): post is Post => Boolean(post))
  const graphProductIds = unique(matrixNodes.flatMap((node) => [
    ...node.productIds,
    ...getMatrixProductGroups(node.productGroupKeys).flatMap((group) => [...group.productIds, ...group.comparisonProductIds]),
  ]))
  const graphProducts = graphProductIds.map((productId) => PRODUCTS.find((product) => product.id === productId)).filter((product): product is Product => Boolean(product)).slice(0, 4)

  const socials = socialList(kol)
  const totalReach = formatReach(socials.reduce((sum, s) => sum + parseFollowers(s.followers), 0))
  const bioParagraphs = kol.bio ? kol.bio.split(/\n\n+/).map(p => p.trim()).filter(Boolean) : []
  const primaryUrl = buildSocialUrl(socials[0])
  const credibility = getKolCredibility(kol)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://360dep.vn"
  // Cover: real banner (6 originals) > blurred avatar (when we have a photo) > brand gradient.
  const realCover = kol.cover && kol.cover.startsWith("/") && !kol.cover.includes("picsum") ? kol.cover : null
  const coverFromAvatar = !realCover && kol.avatar && kol.avatar.startsWith("/images/") ? kol.avatar : null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      <JsonLd data={buildKolJsonLd(kol, siteUrl)} />
      {/* Cover */}
      <div className="h-64 md:h-80 w-full relative bg-gradient-to-br from-rose-200 via-rose-100 to-indigo-200 dark:from-rose-950/40 dark:via-slate-900 dark:to-indigo-950/40">
        {realCover && (
          <Image src={realCover} alt="" fill sizes="100vw" priority className="object-cover" referrerPolicy="no-referrer" />
        )}
        {coverFromAvatar && (
          <Image src={coverFromAvatar} alt="" fill sizes="100vw" priority className="object-cover blur-2xl scale-110 opacity-60" referrerPolicy="no-referrer" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 dark:from-slate-950/80 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/koc-tracker" className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-6 transition-colors drop-shadow-md">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
          </Link>

          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-slate-900 shadow-xl ring-4 ring-slate-50 dark:ring-slate-800">
              <AvatarImage src={kol.avatar} />
              <AvatarFallback className="text-4xl font-bold">{kol.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50">{kol.name}</h1>
                {kol.verified && <ShieldCheck className="h-8 w-8 text-blue-500" />}
              </div>
              <Badge variant="outline" className={`mb-3 rounded-full border px-3 py-1 ${credibilityToneClass(credibility.tier)}`}>
                {credibility.label}
              </Badge>
              {kol.realName && kol.realName !== kol.name && (
                <p className="text-slate-500 dark:text-slate-400 mb-3">Tên thật: {kol.realName}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {Array.from(new Set(socials.map(s => s.platform))).map(p => (
                  <PlatformBadge key={p} platform={p} size="md" />
                ))}
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng follower</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{totalReach}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nền tảng</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{new Set(socials.map(s => s.platform)).size}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Độ tin cậy</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{credibility.credibilityScore}/100</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <ShieldQuestion className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Độ phủ</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{credibility.influenceScore}/100</div>
                  </div>
                </div>
                {kol.activeSince && (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hoạt động từ</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{kol.activeSince}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3">
              <Button className="w-full md:w-48 h-12 rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold">
                Theo dõi
              </Button>
              <Button asChild variant="outline" className="w-full md:w-48 h-12 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Kênh chính thức
                </a>
              </Button>
            </div>
          </div>

          {/* Dossier body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              {bioParagraphs.length > 0 && (
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-rose-500" /> Giới thiệu
                  </h2>
                  <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {bioParagraphs.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </section>
              )}

              {kol.knownFor && kol.knownFor.length > 0 && (
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" /> Nổi bật vì
                  </h2>
                  <ul className="space-y-3">
                    {kol.knownFor.map((item, i) => (
                      <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {kol.contentStyle && (
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <Quote className="h-5 w-5 text-indigo-500" /> Phong cách nội dung
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{kol.contentStyle}</p>
                </section>
              )}

              {kol.reviewHighlights && kol.reviewHighlights.length > 0 && (
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" /> Review tiêu biểu
                  </h2>
                  <div className="space-y-3">
                    {kol.reviewHighlights.map((r, i) => {
                      const tone = r.sentiment === "negative"
                        ? "border-rose-200 dark:border-rose-900/50"
                        : r.sentiment === "mixed"
                          ? "border-amber-200 dark:border-amber-900/50"
                          : "border-emerald-200 dark:border-emerald-900/50"
                      return (
                        <div key={i} className={`rounded-2xl border ${tone} bg-slate-50 dark:bg-slate-800/40 p-4`}>
                          <div className="font-bold text-slate-900 dark:text-slate-50 mb-1">{r.product}</div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.verdict}</p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {(graphPosts.length > 0 || graphProducts.length > 0) && (
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <BookOpenIcon /> Liên kết research từ graph
                  </h2>
                  {graphPosts.length > 0 && (
                    <div className="mb-6">
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bài viết liên quan đến chuyên môn này</div>
                      <div className="grid gap-3">
                        {graphPosts.map((post) => (
                          <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group rounded-2xl bg-slate-50 p-4 transition-colors hover:text-rose-600 dark:bg-slate-950 dark:hover:text-rose-300"
                          >
                            <div className="font-display text-lg font-black leading-tight text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                              {post.title}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{post.excerpt}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {graphProducts.length > 0 && (
                    <div>
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản phẩm/KOC review liên quan</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {graphProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            className="group rounded-2xl bg-slate-50 p-4 transition-colors hover:text-rose-600 dark:bg-slate-950 dark:hover:text-rose-300"
                          >
                            <div className="text-xs font-bold uppercase tracking-wider text-rose-500">{product.brand}</div>
                            <div className="mt-1 font-bold leading-tight text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                              {product.name}
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{product.price}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      <PackageCheck className="h-5 w-5 text-indigo-500" /> Dòng thời gian sản phẩm
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      Các lần {kol.name} dùng, review, recommend hoặc được hệ thống bắt đầu theo dõi với một sản phẩm.
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {timelineEvents.length} tín hiệu
                  </Badge>
                </div>

                {timelineEvents.length > 0 ? (
                  <div className="relative space-y-4">
                    <div className="absolute bottom-4 left-4 top-4 w-px bg-slate-200 dark:bg-slate-800" />
                    {timelineEvents.map((event) => {
                      const product = PRODUCTS.find((item) => item.id === event.product_id)
                      if (!product) return null
                      return (
                        <div key={event.id} className="relative pl-10">
                          <span className="absolute left-2 top-5 h-4 w-4 rounded-full border-4 border-white bg-rose-500 shadow-sm dark:border-slate-900" />
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                {formatTimelineDate(event.event_date)}
                              </Badge>
                              <Badge className={sentimentClass(event)}>{event.sentiment}</Badge>
                              <Badge variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                {disclosureLabel(event)}
                              </Badge>
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              {eventTypeLabel(event)} &bull; {event.source_platform}
                            </div>
                            <Link href={`/products/${product.id}`} className="mt-1 block font-display text-lg font-black leading-tight text-slate-900 transition-colors hover:text-rose-600 dark:text-slate-50 dark:hover:text-rose-300">
                              {product.name}
                            </Link>
                            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{product.brand} &bull; {product.price}</p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{event.source_excerpt}</p>
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
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center dark:border-slate-800 dark:bg-slate-950">
                    <p className="font-medium text-slate-500 dark:text-slate-400">Chưa có timeline sản phẩm cho {kol.name}.</p>
                  </div>
                )}
              </section>

              {/* Reviews on the platform */}
              <section>
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50 mb-6">Sản phẩm đã đánh giá</h2>
                {reviews.length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    initial="hidden"
                    animate="show"
                    variants={containerVariants}
                  >
                    {reviews.map((review) => {
                      const product = PRODUCTS.find(p => p.id === review.productid)
                      if (!product) return null
                      return (
                        <motion.div key={review.id} variants={itemVariants}>
                          <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl h-full flex flex-col">
                            <CardContent className="p-5 flex-1 flex flex-col">
                              <div className="flex gap-4 mb-4">
                                <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                  <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex flex-col justify-center">
                                  <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">{product.brand}</div>
                                  <Link href={`/products/${product.id}`} className="font-bold text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 line-clamp-2 transition-colors">
                                    {product.name}
                                  </Link>
                                </div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-auto">
                                <div className="flex items-center gap-1 mb-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"}`} />
                                  ))}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic line-clamp-2">
                                  &quot;{review.content}&quot;
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có bài đánh giá nào của {kol.name} trên hệ thống.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" /> Độ tin cậy
                </h3>
                <div className="mb-3 flex items-end gap-2">
                  <span className="font-display text-4xl font-black text-slate-900 dark:text-slate-50">{credibility.credibilityScore}</span>
                  <span className="pb-1 text-sm font-bold text-slate-400">/100</span>
                </div>
                <Badge variant="outline" className={`mb-4 rounded-full border ${credibilityToneClass(credibility.tier)}`}>
                  {credibility.label}
                </Badge>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{credibility.summary}</p>
                {credibility.strengths.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Điểm cộng</div>
                    <ul className="space-y-2">
                      {credibility.strengths.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {credibility.cautions.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">Cần đọc kèm bối cảnh</div>
                    <ul className="space-y-2">
                      {credibility.cautions.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Quick facts */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Thông tin nhanh</h3>
                <dl className="space-y-3 text-sm">
                  {kol.realName && (
                    <div className="flex items-start gap-3">
                      <UserRound className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                      <div><dt className="text-slate-400 dark:text-slate-500">Tên thật</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{kol.realName}</dd></div>
                    </div>
                  )}
                  {kol.basedIn && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                      <div><dt className="text-slate-400 dark:text-slate-500">Hoạt động tại</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{kol.basedIn}</dd></div>
                    </div>
                  )}
                  {kol.activeSince && (
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                      <div><dt className="text-slate-400 dark:text-slate-500">Hoạt động từ</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{kol.activeSince}</dd></div>
                    </div>
                  )}
                  {kol.ownBrand && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                      <div><dt className="text-slate-400 dark:text-slate-500">Thương hiệu riêng</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{kol.ownBrand}</dd></div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Tag className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <dt className="text-slate-400 dark:text-slate-500 mb-1.5">Chuyên môn</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {(kol.specialties && kol.specialties.length > 0 ? kol.specialties : kol.categories).map(c => (
                          <Badge key={c} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{c}</Badge>
                        ))}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              {/* Signature products */}
              {kol.signatureProducts && kol.signatureProducts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Sản phẩm gắn liền</h3>
                  <div className="flex flex-wrap gap-2">
                    {kol.signatureProducts.map((p, i) => (
                      <span key={i} className="rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-sm px-3 py-1.5">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Platforms */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Nền tảng</h3>
                <div className="space-y-2">
                  {socials.map((s) => (
                    <a
                      key={s.platform + s.handle}
                      href={buildSocialUrl(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PlatformBadge platform={s.platform} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{s.handle}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.followers}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Transparency */}
              {kol.transparencyNote && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <ShieldQuestion className="h-4 w-4" /> Minh bạch
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{kol.transparencyNote}</p>
                </div>
              )}
            </aside>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function BookOpenIcon() {
  return <Layers className="h-5 w-5 text-cyan-500" />
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}
