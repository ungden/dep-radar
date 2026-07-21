"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import * as React from "react"

import { trackEvent } from "@/lib/analytics"
import { buildCatalogueHref } from "@/lib/catalogue"

const concernChoices = [
  {
    slug: "tri-mun",
    label: "Mụn",
    image: "/images/editorial/ban-do-tri-mun-tu-mun-an-den-mun-nang.jpg",
    href: buildCatalogueHref("tri-mun"),
  },
  {
    slug: "da-nhay-cam",
    label: "Da nhạy cảm",
    image: "/images/editorial/da-nhay-cam-nen-xay-routine-nhu-the-nao.jpg",
    href: buildCatalogueHref("da-mat", { skin: "da-nhay-cam" }),
  },
  {
    slug: "chong-nang",
    label: "Chống nắng",
    image: "/images/editorial/kem-chong-nang-da-dau-khong-bi.jpg",
    href: buildCatalogueHref("sang-da-chong-nang", { condition: "chong-nang-da-dau" }),
  },
  {
    slug: "toc-da-dau",
    label: "Tóc & da đầu",
    image: "/images/editorial/gau-dau-hay-da-dau-kho.jpg",
    href: buildCatalogueHref("toc-da-dau"),
  },
  {
    slug: "makeup",
    label: "Trang điểm",
    image: "/images/editorial/pillar-makeup-theo-nen-da-va-dip-dung.jpg",
    href: buildCatalogueHref("makeup"),
  },
  {
    slug: "mui-huong",
    label: "Mùi hương",
    image: "/images/editorial/pillar-chon-mui-huong-theo-dip-va-mua.jpg",
    href: buildCatalogueHref("mui-huong"),
  },
] as const

export function HeroSection() {
  const [selectedSlug, setSelectedSlug] = React.useState<(typeof concernChoices)[number]["slug"]>("tri-mun")
  const selected = concernChoices.find((choice) => choice.slug === selectedSlug) ?? concernChoices[0]

  return (
    <section className="relative isolate overflow-hidden border-b border-stone-200 bg-[#fbf8f7] dark:border-slate-800 dark:bg-slate-950">
      <Image
        src="/images/home/beauty-desk-hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center dark:opacity-20"
      />
      <div className="absolute inset-0 -z-10 bg-white/34 dark:bg-slate-950/48" aria-hidden="true" />

      <div className="container mx-auto px-4 py-9 md:px-6 md:pb-6 md:pt-14 lg:pb-4 lg:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mx-auto max-w-3xl font-display text-[2.15rem] font-black leading-[1.08] tracking-[-0.035em] text-slate-950 dark:text-white sm:text-5xl lg:max-w-[620px] lg:text-5xl">
            Hôm nay bạn muốn hiểu điều gì về làn da và cơ thể?
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
            Chọn một vấn đề đang quan tâm để nhận lộ trình đọc rõ ràng, an toàn và phù hợp hơn.
          </p>
        </div>

        <div
          role="group"
          aria-label="Chọn mối quan tâm"
          className="mx-auto mt-6 grid max-w-5xl grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-6 lg:gap-3"
        >
          {concernChoices.map((choice) => {
            const active = choice.slug === selectedSlug
            return (
              <button
                key={choice.slug}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedSlug(choice.slug)
                  trackEvent("finder_start", { hub: choice.slug, source: "homepage_visual" })
                }}
                className={`group relative overflow-hidden rounded-2xl border bg-white text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:bg-slate-900 ${active ? "border-rose-500 shadow-[0_8px_28px_rgba(225,29,72,0.14)]" : "border-white/80 shadow-sm hover:-translate-y-0.5 hover:border-rose-200 dark:border-slate-700"}`}
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-slate-800">
                  <Image
                    src={choice.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 160px, (min-width: 640px) 30vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </span>
                <span className="flex min-h-12 items-center justify-between gap-1 px-2 py-2 text-xs font-bold leading-4 text-slate-900 dark:text-white sm:gap-2 sm:px-3 sm:text-sm">
                  {choice.label}
                  {active && <Check className="h-4 w-4 shrink-0 text-rose-600" />}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <Link
            href={selected.href}
            onClick={() => trackEvent("finder_complete", { hub: selected.slug, source: "homepage_visual" })}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 text-sm font-black text-white transition hover:bg-rose-700 sm:w-auto"
          >
            Tiếp tục khám phá <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/catalogue" className="inline-flex min-h-11 items-center px-3 text-sm font-bold text-slate-700 transition hover:text-rose-600 dark:text-slate-200">
            Hoặc xem toàn bộ 14 chủ đề
          </Link>
        </div>
      </div>
    </section>
  )
}
