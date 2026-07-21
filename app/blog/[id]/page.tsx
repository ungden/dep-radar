export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, MessageSquare, Tag } from "lucide-react"
import * as motion from "motion/react-client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrackArticleRead } from "@/components/analytics/public-events"
import { EDITORIAL_AUTHOR_AVATAR, EDITORIAL_AUTHOR_NAME, getCanonicalPostSlug, getPost, getPostProductRecommendations, getPosts, getProducts } from "@/lib/data"
import { LikeButton } from "@/components/like-button"
import { SocialShare } from "@/components/social-share"
import { CommentSection } from "@/components/comment-section"
import { getCatalogueSection } from "@/lib/catalogue"
import { articleHref, buildRelatedArticles, getGraphNodeForPost } from "@/lib/content-graph"
import { getMatrixProductGroups, researchStageLabels, type ProductGroup } from "@/lib/content-matrix"
import { absoluteUrl, postPath } from "@/lib/seo"
import type { Post, Product } from "@/lib/types"

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function buildBlogJsonLd(post: Post, nextPosts: Post[], products: Product[], siteUrl: string) {
  const articleUrl = `${siteUrl}/blog/${post.slug}`
  const items: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      image: post.image ? [`${siteUrl}${post.image.startsWith("/") ? post.image : `/${post.image}`}`] : [],
      datePublished: post.created_at,
      author: {
        "@type": "Organization",
        name: EDITORIAL_AUTHOR_NAME,
      },
      publisher: {
        "@type": "Organization",
        name: "360dep.vn",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/brand/icon-192.png`,
        },
      },
      mainEntityOfPage: articleUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "360dep.vn", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
      ],
    },
  ]

  if (post.faq && post.faq.length > 0) {
    items.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    })
  }

  const journeyItems = [
    ...nextPosts.map((item) => ({ name: item.title, url: `${siteUrl}/blog/${item.slug}` })),
    ...products.map((item) => ({ name: item.name, url: `${siteUrl}/products/${item.id}` })),
  ]

  if (journeyItems.length > 0) {
    items.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Đọc tiếp sau: ${post.title}`,
      itemListElement: journeyItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    })
  }

  return items
}

function renderPostContent(content: string) {
  return content.split("\n\n").map((block, index) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={index} className="mt-10 text-2xl font-display font-black tracking-tight text-slate-900 dark:text-slate-50">
          {block.replace(/^##\s+/, "")}
        </h2>
      )
    }

    if (block.startsWith("- ")) {
      return (
        <ul key={index} className="my-5 space-y-2 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
          {block.split("\n").map((item) => (
            <li key={item} className="flex gap-3 text-slate-700 dark:text-slate-300">
              {item.startsWith("- [ ] ") ? (
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-white dark:border-rose-900 dark:bg-slate-900" />
              ) : (
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              )}
              <span>{item.replace(/^-\s+(?:\[\s\]\s+)?/, "")}</span>
            </li>
          ))}
        </ul>
      )
    }

    return (
      <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {block}
      </p>
    )
  })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    return { title: 'Bài viết không tồn tại | Blog' }
  }
  const title = `${post.title} | Blog 360dep.vn`
  const url = absoluteUrl(postPath(post))
  const image = absoluteUrl(post.image)

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      siteName: "360dep.vn",
      url,
      title,
      description: post.excerpt,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt,
      images: [image],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const canonicalAlias = getCanonicalPostSlug(id)
  if (canonicalAlias) redirect(`/blog/${canonicalAlias}`)

  const post = await getPost(id)
  if (!post) return notFound()

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const matrixNode = getGraphNodeForPost(post)
  const [recommendedProducts, allPosts, allProducts] = await Promise.all([
    getPostProductRecommendations(post, 3),
    getPosts(),
    getProducts(),
  ])
  const nextMatrixPosts = matrixNode
    ? matrixNode.nextArticleSlugs.map((slug) => allPosts.find((item) => item.slug === slug)).filter((item): item is Post => Boolean(item)).slice(0, 4)
    : []
  const productGroups = getMatrixProductGroups(matrixNode?.productGroupKeys ?? post.productGroupKeys ?? [])
  const graphProductIds = unique([
    ...(matrixNode?.productIds ?? post.matrixProductIds ?? []),
    ...productGroups.flatMap((group) => [...group.productIds, ...group.comparisonProductIds]),
  ])
  const graphProducts = graphProductIds.map((productId) => allProducts.find((product) => product.id === productId)).filter((product): product is Product => Boolean(product))
  const journeyProducts = uniqueProducts([...graphProducts, ...recommendedProducts]).slice(0, 4)
  const relatedArticles = buildRelatedArticles({ post, posts: allPosts, products: allProducts, limit: 4 })
  const matrixSection = matrixNode ? getCatalogueSection(matrixNode.hubSlug) : null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://360dep.vn"
  const jsonLdItems = buildBlogJsonLd(post, nextMatrixPosts, journeyProducts, siteUrl)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <TrackArticleRead postId={post.id} slug={post.slug} category={post.category} />
      {jsonLdItems.map((item) => (
        <JsonLd key={String(item["@type"])} data={item} />
      ))}
      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 w-full bg-slate-200 dark:bg-slate-800">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-6 transition-colors drop-shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại Kiến thức
          </Link>

          {/* Article Card */}
          <article className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Article Header */}
            <div className="p-6 md:p-10 lg:p-12">
              <div className="max-w-3xl mx-auto">
                {matrixNode && (
                  <div className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                    <Link href={`/catalogue/${matrixNode.hubSlug}`} className="hover:text-rose-600 dark:hover:text-rose-300">
                      Chủ đề {matrixSection?.shortTitle ?? matrixNode.hubSlug}
                    </Link>
                    <span>/</span>
                    <span>{researchStageLabels[matrixNode.stage]}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 rounded-full font-bold">
                    {post.category}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(post.created_at)}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-slate-50 leading-[1.15] mb-8">
                  {post.title}
                </h1>

                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 border-l-4 border-rose-500 pl-6 italic">
                  {post.excerpt}
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pb-8 border-b border-slate-100 dark:border-slate-800">
                  <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-800 shadow-md">
                    <AvatarImage src={EDITORIAL_AUTHOR_AVATAR} />
                    <AvatarFallback>{EDITORIAL_AUTHOR_NAME[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                      {EDITORIAL_AUTHOR_NAME}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Biên tập</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="px-6 md:px-10 lg:px-12 pb-10">
              <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-lg prose-headings:font-display prose-a:text-rose-600 dark:prose-a:text-rose-400">
                {renderPostContent(post.content)}
              </div>
            </div>

            {(post.takeaways?.length || post.faq?.length || post.sourceNotes?.length || post.medicalDisclaimerLevel === "medical") && (
              <div className="px-6 md:px-10 lg:px-12 pb-10">
                <div className="mx-auto grid max-w-3xl gap-5">
                  {post.takeaways && post.takeaways.length > 0 && (
                    <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                      <div className="mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Điểm cần nhớ</h2>
                      </div>
                      <ul className="space-y-3 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                        {post.takeaways.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {post.medicalDisclaimerLevel && post.medicalDisclaimerLevel !== "none" && (
                    <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 text-sm font-semibold leading-relaxed text-slate-700 dark:border-amber-950 dark:bg-amber-950/20 dark:text-slate-300">
                      <div className="mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="font-display text-base font-bold">Lưu ý an toàn</span>
                      </div>
                      Nội dung này dùng để giáo dục và chuẩn bị câu hỏi trước khi mua sản phẩm hoặc làm dịch vụ. Nó không thay thế chẩn đoán, kê đơn hoặc điều trị cá nhân từ bác sĩ da liễu.
                    </section>
                  )}

                  {post.faq && post.faq.length > 0 && (
                    <section className="rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-rose-500" />
                        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">FAQ nhanh</h2>
                      </div>
                      <div className="space-y-4">
                        {post.faq.map((item) => (
                          <div key={item.question}>
                            <h3 className="font-bold text-slate-900 dark:text-slate-50">{item.question}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {post.sourceNotes && post.sourceNotes.length > 0 && (
                    <section className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-rose-500" />
                        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Nguồn tham khảo</h2>
                      </div>
                      <div className="grid gap-2">
                        {post.sourceNotes.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 transition-colors hover:text-rose-600 dark:bg-slate-950 dark:text-slate-300"
                          >
                            {source.label}
                          </a>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {(nextMatrixPosts.length > 0 || productGroups.length > 0 || journeyProducts.length > 0) && (
              <div className="px-6 md:px-10 lg:px-12 pb-10">
                <ArticleJourney
                  currentQuestion={matrixNode?.userQuestion ?? post.userQuestion}
                  nextPosts={nextMatrixPosts}
                  products={journeyProducts}
                  productGroups={productGroups}
                />
              </div>
            )}

            {/* Tags & Actions */}
            <div className="px-6 md:px-10 lg:px-12 pb-10">
              <div className="max-w-3xl mx-auto">
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <Tag className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {post.tags?.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <LikeButton postId={post.id} initialCount={post.likes} />
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" /> {post.comments} Bình luận
                  </span>
                  <div className="ml-auto">
                    <SocialShare
                      url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://360dep.vn'}${articleHref(post)}`}
                      title={post.title}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Comment Section */}
          <div className="mt-8">
            <CommentSection postId={post.id} />
          </div>

          {/* Related Posts */}
          {relatedArticles.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50 mb-6">
                Đọc tiếp theo nhu cầu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.map(({ post: related, href, reasons }) => (
                  <Link key={related.id} href={href} className="group">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 flex">
                      <div className="relative w-32 md:w-40 shrink-0 bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={related.image}
                          alt={related.title}
                          fill
                          sizes="(min-width: 768px) 10rem, 8rem"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 flex flex-col justify-center">
                        <Badge variant="secondary" className="w-fit bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs mb-2">
                          {related.category}
                        </Badge>
                        <h4 className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-tight">
                          {related.title}
                        </h4>
                        {reasons[0] && (
                          <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {reasons[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function ArticleJourney({
  currentQuestion,
  nextPosts,
  products,
  productGroups,
}: {
  currentQuestion?: string
  nextPosts: Post[]
  products: Product[]
  productGroups: ProductGroup[]
}) {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
            <BookOpen className="h-4 w-4" />
            Đọc tiếp theo lộ trình
          </div>
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Bước tiếp theo nên đọc gì?
          </h2>
          {currentQuestion && (
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
              Bài này giúp bạn trả lời: {currentQuestion}
            </p>
          )}
        </div>
      </div>

      {nextPosts.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Bài nên đọc tiếp</div>
          <div className="grid gap-3">
            {nextPosts.map((nextPost) => (
              <Link
                key={nextPost.slug}
                href={`/blog/${nextPost.slug}`}
                className="group flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800 transition-colors hover:text-rose-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-rose-300"
              >
                <span>{nextPost.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-500" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {productGroups.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Nhóm sản phẩm liên quan</div>
          <div className="grid gap-3 md:grid-cols-2">
            {productGroups.map((group) => (
              <article key={group.key} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                <h3 className="font-display text-lg font-black text-slate-900 dark:text-slate-50">{group.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{group.description}</p>
                <div className="mt-3 space-y-2 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                  <p><span className="font-black text-emerald-700 dark:text-emerald-300">Nên xem:</span> {group.whenToConsider}</p>
                  <p><span className="font-black text-amber-700 dark:text-amber-300">Tránh vội:</span> {group.whenToAvoid}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Sản phẩm nên xem sau khi đọc tiêu chí</div>
          <div className="grid gap-3 md:grid-cols-2">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rounded-2xl bg-white p-4 transition-colors hover:text-rose-600 dark:bg-slate-900 dark:hover:text-rose-300"
              >
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">{product.brand}</div>
                <h3 className="mt-1 font-display text-lg font-black leading-tight text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                  {product.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{product.description}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-black text-rose-500">
                  Xem thông tin sản phẩm
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </section>
  )
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function uniqueProducts(products: Product[]) {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}
