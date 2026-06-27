import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, Search, Sparkles, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  catalogueSections,
  getCatalogueSection,
  postMatchesCatalogue,
  productMatchesCatalogue,
  secondaryFilterGroups,
} from "@/lib/catalogue"
import { getCatalogueEducation } from "@/lib/catalogue-education"
import { getCatalogueGuide } from "@/lib/catalogue-guide"
import { getPosts, getProducts } from "@/lib/data"

export function generateStaticParams() {
  return catalogueSections.map((section) => ({ slug: section.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const section = getCatalogueSection(slug)

  if (!section) return { title: "Catalogue không tồn tại | 360° đẹp" }

  return {
    title: `${section.title} | Catalogue Đẹp Radar`,
    description: section.description,
  }
}

export default async function CatalogueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const section = getCatalogueSection(slug)
  if (!section) return notFound()
  const guide = getCatalogueGuide(slug)
  const education = getCatalogueEducation(slug)

  const [products, posts] = await Promise.all([getProducts(), getPosts()])
  const relatedProducts = products.filter((product) => productMatchesCatalogue(product, section)).slice(0, 6)
  const relatedPosts = posts.filter((post) => postMatchesCatalogue(post, section)).slice(0, 4)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 md:py-14">
      <div className="container mx-auto px-4 md:px-6">
        <Link
          href="/catalogue"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại catalogue
        </Link>

        <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.45fr_0.8fr]">
            <div>
              <Badge className="mb-4 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300">
                Catalogue nhu cầu
              </Badge>
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
                {section.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
                {section.description}
              </p>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Phù hợp với</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{section.audience}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-50">
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
        </section>

        {guide && (
          <section className="mb-8 space-y-5">
            <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardContent className="p-6 md:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    {guide.updated}
                  </Badge>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang đáng chú ý</span>
                </div>
                <p className="max-w-5xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
                  {guide.snapshot}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-3">
              <GuideList
                title="Bắt đầu thế nào"
                icon={<Compass className="h-4 w-4 text-rose-500" />}
                items={guide.startHere}
              />
              <GuideList
                title="Chọn theo tiêu chí"
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                items={guide.chooseBy}
              />
              <GuideList
                title="Đừng vội nếu"
                icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
                items={guide.pauseIf}
              />
            </div>

            <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Nên đọc tiếp</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {guide.nextReads.map((read) => (
                    <Link
                      key={read}
                      href={`/search?q=${encodeURIComponent(read)}`}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <span>{read}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-rose-500" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {education && (
          <section className="mb-8 space-y-5">
            <div>
              <Badge className="mb-3 bg-slate-900 text-white hover:bg-slate-900 dark:bg-slate-50 dark:text-slate-900">
                Học nhanh
              </Badge>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">
                {education.headline}
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {education.basics.map((point) => (
                <Card key={point.title} className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardContent className="p-6">
                    <BookOpen className="mb-3 h-5 w-5 text-rose-500" />
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">{point.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{point.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <VisualDiagram
                title={education.visualTitle}
                caption={education.visualCaption}
                nodes={education.visualNodes}
              />
              <FlowDiagram title={education.flowTitle} steps={education.flowSteps} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-rose-500" />
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Từ khóa cần hiểu</h3>
                  </div>
                  <div className="grid gap-3">
                    {education.glossary.map((item) => (
                      <div key={item.title} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{item.title}</div>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
          </section>
        )}

        <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {section.branches.map((branch) => (
            <Card key={branch.title} className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">{branch.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{branch.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {branch.keywords.slice(0, 5).map((keyword) => (
                    <Link key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`}>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {keyword}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Lọc thêm</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Thu hẹp kết quả theo tình trạng, đối tượng và loại da của bạn.
              </p>
              <div className="mt-5 space-y-4">
                <FilterRow label="Theo mục này" items={section.filters} />
                <FilterRow label="Đối tượng" items={secondaryFilterGroups.audience.slice(1)} />
                <FilterRow label="Loại da" items={secondaryFilterGroups.skinType.slice(1)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Loại sản phẩm / dịch vụ liên quan</h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {section.productTypes.map((type) => (
                  <Link
                    key={type}
                    href={`/search?q=${encodeURIComponent(type)}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {type}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {(relatedProducts.length > 0 || relatedPosts.length > 0) && (
          <section className="grid gap-8 lg:grid-cols-2">
            {relatedProducts.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Sản phẩm liên quan</h2>
                  <Link href="/products" className="text-sm font-bold text-rose-500 hover:text-rose-600">
                    Product Radar
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
                    Blog
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
          </section>
        )}
      </div>
    </div>
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

function GuideList({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return (
    <Card className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          {icon}
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
        </div>
        <ul className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function FilterRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="border-slate-200 px-3 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}
