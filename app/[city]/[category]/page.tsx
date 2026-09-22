import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProCard, WorkCard } from "@/components/beauty"
import { Card, EmptyState, PageHeader } from "@/components/ui"
import { listPros, listWorks } from "@/lib/api/pros"
import { CATEGORIES, categoryLabel, templatesByCategory } from "@/lib/catalog"
import { absoluteUrl } from "@/lib/env"
import { serializeJsonLd } from "@/lib/json-ld"
import { CITIES } from "@/lib/geo"
import { POLICY } from "@/lib/pricing"
import type { CategoryId } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

/**
 * Landing pages for the searches people actually type: "nail tại nhà Hà Nội".
 * One page per city and category, server-rendered with its own metadata and
 * structured data, because these are the pages that have to be findable.
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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await params
  const city = cityFromSlug(citySlug)
  const category = categoryFromSlug(categorySlug)
  if (!city || !category) return {}
  const title = `${category.label} tại nhà ${city} — đặt lịch với chuyên viên freelancer`
  return {
    title,
    description: `Đặt ${category.label.toLowerCase()} tại nhà ở ${city}. Giá niêm yết theo khung chuẩn, không phí nền tảng cho khách, miễn phí di chuyển trong ${POLICY.freeTravelKm} km.`,
    alternates: { canonical: `/${citySlug}/${category.id}` },
    openGraph: { title, url: absoluteUrl(`/${citySlug}/${category.id}`) },
  }
}

export default async function CityCategoryPage({ params }: { params: Params }) {
  const { city: citySlug, category: categorySlug } = await params
  const city = cityFromSlug(citySlug)
  const category = categoryFromSlug(categorySlug)
  if (!city || !category) notFound()

  const [pros, works] = await Promise.all([
    listPros({ city, category: category.id }),
    listWorks({ category: category.id, limit: 24 }),
  ])
  const templates = templatesByCategory(category.id as CategoryId)
  const cityWorks = works.filter((w) => pros.some((p) => p.slug === w.proSlug))

  // Structured data describing the offer, not inventing ratings for it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${category.label} tại nhà ${city}`,
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

  return (
    <div className="md:pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <PageHeader title={`${category.label} tại nhà ${city}`} back="/" />

      <p className="text-sm leading-relaxed text-ink-soft">
        {pros.length > 0
          ? `${pros.length} chuyên viên ${category.label.toLowerCase()} nhận làm tại nhà ở ${city}. Giá theo khung chuẩn của 360dep, khách không trả phí nền tảng, miễn phí di chuyển trong ${POLICY.freeTravelKm} km đầu.`
          : `360dep chưa có chuyên viên ${category.label.toLowerCase()} ở ${city}. Bạn có thể đăng yêu cầu để chuyên viên quanh khu vực báo giá.`}
      </p>

      <Card className="mt-4 p-4">
        <h2 className="text-sm font-semibold">Khung giá {category.label.toLowerCase()} ở 360dep</h2>
        <ul className="mt-2 space-y-1.5 text-[13px] text-ink-soft">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-wrap gap-x-2">
              <span className="font-medium text-ink">{t.name}</span>
              <span>
                {formatPrice(Math.min(...t.variants.map((v) => v.minPrice)))} –{" "}
                {formatPrice(Math.max(...t.variants.map((v) => v.maxPrice)))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Chuyên viên tự đặt giá trong khung này, nên bạn so sánh được giữa các hồ sơ.{" "}
          <Link href="/chinh-sach" className="text-accent underline underline-offset-2">
            Chính sách phí
          </Link>
        </p>
      </Card>

      {pros.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold">Chuyên viên ở {city}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {pros.map((p) => (
              <li key={p.id}>
                <ProCard
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
        </section>
      ) : (
        <EmptyState
          title={`Chưa có chuyên viên ${category.label.toLowerCase()} ở ${city}`}
          text="Đăng yêu cầu và chuyên viên quanh bạn sẽ gửi báo giá."
        />
      )}

      {cityWorks.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Tác phẩm {category.label.toLowerCase()} gần đây</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {cityWorks.slice(0, 8).map((w) => (
              <WorkCard
                key={w.id}
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

      <nav className="mt-10 border-t border-line pt-4">
        <h2 className="text-sm font-semibold">Dịch vụ khác ở {city}</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.id !== category.id).map((c) => (
            <li key={c.id}>
              <Link
                href={`/${citySlug}/${c.id}`}
                className="inline-block rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink-soft shadow-[var(--shadow-soft)]"
              >
                {c.label} tại nhà {city}
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="mt-5 text-sm font-semibold">{categoryLabel(category.id as CategoryId)} ở thành phố khác</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {CITIES.filter((c) => c !== city).map((c) => (
            <li key={c}>
              <Link
                href={`/${slugOfCity(c)}/${category.id}`}
                className="inline-block rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink-soft shadow-[var(--shadow-soft)]"
              >
                {category.label} tại nhà {c}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
