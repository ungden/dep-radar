import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/ui"
import { getProBySlug, listProServices, listReviews } from "@/lib/api/pros"
import { absoluteUrl } from "@/lib/env"
import { aggregateRatingFor, serializeJsonLd } from "@/lib/json-ld"
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
  const id = (await params).id
  const pro = await getProBySlug(id)
  if (!pro) notFound()
  // A notification's link carries the row id; the address people share is the slug.
  if (id !== pro.slug) permanentRedirect(`/pros/${pro.slug}`)

  const [listings, reviews] = await Promise.all([listProServices(pro.id), listReviews(pro.id)])

  /**
   * Structured data for the profile. The rating is only included when there are
   * enough real reviews behind it (three, as on the page): an aggregateRating of
   * nothing, or of one review, is exactly the kind of invented number this
   * product is trying to stop showing.
   */
  const aggregateRating = aggregateRatingFor(pro.rating, SHOWING_SAMPLE_DATA)
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
    ...(aggregateRating ? { aggregateRating } : {}),
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
