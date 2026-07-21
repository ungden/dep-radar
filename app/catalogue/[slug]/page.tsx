import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, Search, Sparkles, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getCatalogueArticle, type CatalogueArticleContent } from "@/lib/catalogue-articles"
import {
  buildCatalogueHref,
  catalogueSections,
  type CatalogueSection,
  getCatalogueSection,
  normalizeCatalogueToken,
  postMatchesCatalogue,
  productMatchesCatalogue,
} from "@/lib/catalogue"
import { getCatalogueEducation, getCatalogueEducationImage, type CatalogueEducation } from "@/lib/catalogue-education"
import { getCatalogueGuide, type CatalogueGuide } from "@/lib/catalogue-guide"
import {
  getContentMatrix,
  getMatrixProductGroups,
  researchStageLabels,
  type ContentMatrix,
  type MatrixNode,
  type ProductGroup,
} from "@/lib/content-matrix"
import { getPublishedNextReadPosts } from "@/lib/editorial"
import { getPosts, getProducts } from "@/lib/data"
import { absoluteUrl } from "@/lib/seo"
import type { Post, Product } from "@/lib/types"

export function generateStaticParams() {
  return catalogueSections.map((section) => ({ slug: section.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const section = getCatalogueSection(slug)

  if (!section) return { title: "Chủ đề không tồn tại" }
  const title = section.title
  const url = absoluteUrl(`/catalogue/${section.slug}`)
  const image = absoluteUrl("/brand/social-share.jpg")

  return {
    title: `${section.title} | Hướng dẫn làm đẹp`,
    description: section.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: "360dep.vn",
      url,
      title,
      description: section.description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${section.title} trên 360dep.vn`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: section.description,
      images: [image],
    },
  }
}

export default async function CatalogueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const rawFilters = await searchParams
  const section = getCatalogueSection(slug)
  if (!section) return notFound()
  const guide = getCatalogueGuide(slug)
  const education = getCatalogueEducation(slug)
  const article = getCatalogueArticle(slug)
  const nextReadPosts = getPublishedNextReadPosts(slug)
  const contentMatrix = getContentMatrix(slug)

  const [products, posts] = await Promise.all([getProducts(), getPosts()])
  const selectedFilters = {
    condition: stringParam(rawFilters.condition),
    skin: stringParam(rawFilters.skin),
    audience: stringParam(rawFilters.audience),
    budget: stringParam(rawFilters.budget),
  }
  const selectedCondition = section.conditions?.find((condition) => condition.slug === selectedFilters.condition)
  const selectedLabels = (section.filterDefinitions ?? []).flatMap((definition) => {
    const selectedValue = selectedFilters[definition.key]
    const option = definition.options.find((item) => item.slug === selectedValue)
    return option ? [option.label] : []
  })
  const selectedBranch = section.branches.find((branch) => normalizeCatalogueToken(branch.title) === selectedCondition?.slug)
  const hubProducts = products.filter((product) => productMatchesCatalogue(product, section))
  const hubPosts = posts.filter((post) => postMatchesCatalogue(post, section))
  const branchProducts = selectedBranch ? hubProducts.filter((product) => productMatchesBranch(product, selectedBranch.keywords)) : hubProducts
  const conditionProducts = branchProducts.filter((product) => productMatchesLenses(product, selectedFilters))
  const conditionPosts = selectedBranch ? hubPosts.filter((post) => postMatchesBranch(post, selectedBranch.keywords)) : hubPosts
  const relatedProducts = conditionProducts.slice(0, 6)
  const relatedPosts = conditionPosts
  const productsWithoutBudgetHref = buildCatalogueHref(section.slug, { ...selectedFilters, budget: undefined })
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]))
  const productsById = new Map(products.map((product) => [product.id, product]))
  const matrixItems =
    contentMatrix?.nodes.map((node) => {
      const productGroups = getMatrixProductGroups(node.productGroupKeys)
      const productIds = unique([
        ...node.productIds,
        ...productGroups.flatMap((group) => [...group.productIds, ...group.comparisonProductIds]),
      ])

      return {
        node,
        post: postsBySlug.get(node.articleSlug),
        nextPosts: node.nextArticleSlugs.map((nextSlug) => postsBySlug.get(nextSlug)).filter((post): post is Post => Boolean(post)),
        productGroups,
        products: productIds.map((productId) => productsById.get(productId)).filter((product): product is Product => Boolean(product)),
      }
    }) ?? []
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://360dep.vn"
  const catalogueJsonLd = contentMatrix ? buildCatalogueMatrixJsonLd(contentMatrix, matrixItems, siteUrl) : null
  const breadcrumbJsonLd = buildCatalogueBreadcrumbJsonLd(section, siteUrl)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 md:py-14">
      <JsonLd data={breadcrumbJsonLd} />
      {catalogueJsonLd && <JsonLd data={catalogueJsonLd} />}
      <div className="container mx-auto px-4 md:px-6">
        <Link
          href="/catalogue"
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại tất cả chủ đề
        </Link>

        <HubSnapshot section={section} guide={guide} selectedLabels={selectedLabels} />
        <HubFilters section={section} selected={selectedFilters} />

        {contentMatrix && <ReadingJourney matrix={contentMatrix} items={matrixItems} />}
        <ProductGuidance section={section} items={matrixItems} />

        {selectedCondition && relatedPosts.length === 0 && relatedProducts.length === 0 && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
            Chưa có nội dung đã duyệt cho “{selectedCondition.label}”. Bạn có thể bỏ bộ lọc tình trạng hoặc chọn một nhánh gần nhất bên trên.
          </div>
        )}

        {(relatedProducts.length > 0 || relatedPosts.length > 0) && (
          <section className="mb-12">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Kết quả dành cho bạn</div>
              <h2 className="mt-2 font-display text-3xl font-black text-slate-950 dark:text-white">Bắt đầu từ kiến thức, rồi mới chọn sản phẩm</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {conditionPosts.length} bài phù hợp
                {conditionProducts.length > 0 ? ` · ${conditionProducts.length} sản phẩm khớp lựa chọn` : " · Chưa có sản phẩm khớp đủ lựa chọn"}
              </p>
              {relatedPosts[0] && (
                <Link href={`/blog/${relatedPosts[0].slug}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-black text-white hover:bg-rose-700">
                  Đọc bài nên bắt đầu: {relatedPosts[0].title} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {conditionProducts.length === 0 && hubProducts.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                  <p>Chưa có sản phẩm đã kiểm tra nào khớp đồng thời tất cả tiêu chí đã chọn. Trang vẫn giữ các bài hướng dẫn phù hợp và không tự đề xuất sản phẩm gần đúng.</p>
                  {selectedFilters.budget && (
                    <Link href={productsWithoutBudgetHref} className="mt-2 inline-flex min-h-11 items-center font-black text-amber-950 underline underline-offset-4 dark:text-amber-100">
                      Xem lại mà không giới hạn ngân sách
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
            {relatedProducts.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Sản phẩm liên quan</h2>
                  <Link href={`/products?catalogue=${section.slug}`} className="text-sm font-bold text-rose-500 hover:text-rose-600">
                    Xem tất cả sản phẩm
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedProducts.map((product, index) => (
                    <Link key={product.id} href={`/products/${product.id}`} className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-colors hover:border-rose-200 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex gap-3">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="80px"
                            priority={index === 0}
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase tracking-wider text-rose-500">{product.brand}</div>
                          <div className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                            {product.name}
                          </div>
                          <div className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-300">{product.price}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedPosts.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Bài viết liên quan</h2>
                  <Link href="/blog" className="text-sm font-bold text-rose-500 hover:text-rose-600">
                    Kiến thức
                  </Link>
                </div>
                <div className="space-y-3">
                  {relatedPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-rose-200 dark:border-slate-800 dark:bg-slate-900">
                      <div>
                        <Badge variant="secondary" className="mb-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {post.category}
                        </Badge>
                        <div className="font-bold text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                          {post.title}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-rose-500" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
            </div>
          </section>
        )}

        {guide && education && (
          <details className="group mb-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-black text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-white">
              Bài nền đầy đủ: {education.headline}
              <span className="text-sm font-bold text-rose-600 group-open:hidden dark:text-rose-300">Mở bài nền</span>
            </summary>
            <div className="pt-5">
              <CatalogueArticle
                section={section}
                guide={guide}
                education={education}
                article={article}
                nextReadPosts={nextReadPosts}
                imageSrc={getCatalogueEducationImage(slug)}
              />
            </div>
          </details>
        )}

        {contentMatrix && <ResearchMatrixSection matrix={contentMatrix} items={matrixItems} />}
      </div>
    </div>
  )
}

type HubFilterState = { condition?: string; skin?: string; audience?: string; budget?: string }

function HubSnapshot({ section, guide, selectedLabels }: { section: CatalogueSection; guide?: CatalogueGuide; selectedLabels: string[] }) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="p-6 md:p-9">
          <Badge className="mb-4 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300">Hướng dẫn theo nhu cầu</Badge>
          <h1 className="font-display text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-6xl">{section.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">{guide?.snapshot ?? section.description}</p>
          {selectedLabels.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Lựa chọn của bạn</div>
              <div className="flex flex-wrap gap-2">
                {selectedLabels.map((label) => <span key={label} className="inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-black text-white dark:bg-white dark:text-slate-950">{label}</span>)}
              </div>
            </div>
          )}
        </div>
        <aside className="border-t border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20 lg:border-l lg:border-t-0 md:p-8">
          <div className="flex items-center gap-2 font-display text-lg font-black text-amber-950 dark:text-amber-100"><AlertCircle className="h-5 w-5" /> Ranh giới an toàn</div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-amber-950/80 dark:text-amber-100/80">
            {(guide?.pauseIf ?? ["Dừng tự xử lý khi có đau, sưng, nhiễm trùng hoặc phản ứng kéo dài."]).slice(0, 3).map((item) => <li key={item} className="flex gap-2"><span aria-hidden>•</span><span>{item}</span></li>)}
          </ul>
        </aside>
      </div>
    </section>
  )
}

function HubFilters({ section, selected }: { section: CatalogueSection; selected: HubFilterState }) {
  return (
    <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-7" aria-labelledby="hub-filters-title">
      <h2 id="hub-filters-title" className="font-display text-2xl font-black text-slate-950 dark:text-white">Bạn đang gặp tình trạng nào?</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chọn thêm hoặc bỏ bớt để điều chỉnh bài viết và sản phẩm. Bạn có thể gửi đường dẫn này cho người khác.</p>
      <div className="mt-5 space-y-5">
        {section.filterDefinitions?.map((definition) => (
          <fieldset key={definition.key}>
            <legend className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">{definition.label}</legend>
            <div className="flex flex-wrap gap-2">
              {definition.options.map((option) => {
                const active = selected[definition.key] === option.slug
                const next = { ...selected, [definition.key]: active ? undefined : option.slug }
                return (
                  <Link key={option.slug} aria-current={active ? "page" : undefined} href={buildCatalogueHref(section.slug, next)} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition-colors ${active ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-200"}`}>
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {Object.values(selected).some(Boolean) && <Link href={`/catalogue/${section.slug}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-black text-rose-600 hover:text-rose-700">Xóa toàn bộ bộ lọc</Link>}
    </section>
  )
}

function ReadingJourney({ matrix, items }: { matrix: ContentMatrix; items: MatrixItem[] }) {
  const stages = [
    { label: "Bắt đầu", stages: ["start"], fallback: "Chọn tình trạng gần nhất với bạn và giữ routine nền ổn định trước khi thay đổi." },
    { label: "Hiểu vấn đề", stages: ["problem", "ingredient"], fallback: "Đọc dấu hiệu, nguyên nhân thường gặp và giới hạn của việc tự chăm sóc." },
    { label: "Xây routine", stages: ["routine"], fallback: "Bắt đầu ít bước, thêm một thay đổi mỗi lần và theo dõi phản ứng." },
    { label: "Chọn sản phẩm", stages: ["product"], fallback: "Đối chiếu nhóm nhu cầu, điều nên cân nhắc và điều nên tránh ở phần kế tiếp." },
    { label: "Ranh giới an toàn", stages: ["safety"], fallback: "Dừng tự xử lý khi có đau, sưng, mủ, lan nhanh hoặc kích ứng kéo dài." },
  ]
  return (
    <section className="mb-8" aria-labelledby="reading-journey-title">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Lộ trình đọc 5 chặng</div>
        <h2 id="reading-journey-title" className="mt-2 font-display text-3xl font-black text-slate-950 dark:text-white">Đọc theo thứ tự để bớt mua sai</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{matrix.intro}</p>
      </div>
      <ol className="grid gap-3 md:grid-cols-5">
        {stages.map((stage, index) => {
          const item = items.find((entry) => stage.stages.includes(entry.node.stage) && entry.post)
          return (
            <li key={stage.label} className="flex min-h-44 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">{index + 1}</span>
              <h3 className="mt-3 font-display text-lg font-black text-slate-950 dark:text-white">{stage.label}</h3>
              {item?.post ? (
                <Link href={`/blog/${item.post.slug}`} className="mt-2 flex flex-1 flex-col justify-between gap-3 text-sm font-semibold leading-relaxed text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-300">
                  <span>{item.post.title}</span>
                  <span className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-300">Đọc bài <ArrowRight className="h-3.5 w-3.5" /></span>
                </Link>
              ) : <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{stage.fallback}</p>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function ProductGuidance({ section, items }: { section: CatalogueSection; items: MatrixItem[] }) {
  const groups = Array.from(new Map(items.flatMap((item) => item.productGroups).map((group) => [group.key, group])).values()).slice(0, 4)
  return (
    <section className="mb-10 rounded-3xl bg-slate-950 p-6 text-white dark:bg-slate-900 md:p-8" aria-labelledby="product-guidance-title">
      <div className="mb-5 max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-rose-300">Sau khi đã đọc nền</div>
        <h2 id="product-guidance-title" className="mt-2 font-display text-3xl font-black">Nhóm sản phẩm nên cân nhắc</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Các nhóm dưới đây được chọn theo nhu cầu và ranh giới an toàn của chủ đề {section.shortTitle}; sản phẩm cụ thể chỉ xuất hiện khi đã được phân loại rõ.</p>
      </div>
      {groups.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.key} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-display text-xl font-black">{group.title}</h3>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><div className="font-black text-emerald-300">Nên cân nhắc</div><p className="mt-1 leading-relaxed text-slate-300">{group.whenToConsider}</p></div>
                <div><div className="font-black text-amber-300">Nên tránh / trì hoãn</div><p className="mt-1 leading-relaxed text-slate-300">{group.whenToAvoid}</p></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{section.productTypes.map((type) => <ProductTypeLink key={type} type={type} sectionSlug={section.slug} />)}</div>
      )}
    </section>
  )
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function buildCatalogueMatrixJsonLd(matrix: ContentMatrix, items: MatrixItem[], siteUrl: string) {
  const listItems = items.flatMap((item) => {
    const entries: { name: string; url: string }[] = []
    if (item.post) entries.push({ name: item.post.title, url: `${siteUrl}/blog/${item.post.slug}` })
    item.products.forEach((product) => entries.push({ name: product.name, url: `${siteUrl}/products/${product.id}` }))
    return entries
  })

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: matrix.title,
    description: matrix.intro,
    itemListElement: listItems
      .map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
  }
}

function buildCatalogueBreadcrumbJsonLd(section: CatalogueSection, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "360dep.vn", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Catalogue", item: `${siteUrl}/catalogue` },
      { "@type": "ListItem", position: 3, name: section.title, item: `${siteUrl}/catalogue/${section.slug}` },
    ],
  }
}

type MatrixItem = {
  node: MatrixNode
  post?: Post
  nextPosts: Post[]
  productGroups: ProductGroup[]
  products: Product[]
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function productMatchesBranch(product: Product, keywords: string[]) {
  const tags = [
    ...(product.condition_tags ?? []),
    ...(product.concern_tags ?? []),
    ...(product.ingredient_tags ?? []),
    ...(product.tags ?? []),
  ].map(normalizeCatalogueToken)
  return keywords.map(normalizeCatalogueToken).some((keyword) => tags.includes(keyword))
}

function postMatchesBranch(post: Post, keywords: string[]) {
  const haystack = normalizeCatalogueToken([
    post.title,
    post.excerpt,
    post.category,
    ...(post.tags ?? []),
    ...(post.conditionSlugs ?? []),
  ].join(" "))
  return keywords.map(normalizeCatalogueToken).some((keyword) => haystack.includes(keyword))
}

function productMatchesLenses(product: Product, filters: HubFilterState) {
  const structuredTags = [
    ...(product.condition_tags ?? []),
    ...(product.concern_tags ?? []),
    ...(product.audience_tags ?? []),
    ...(product.safety_flags ?? []),
    ...(product.tags ?? []),
  ].map(normalizeCatalogueToken)

  if (filters.skin && !structuredTags.includes(filters.skin)) return false
  if (filters.audience) {
    const isMen = filters.audience === "nam" && product.category_key === "men_grooming"
    if (!isMen && !structuredTags.includes(filters.audience)) return false
  }
  if (filters.budget) {
    const price = Number(product.price.replace(/[^0-9]/g, ""))
    if (!price) return false
    if (filters.budget === "duoi-200k" && price >= 200_000) return false
    if (filters.budget === "200-500k" && (price < 200_000 || price > 500_000)) return false
    if (filters.budget === "luxury" && price <= 500_000) return false
  }
  return true
}

function ResearchMatrixSection({ matrix, items }: { matrix: ContentMatrix; items: MatrixItem[] }) {
  const itemsByStage = matrix.stageOrder
    .map((stage) => ({
      stage,
      items: items.filter((item) => item.node.stage === stage && Boolean(item.post)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <details className="group mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
      <summary className="flex min-h-11 cursor-pointer list-none items-center font-display text-xl font-black text-slate-900 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-slate-50">
        Khám phá hướng dẫn chuyên sâu
        <span className="ml-2 text-sm font-semibold text-slate-500 group-open:hidden dark:text-slate-400">({items.length} chủ đề)</span>
      </summary>
      <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <Badge className="mb-3 bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-300">
            Hướng dẫn chuyên sâu
          </Badge>
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
            {matrix.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
            {matrix.intro}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">Cách đọc</div>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
            Chọn câu hỏi giống bạn nhất, đọc bài chính trước, sau đó đi qua bài tiếp theo và nhóm sản phẩm hợp ngữ cảnh.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {itemsByStage.map(({ stage, items: stageItems }) => (
          <div key={stage}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white dark:bg-slate-100 dark:text-slate-950">
                {matrix.stageOrder.indexOf(stage) + 1}
              </div>
              <div>
                <h3 className="font-display text-xl font-black text-slate-900 dark:text-slate-50">
                  {researchStageLabels[stage]}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Một bước giúp bạn đi từ hiểu vấn đề đến quyết định phù hợp.</p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {stageItems.map((item) => (
                <ResearchMatrixCard key={item.node.key} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}

function ResearchMatrixCard({ item }: { item: MatrixItem }) {
  const { node, post, nextPosts, productGroups, products } = item

  return (
    <Card className="h-full border-slate-100 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-rose-500">{node.title}</div>
            <h4 className="mt-1 font-display text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              {node.userQuestion}
            </h4>
          </div>
          {node.safetyLevel === "medical" && (
            <Badge variant="outline" className="shrink-0 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              Cần thận trọng
            </Badge>
          )}
        </div>

        <div className="grid gap-3">
          {post && (
            <MatrixInfoBlock label="Đọc bài chính">
              <Link href={`/blog/${post.slug}`} className="group inline-flex items-center gap-2 font-bold text-slate-900 hover:text-rose-600 dark:text-slate-50 dark:hover:text-rose-300">
                {post.title}
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-rose-500" />
              </Link>
            </MatrixInfoBlock>
          )}

          {nextPosts.length > 0 && (
            <MatrixInfoBlock label="Đọc tiếp">
              <div className="flex flex-wrap gap-2">
                {nextPosts.slice(0, 4).map((nextPost) => (
                  <Link
                    key={nextPost.slug}
                    href={`/blog/${nextPost.slug}`}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 transition-colors hover:text-rose-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-rose-300"
                  >
                    {nextPost.title}
                  </Link>
                ))}
              </div>
            </MatrixInfoBlock>
          )}

          {productGroups.length > 0 && (
            <MatrixInfoBlock label="Nhóm sản phẩm nên xem">
              <div className="grid gap-2 sm:grid-cols-2">
                {productGroups.slice(0, 3).map((group) => (
                  <div key={group.key} className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                    <div className="text-sm font-black text-slate-900 dark:text-slate-50">{group.title}</div>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{group.whenToConsider}</p>
                  </div>
                ))}
              </div>
            </MatrixInfoBlock>
          )}

          {products.length > 0 && (
            <MatrixInfoBlock label="Sản phẩm cụ thể">
              <div className="grid gap-2 sm:grid-cols-2">
                {products.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group rounded-2xl bg-white p-3 transition-colors hover:text-rose-600 dark:bg-slate-900 dark:hover:text-rose-300"
                  >
                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">{product.brand}</div>
                    <div className="mt-1 text-sm font-black leading-snug text-slate-900 group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                      {product.name}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{product.price}</div>
                  </Link>
                ))}
              </div>
            </MatrixInfoBlock>
          )}

        </div>

        <p className="mt-auto pt-4 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          Sản phẩm chỉ được hiển thị sau khi có đủ thông tin để đặt đúng vào nhóm nhu cầu này.
        </p>
      </CardContent>
    </Card>
  )
}

function MatrixInfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-black uppercase tracking-wider text-slate-400">{label}</div>
      {children}
    </div>
  )
}

const PRODUCT_TYPE_HINTS: Record<string, string> = {
  "Sữa rửa mặt dịu nhẹ": "Giữ nền sạch mà không làm da căng rít.",
  "Serum phục hồi": "Hợp khi da rát, bong, treatment quá tải.",
  "Kem dưỡng khóa ẩm": "Giữ nước và hỗ trợ hàng rào bảo vệ da.",
  "Kem chống nắng hằng ngày": "Bước nền cho mụn, thâm, nám và treatment.",
  "Treatment trị mụn": "Chỉ chọn một hướng chính để dễ theo dõi phản ứng.",
  "Hoạt chất sáng da": "Dùng sau khi chống nắng và mụn đã ổn hơn.",
}

function ProductTypeLink({ type, sectionSlug }: { type: string; sectionSlug: string }) {
  return (
    <Link
      href={`/products?catalogue=${sectionSlug}`}
      className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-rose-300 hover:bg-white/10"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-white group-hover:text-rose-300">{type}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-500" />
      </div>
      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-300">
        {PRODUCT_TYPE_HINTS[type] ?? "Xem sản phẩm và bài viết liên quan trước khi mua."}
      </p>
    </Link>
  )
}

function CatalogueArticle({
  section,
  guide,
  education,
  article,
  nextReadPosts,
  imageSrc,
}: {
  section: CatalogueSection
  guide: CatalogueGuide
  education: CatalogueEducation
  article?: CatalogueArticleContent
  nextReadPosts: { title: string; slug: string }[]
  imageSrc: string
}) {
  return (
    <article className="mb-10 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[320px] bg-slate-100 dark:bg-slate-800">
          <Image
            src={imageSrc}
            alt={`Minh họa kiến thức ${section.shortTitle}`}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="p-6 md:p-8 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300">
              Hướng dẫn theo nhu cầu
            </Badge>
            <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {guide.updated}
            </Badge>
          </div>
          <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
            {section.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
            {section.description}
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Bài hướng dẫn</div>
            <p className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              {education.headline}
            </p>
          </div>
          <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
            {article?.deck ?? guide.snapshot}
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Trước khi chọn sản phẩm hoặc dịch vụ, hãy đọc phần này như một bài nền tảng:
            hiểu khái niệm, nhìn dấu hiệu đúng, đi theo flow ra quyết định và biết lúc nào
            nên dừng lại để tránh mua sai hoặc làm da yếu hơn.
          </p>
          {article?.learningGoals && (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Đọc xong bạn nắm được</div>
              <ul className="space-y-2 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                {article.learningGoals.map((goal) => (
                  <li key={goal} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-50">
              <Search className="h-4 w-4 text-rose-500" />
              Tìm nhanh theo nhu cầu
            </div>
            <div className="flex flex-wrap gap-2">
              {section.featuredQueries.map((query) => (
                <Link key={query} href={`/search?q=${encodeURIComponent(query)}`}>
                  <Badge variant="outline" className="border-slate-200 bg-white px-3 py-1 text-slate-600 hover:border-rose-200 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {query}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 border-t border-slate-100 p-6 dark:border-slate-800 md:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
        <div className="space-y-8">
          {article && (
            <section className="space-y-8">
              {article.blocks.map((block) => (
                <section key={block.title} className="max-w-3xl">
                  <Badge variant="outline" className="mb-3 border-rose-200 bg-rose-50/60 text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                    {block.eyebrow}
                  </Badge>
                  <h3 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
                    {block.title}
                  </h3>
                  <div className="mt-4 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                    {block.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm font-semibold leading-relaxed text-slate-700 dark:border-cyan-950 dark:bg-cyan-950/20 dark:text-slate-300">
                    {block.takeaway}
                  </div>
                </section>
              ))}

              {article.diagnosticLens && (
                <DiagnosticLens
                  title={article.diagnosticLens.title}
                  paragraphs={article.diagnosticLens.paragraphs}
                  cues={article.diagnosticLens.cues}
                />
              )}

              {article.careProtocol && (
                <CareProtocol
                  homeTitle={article.careProtocol.homeTitle}
                  homeSteps={article.careProtocol.homeSteps}
                  professionalTitle={article.careProtocol.professionalTitle}
                  professionalSigns={article.careProtocol.professionalSigns}
                />
              )}

              {article.decisionMatrix && (
                <DecisionMatrix rows={article.decisionMatrix} />
              )}

              {article.mythReality && (
                <MythReality items={article.mythReality} />
              )}
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-rose-500" />
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                Kiến thức cơ bản cần nắm
              </h3>
            </div>
            <div className="space-y-6">
              {education.basics.map((point) => (
                <section key={point.title} className="border-l-2 border-rose-200 pl-5 dark:border-rose-900">
                  <h4 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">{point.title}</h4>
                  <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">{point.body}</p>
                </section>
              ))}
            </div>
          </section>

          <VisualDiagram
            title={education.visualTitle}
            caption={education.visualCaption}
            nodes={education.visualNodes}
          />

          <section className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-950">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-rose-500" />
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                Áp dụng vào thực tế
              </h3>
            </div>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Với {section.shortTitle.toLowerCase()}, cách đọc thông minh là bắt đầu bằng vấn đề chính,
              sau đó mới xét loại da, ngân sách, tần suất dùng và mức rủi ro. Nếu một sản phẩm hoặc
              dịch vụ không trả lời rõ “hợp với ai, tránh cho ai, dùng thế nào”, hãy coi đó là tín hiệu
              cần đọc kỹ hơn.
            </p>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <FlowDiagram title={education.flowTitle} steps={education.flowSteps} />

          <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">Chọn theo tiêu chí</h3>
              </div>
              <ul className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {guide.chooseBy.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/70 shadow-sm dark:border-amber-950 dark:bg-amber-950/20">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">Đừng vội nếu</h3>
              </div>
              <ul className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {guide.pauseIf.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="grid gap-6 border-t border-slate-100 p-6 dark:border-slate-800 md:p-8 lg:grid-cols-[1fr_1fr] lg:p-10">
        <Card className="border-slate-100 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-rose-500" />
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Từ khóa cần hiểu</h3>
            </div>
            <div className="space-y-4">
              {education.glossary.map((item) => (
                <div key={item.title}>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{item.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-500" />
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Lỗi dễ gặp</h3>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {education.mistakes.map((mistake) => (
                <li key={mistake} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-slate-100 p-6 dark:border-slate-800 md:p-8 lg:p-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose-500" />
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Nên đọc tiếp</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {nextReadPosts.map((post) => (
            <NextReadLink key={post.slug} title={post.title} slug={post.slug} />
          ))}
        </div>
      </div>

      {article?.references && (
        <div className="border-t border-slate-100 p-6 dark:border-slate-800 md:p-8 lg:p-10">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-rose-500" />
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Nguồn tham khảo</h3>
          </div>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Các ghi chú y khoa trong bài được viết theo hướng giáo dục cơ bản, không thay thế chẩn đoán hoặc điều trị cá nhân.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {article.references.map((reference) => (
              <a
                key={reference.url}
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 transition-colors hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <span>{reference.label}</span>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-500" />
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function NextReadLink({ title, slug }: { title: string; slug: string }) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
    >
      <span>{title}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-500" />
    </Link>
  )
}

function DiagnosticLens({ title, paragraphs, cues }: { title: string; paragraphs: string[]; cues: string[] }) {
  return (
    <section className="max-w-4xl rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
      <Badge variant="outline" className="mb-3 border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-300">
        Lăng kính chẩn đoán
      </Badge>
      <h3 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
        {title}
      </h3>
      <div className="mt-4 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {cues.map((cue) => (
          <div key={cue} className="rounded-2xl border border-white bg-white p-4 text-sm font-semibold leading-relaxed text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {cue}
          </div>
        ))}
      </div>
    </section>
  )
}

function CareProtocol({
  homeTitle,
  homeSteps,
  professionalTitle,
  professionalSigns,
}: {
  homeTitle: string
  homeSteps: string[]
  professionalTitle: string
  professionalSigns: string[]
}) {
  return (
    <section className="grid max-w-4xl gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">{homeTitle}</h3>
        </div>
        <ol className="space-y-3">
          {homeSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                {index + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-6 dark:border-amber-950 dark:bg-amber-950/20">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">{professionalTitle}</h3>
        </div>
        <ul className="space-y-3">
          {professionalSigns.map((sign) => (
            <li key={sign} className="flex gap-3 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{sign}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function DecisionMatrix({ rows }: { rows: { signal: string; meaning: string; action: string }[] }) {
  return (
    <section className="max-w-4xl">
      <div className="mb-4 flex items-center gap-2">
        <Compass className="h-5 w-5 text-rose-500" />
        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Bảng giúp bạn quyết định</h3>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="hidden grid-cols-[0.95fr_1fr_1fr] bg-slate-100 text-xs font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300 md:grid">
          <div className="p-3">Dấu hiệu</div>
          <div className="border-l border-white p-3 dark:border-slate-700">Cách hiểu</div>
          <div className="border-l border-white p-3 dark:border-slate-700">Nên làm</div>
        </div>
        {rows.map((row) => (
          <div key={row.signal} className="grid grid-cols-1 border-t border-slate-100 bg-white text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:grid-cols-[0.95fr_1fr_1fr]">
            <div className="p-4 font-bold text-slate-900 dark:text-slate-50">{row.signal}</div>
            <div className="border-t border-slate-100 p-4 dark:border-slate-800 md:border-l md:border-t-0">{row.meaning}</div>
            <div className="border-t border-slate-100 p-4 font-semibold dark:border-slate-800 md:border-l md:border-t-0">{row.action}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MythReality({ items }: { items: { myth: string; reality: string }[] }) {
  return (
    <section className="max-w-4xl">
      <div className="mb-4 flex items-center gap-2">
        <XCircle className="h-5 w-5 text-amber-500" />
        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Hiểu lầm thường gặp</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.myth} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-black uppercase tracking-wider text-amber-500">Hiểu lầm</div>
            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-900 dark:text-slate-50">{item.myth}</p>
            <div className="my-4 h-px bg-slate-100 dark:bg-slate-800" />
            <div className="text-xs font-black uppercase tracking-wider text-emerald-500">Thực tế</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.reality}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function VisualDiagram({ title, caption, nodes }: { title: string; caption: string; nodes: { label: string; detail: string }[] }) {
  return (
    <Card className="overflow-hidden border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-0">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{caption}</p>
        </div>
        <div className="bg-slate-50 p-5 dark:bg-slate-950">
          <div className="grid gap-3 sm:grid-cols-2">
            {nodes.map((node, index) => (
              <div
                key={node.label}
                className="relative overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {index + 1}
                </div>
                <div className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">{node.label}</div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{node.detail}</p>
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-cyan-100/70 dark:bg-cyan-950/30" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FlowDiagram({ title, steps }: { title: string; steps: string[] }) {
  return (
    <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Compass className="h-4 w-4 text-rose-500" />
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h3>
        </div>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white dark:bg-slate-50 dark:text-slate-900">
                {index + 1}
              </span>
              <span className="pt-1 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
