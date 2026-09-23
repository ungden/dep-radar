import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { PostCard, ProCard } from "@/components/beauty"
import { CategoryTag } from "@/components/trade"
import { ButtonLink } from "@/components/ui"
import { listPros, listWorks } from "@/lib/api/pros"
import { CATEGORIES, VERTICALS, templatesByCategory } from "@/lib/catalog"
import { absoluteUrl } from "@/lib/env"
import { serializeJsonLd } from "@/lib/json-ld"
import { CITIES } from "@/lib/geo"
import { POLICY } from "@/lib/pricing"
import { categoryPhrase, landingDescription, landingTitle, personWord, priceBand } from "@/lib/trade"
import type { Category, CategoryId } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

/**
 * Landing pages for the searches people actually type: "nail tại nhà Hà Nội",
 * "chụp ảnh điện thoại ở Hà Nội", "thuê mẫu ảnh ở Hà Nội". One page per city
 * and category, server-rendered with its own metadata and structured data,
 * because these are the pages that have to be findable.
 */

const slugOfCity = (city: string) =>
  city
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const cityFromSlug = (slug: string) => CITIES.find((c) => slugOfCity(c) === slug)
const categoryFromSlug = (slug: string) => CATEGORIES.find((c) => c.id === slug)

export function generateStaticParams() {
  return CITIES.flatMap((city) => CATEGORIES.map((c) => ({ city: slugOfCity(city), category: c.id })))
}

/**
 * Prerendered for speed and for crawlers, then refreshed in the background. A
 * marketplace page that only changed on deploy would hide a freelancer who
 * signed up this morning.
 */
export const revalidate = 600

type Params = Promise<{ city: string; category: string }>

function metaTitle(category: Category, city: string) {
  return `${landingTitle(category, city)} — đặt lịch với ${personWord([category.id])} gần bạn`
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await params
  const city = cityFromSlug(citySlug)
  const category = categoryFromSlug(categorySlug)
  if (!city || !category) return {}
  const title = metaTitle(category, city)
  const description = landingDescription(category, city, POLICY.freeTravelKm)
  return {
    title,
    description,
    alternates: { canonical: `/${citySlug}/${category.id}` },
    openGraph: { title, description, url: absoluteUrl(`/${citySlug}/${category.id}`) },
  }
}

/**
 * A database that has not been migrated to a new trade yet rejects its
 * category ("invalid input value for enum", 22P02). Nobody can have listed a
 * category the database does not know, so that is an empty page, not an
 * error; anything else is still an error.
 */
async function noneIfUnknownCategory<T>(query: Promise<T[]>): Promise<T[]> {
  try {
    return await query
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "22P02") return []
    throw error
  }
}

function intro(category: Category, city: string, count: number) {
  const person = personWord([category.id])
  const label = category.label.toLowerCase()
  if (category.vertical === "beauty")
    return count
      ? `${count} ${person} ${label} nhận làm tại nhà ở ${city}. Giá theo khung chuẩn của 360dep, khách không trả phí nền tảng, miễn phí di chuyển trong ${POLICY.freeTravelKm} km đầu.`
      : `360dep chưa có ${person} ${label} ở ${city}. Bạn có thể đăng yêu cầu để ${person} quanh khu vực báo giá.`
  if (!count)
    return `360dep chưa có ${person} nào nhận việc này ở ${city}. Ngành này vừa mở; bạn có thể đăng yêu cầu để người phù hợp liên hệ.`
  return `${count} ${person} ở ${city} nhận việc này trên 360dep, làm tại địa điểm bạn chọn. Giá ${
    category.vertical === "model" ? "theo giờ" : "theo gói"
  } rõ ràng, khách không trả phí nền tảng.`
}

export default async function CityCategoryPage({ params }: { params: Params }) {
  const { city: citySlug, category: categorySlug } = await params
  const city = cityFromSlug(citySlug)
  const category = categoryFromSlug(categorySlug)
  if (!city || !category) notFound()

  const [pros, works] = await Promise.all([
    noneIfUnknownCategory(listPros({ city, category: category.id })),
    noneIfUnknownCategory(listWorks({ category: category.id, limit: 24 })),
  ])
  const templates = templatesByCategory(category.id as CategoryId)
  const cityWorks = works.filter((w) => pros.some((p) => p.slug === w.proSlug))
  const title = landingTitle(category, city)
  const person = personWord([category.id])

  // Structured data describing the offer, not inventing ratings for it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    serviceType: category.label,
    areaServed: { "@type": "City", name: city },
    provider: { "@type": "Organization", name: "360dep", url: absoluteUrl("/") },
    offers: templates.flatMap((t) =>
      t.variants.map((v) => ({
        "@type": "Offer",
        name: `${t.name} · ${v.label}`,
        priceCurrency: "VND",
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: v.minPrice,
          maxPrice: v.maxPrice,
          priceCurrency: "VND",
        },
      })),
    ),
  }

  const siblings = CATEGORIES.filter((c) => c.id !== category.id)
  const sameTrade = siblings.filter((c) => c.vertical === category.vertical)
  const otherTrades = siblings.filter((c) => c.vertical !== category.vertical)

  return (
    <div className="pt-4 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <Link href="/" className="inline-flex min-h-8 items-center hover:text-ink">
          360dep
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/search?category=${category.id}`} className="inline-flex min-h-8 items-center hover:text-ink">
          {category.label}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink-soft">{city}</span>
      </nav>

      <header className="mt-3 max-w-3xl">
        <CategoryTag category={category.id} />
        <h1 className="mt-3 text-[32px] font-bold leading-[1.08] tracking-[-0.025em] md:text-[44px]">{title}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">{intro(category, city, pros.length)}</p>
      </header>

      <div className="mt-8 md:mt-10 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-10 lg:gap-14">
        <div>
          <section>
            <h2 className="text-[20px] font-bold tracking-tight md:text-[24px]">
              {person.charAt(0).toUpperCase() + person.slice(1)} ở {city}
            </h2>
            {pros.length > 0 ? (
              <ul className="mt-4 grid gap-3 lg:grid-cols-2">
                {pros.map((p) => (
                  <li key={p.id}>
                    <ProCard
                      className="h-full"
                      pro={{
                        ...p,
                        uuid: p.id,
                        id: p.slug,
                        phone: "",
                        tone: "#E9C9C6",
                        bio: "",
                        highlights: [],
                        joinedAt: new Date().toISOString().slice(0, 10),
                        published: true,
                        studioAddress: p.studioAddress ?? undefined,
                        avatar: p.avatar ?? undefined,
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-line px-6 py-10 text-center">
                <p className="text-[17px] font-bold">
                  {category.vertical === "beauty"
                    ? `Chưa có ${person} ${category.label.toLowerCase()} ở ${city}`
                    : `Chưa có ${person} nào ở ${city}`}
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">
                  Đăng yêu cầu và {person} quanh bạn sẽ gửi báo giá khi có người nhận.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <ButtonLink href="/requests/new">Đăng yêu cầu</ButtonLink>
                  {category.vertical !== "beauty" && (
                    <ButtonLink href="/login?role=pro" variant="outline">
                      Bạn làm việc này? Mở hồ sơ
                    </ButtonLink>
                  )}
                </div>
              </div>
            )}
          </section>

          {cityWorks.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold tracking-tight md:text-[24px]">Tác phẩm gần đây</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5">
                {cityWorks.slice(0, 9).map((w, i) => (
                  <PostCard
                    key={w.id}
                    priority={i < 2}
                    work={{
                      id: w.id,
                      dbId: w.id,
                      proId: w.proSlug,
                      templateId: w.templateId,
                      category: w.category,
                      title: w.title,
                      description: w.description,
                      images: w.images,
                      kind: "work",
                      createdAt: "",
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="mt-12 md:mt-0">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 md:sticky md:top-24">
            <h2 className="text-[17px] font-bold tracking-tight">Khung giá trên 360dep</h2>
            <ul className="mt-3 divide-y divide-line">
              {templates.map((t) => {
                const band = priceBand(t)
                return (
                  <li key={t.id} className="py-2.5">
                    <p className="text-[15px] font-semibold">{t.name}</p>
                    {band && (
                      <p className="text-[14px] text-ink-soft">
                        {formatPrice(band[0])} – {formatPrice(band[1])}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {person.charAt(0).toUpperCase() + person.slice(1)} tự đặt giá trong khung này, nên bạn so sánh được giữa các hồ sơ.{" "}
              <Link href="/chinh-sach" className="font-semibold text-ink underline underline-offset-2">
                Chính sách phí
              </Link>
            </p>
            <ButtonLink href={`/search?category=${category.id}`} className="mt-4 w-full">
              Xem tác phẩm {category.label.toLowerCase()}
            </ButtonLink>
          </div>
        </aside>
      </div>

      <nav className="mt-14 border-t border-line pt-8" aria-label="Dịch vụ và khu vực khác">
        <LinkGroup
          title={`Cùng ngành ở ${city}`}
          links={sameTrade.map((c) => ({ href: `/${citySlug}/${c.id}`, label: landingTitle(c, city) }))}
        />
        <LinkGroup
          title={`${categoryPhrase(category)} ở thành phố khác`}
          links={CITIES.filter((c) => c !== city).map((c) => ({ href: `/${slugOfCity(c)}/${category.id}`, label: landingTitle(category, c) }))}
        />
        {VERTICALS.filter((v) => v.id !== category.vertical).map((v) => (
          <LinkGroup
            key={v.id}
            title={`${v.label} ở ${city}`}
            links={otherTrades.filter((c) => c.vertical === v.id).map((c) => ({ href: `/${citySlug}/${c.id}`, label: landingTitle(c, city) }))}
          />
        ))}
      </nav>
    </div>
  )
}

function LinkGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  if (!links.length) return null
  return (
    <div className="mb-6 last:mb-0">
      <h2 className="text-[15px] font-bold">{title}</h2>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-[14px] text-ink hover:border-ink/30"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
