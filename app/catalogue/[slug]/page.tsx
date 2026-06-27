import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, Search, Sparkles, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getCatalogueArticle, type CatalogueArticleContent } from "@/lib/catalogue-articles"
import {
  catalogueSections,
  type CatalogueSection,
  getCatalogueSection,
  postMatchesCatalogue,
  productMatchesCatalogue,
  secondaryFilterGroups,
} from "@/lib/catalogue"
import { getCatalogueEducation, getCatalogueEducationImage, type CatalogueEducation } from "@/lib/catalogue-education"
import { getCatalogueGuide, type CatalogueGuide } from "@/lib/catalogue-guide"
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
  const article = getCatalogueArticle(slug)

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

        {!(guide && education) && (
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
              </div>
            </div>
          </section>
        )}

        {guide && education && (
          <CatalogueArticle
            section={section}
            guide={guide}
            education={education}
            article={article}
            imageSrc={getCatalogueEducationImage(slug)}
          />
        )}

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Khám phá theo nhánh</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Sau khi nắm nền tảng, chọn nhánh cụ thể để đi sâu theo vấn đề hoặc sản phẩm liên quan.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {section.branches.map((branch) => (
              <Card key={branch.title} className="border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-6">
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">{branch.title}</h3>
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
          </div>
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

function CatalogueArticle({
  section,
  guide,
  education,
  article,
  imageSrc,
}: {
  section: CatalogueSection
  guide: CatalogueGuide
  education: CatalogueEducation
  article?: CatalogueArticleContent
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
              Catalogue nhu cầu
            </Badge>
            <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {guide.updated}
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
            {section.title}
          </h1>
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
        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Ma trận quyết định</h3>
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
