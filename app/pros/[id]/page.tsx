import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/ui"
import { getProBySlug, listProServices, listReviews } from "@/lib/api/pros"
import { absoluteUrl } from "@/lib/env"
import { serializeJsonLd } from "@/lib/json-ld"
import { getTemplate, verticalOf } from "@/lib/catalog"
import { SHOWING_SAMPLE_DATA } from "@/lib/sample-data"
import { openGraph } from "@/lib/seo"
import { ProProfile } from "./pro-profile"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const pro = await getProBySlug((await params).id)
  if (!pro) return {}
  return {
    title: `${pro.name} · ${pro.title} tại ${pro.city}`,
    description: pro.bio,
    alternates: { canonical: `/pros/${pro.slug}` },
    openGraph: openGraph({ title: `${pro.name} · ${pro.title}`, url: `/pros/${pro.slug}`, images: pro.avatar ? [pro.avatar] : undefined }),
  }
}

export default async function ProPage({ params }: { params: Promise<{ id: string }> }) {
  const pro = await getProBySlug((await params).id)
  if (!pro) notFound()

  const [listings, reviews] = await Promise.all([listProServices(pro.id), listReviews(pro.id)])

  /**
   * Structured data for the profile. The rating is only included when there are
   * real reviews behind it: an aggregateRating of nothing is exactly the kind of
   * invented number this product is trying to stop showing.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    // A makeup artist is a beauty business; a photographer or a model is not.
    "@type": pro.categories.every((c) => verticalOf(c) === "beauty") ? "BeautySalon" : "ProfessionalService",
    name: pro.name,
    description: pro.bio,
    url: absoluteUrl(`/pros/${pro.slug}`),
    image: pro.avatar ? absoluteUrl(pro.avatar) : undefined,
    address: { "@type": "PostalAddress", addressLocality: pro.district, addressRegion: pro.city, addressCountry: "VN" },
    areaServed: pro.areas.map((area) => ({ "@type": "Place", name: area })),
    ...(pro.rating.count > 0 && !SHOWING_SAMPLE_DATA
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: pro.rating.average.toFixed(2),
            reviewCount: pro.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    makesOffer: listings.flatMap((listing) => {
      const template = getTemplate(listing.templateId)
      if (!template) return []
      return Object.entries(listing.prices).map(([variantId, price]) => ({
        "@type": "Offer",
        priceCurrency: "VND",
        price,
        itemOffered: {
          "@type": "Service",
          name: `${template.name} · ${template.variants.find((v) => v.id === variantId)?.label ?? variantId}`,
        },
      }))
    }),
    review: (SHOWING_SAMPLE_DATA ? [] : reviews.slice(0, 5)).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.body,
      datePublished: r.createdAt.slice(0, 10),
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Suspense fallback={<PageSkeleton />}>
        <ProProfile proId={pro.slug} />
      </Suspense>
    </>
  )
}
