import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Layers3 } from "lucide-react"

import type { Post } from "@/lib/types"

const featuredSlug = "da-treatment-bi-yeu-nen-phuc-hoi-ra-sao"
const latestGuideSlugs = [
  "cach-tinh-gia-tri-that-cua-mot-serum",
  "gau-dau-hay-da-dau-kho",
  "pillar-chon-mui-huong-theo-dip-va-mua",
]

function readingTime(post: Post) {
  const wordCount = post.content.trim().split(/\s+/).length
  return Math.max(4, Math.round(wordCount / 220))
}

export function HomeKnowledgeDesk({ posts }: { posts: Post[] }) {
  const featured = posts.find((post) => post.slug === featuredSlug) ?? posts[0]
  if (!featured) return null

  const curatedGuides = latestGuideSlugs
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is Post => Boolean(post))
  const fallbackGuides = posts.filter((post) => post.slug !== featured.slug && !curatedGuides.some((guide) => guide.slug === post.slug))
  const guides = [...curatedGuides, ...fallbackGuides].slice(0, 3)

  return (
    <section className="border-b border-stone-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10">
          <Link href={`/blog/${featured.slug}`} className="group relative block min-h-[280px] overflow-hidden rounded-3xl bg-stone-100 lg:col-span-5 lg:min-h-[320px]">
            <Image
              src={featured.image || "/images/catalogue/acne-sun-education.jpg"}
              alt={featured.title}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            />
          </Link>

          <div className="flex flex-col justify-center lg:col-span-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Bài viết nổi bật</p>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight tracking-[-0.025em] text-slate-950 dark:text-white">
              {featured.title}
            </h2>
            <p className="mt-4 line-clamp-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
              {featured.excerpt}
            </p>
            <Link href={`/blog/${featured.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 self-start text-sm font-black text-rose-600 hover:text-rose-700">
              Đọc hướng dẫn chi tiết <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-t border-stone-200 pt-6 dark:border-slate-800 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Hướng dẫn mới nhất</p>
            <div className="mt-3 divide-y divide-stone-200 dark:divide-slate-800">
              {guides.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group grid min-h-28 grid-cols-[96px_1fr_auto] items-center gap-4 py-4">
                  <span className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100 dark:bg-slate-800">
                    <Image src={post.image || "/brand/social-share.jpg"} alt="" fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-black leading-5 text-slate-900 transition-colors group-hover:text-rose-600 dark:text-white">{post.title}</span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{post.category} · {readingTime(post)} phút đọc</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-rose-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl items-center justify-center border-t border-stone-200 pt-7 text-center dark:border-slate-800">
          <Link href="/catalogue" className="inline-flex min-h-11 items-center gap-3 font-display text-base font-bold text-slate-700 transition hover:text-rose-600 dark:text-slate-200">
            <Layers3 className="h-5 w-5 text-rose-600" /> Khám phá toàn bộ <strong className="text-rose-600">14 chủ đề</strong> trong thư viện <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
