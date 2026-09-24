import type { Metadata } from "next"
import { absoluteUrl } from "@/lib/env"
import { serializeJsonLd } from "@/lib/json-ld"
import { HomeView } from "./home-view"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

/** Who runs the site, its logo, and the search box Google may show under the result. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#org"),
      name: "360đẹp",
      alternateName: "360dep",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/brand/icon-512.png"),
      legalName: "Công ty TNHH Thương mại Dịch vụ Quốc tế Titan",
      taxID: "0318332494",
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#site"),
      name: "360đẹp",
      alternateName: "360dep",
      url: absoluteUrl("/"),
      inLanguage: "vi",
      publisher: { "@id": absoluteUrl("/#org") },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={q}` },
        "query-input": "required name=q",
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <HomeView />
    </>
  )
}
