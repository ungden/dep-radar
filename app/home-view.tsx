"use client"

import * as React from "react"
import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Bell, ChevronDown, ChevronLeft, ChevronRight, MapPin, MessageCircle, Pause, Play, RotateCcw, Search, Sparkles, X } from "lucide-react"
import { bookingImage } from "@/components/booking-card"
import { PostCard, VerticalSwitch } from "@/components/beauty"
import { CategoryTiles } from "@/components/category-icon"
import { MobileLinks } from "@/components/mobile-links"
import { DataUnavailable } from "@/components/data-unavailable"
import { CatalogCard, ServiceCard } from "@/components/service-card"
import { Button, ButtonLink, LogoMark, PageSkeleton, Wordmark } from "@/components/ui"
import { DEMO_DATA_LIVE } from "@/lib/launch"
import { CATALOG, CATEGORIES, getVertical, isVertical } from "@/lib/catalog"
import { HERO_PHOTOS, OCCASION_PHOTOS } from "@/lib/design/photos"
import { pinPriority } from "@/lib/discovery"
import { actions } from "@/lib/client-actions"
import { rankFeed, type VerticalFilter } from "@/lib/feed"
import { CITIES } from "@/lib/geo"
import { occasionTemplates, occasionsFor, suggestionsFor } from "@/lib/occasions"
import { categoryRow, serviceOffers } from "@/lib/offers"
import { POLICY, TRAVEL_FEE_SUMMARY } from "@/lib/pricing"
import { distanceToCustomer, getPro, useApp } from "@/lib/store"
import type { Booking, Category, CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"

const DEMO_KEY = "dep360_demo_notice"
/** Set once the visitor has answered "Bạn ở đâu?" (or picked a city some other way). */
const CITY_ASKED_KEY = "dep360_city_asked"
const SERVICES_FIRST = 8

export function HomeView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Explore />
    </Suspense>
  )
}

function Explore() {
  const state = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { city, session } = state

  // The trade lives in the URL so a link to "Chụp & quay" opens on it.
  const vertical: VerticalFilter = isVertical(params.get("nganh")) ? (params.get("nganh") as VerticalFilter) : "all"
  const setVertical = (v: VerticalFilter) => {
    const next = new URLSearchParams(params.toString())
    if (v === "all") next.delete("nganh")
    else next.set("nganh", v)
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }
  const [category, setCategory] = React.useState<CategoryId | "all">("all")
  // Rendered on the server and in the browser: fixing "now" once keeps both in step.
  const [now] = React.useState(() => new Date())

  // What is for sale here: services someone nearby offers, with real prices.
  const offers = React.useMemo(
    () => serviceOffers({ pros: state.pros, proServices: state.proServices, works: state.works, city, vertical }),
    [state.pros, state.proServices, state.works, city, vertical],
  )
  // How many services of this trade exist in other cities, for "Xem cả nước".
  const elsewhere = React.useMemo(
    () => (city ? serviceOffers({ pros: state.pros, proServices: state.proServices, works: [], city: null, vertical }).length : 0),
    [state.pros, state.proServices, city, vertical],
  )
  const categories = CATEGORIES.filter((c) => vertical === "all" || c.vertical === vertical)
  const shownCategory = categories.some((c) => c.id === category) ? category : "all"
  const counted = categoryRow(categories, offers, shownCategory, 4)
  // Nail and Makeup lead the row whatever is on offer (lib/discovery.ts).
  const tiles = { ...counted, ...pinPriority(counted, shownCategory) }
  const [allCategories, setAllCategories] = React.useState(false)
  const shownCategoryInfo = CATEGORIES.find((c) => c.id === shownCategory)
  const shown = offers.filter((o) => shownCategory === "all" || o.template.category === shownCategory)
  // The most offered first; the rest one tap away, so the first screen stays short.
  const [expanded, setExpanded] = React.useState(false)
  const visible = expanded || shownCategory !== "all" ? shown : shown.slice(0, SERVICES_FIRST)

  // Nobody offers anything here yet: show 360đẹp's own price list instead of an
  // empty box. The prices are the platform's, so they are true before anyone signs up.
  const catalog =
    shownCategory !== "all"
      ? CATALOG.filter((t) => t.category === shownCategory).slice(0, 8)
      : categories.flatMap((c) => CATALOG.filter((t) => t.category === c.id).slice(0, vertical === "all" ? 1 : 2)).slice(0, 8)

  // A short row of real work under the services, as proof, not as the page.
  const proof = React.useMemo(() => {
    const works = state.works.filter((w) => !city || getPro(state, w.proId)?.city === city)
    return rankFeed(
      works,
      state.pros,
      {
        vertical,
        interests: new Set(state.interests),
        followed: new Set(state.followedPros),
        distanceKm: (proId) => (session?.role === "pro" ? null : distanceToCustomer(state, proId)),
        stats: state.workStats,
        now,
      },
      "for-you",
    ).slice(0, 8)
  }, [state, city, vertical, session, now])

  // Wide screens have room for every category in one row; phones get the
  // short row and "Xem thêm" (categoryRow).
  const rowIds = new Set(tiles.row.map((c) => c.id))
  const tileItems = (allCategories ? tiles.ordered : [...tiles.row, ...tiles.ordered.filter((c) => !rowIds.has(c.id))]).map((c) => ({
    id: c.id,
    label: c.id === "photophone" || c.id === "skincare" ? c.label : c.short ?? c.label,
    soon: !state.catalogError && !tiles.offered.has(c.id) && offers.length > 0,
    className: allCategories || rowIds.has(c.id) ? undefined : "hidden lg:flex",
  }))

  const sectionTitle = `${shownCategoryInfo ? shownCategoryInfo.label : vertical === "all" ? "Dịch vụ" : getVertical(vertical).label}${city ? ` ở ${city}` : ""}`
  const pickCategory = (id: CategoryId | "all") => {
    setCategory(id)
    setAllCategories(false)
    document.getElementById("dich-vu")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="pt-1 md:pt-8">
      <TopBar />
      {DEMO_DATA_LIVE && <DemoNotice />}

      {/* Search first, like a map app: where, then what. */}
      <div className="mt-3 flex items-center gap-2 md:mx-auto md:mt-0 md:max-w-3xl">
        <SearchBox className="flex-1 md:hidden" />
        <HeroSearch city={city} className="hidden flex-1 md:flex" />
      </div>
      <Suggestions now={now} />

      {/* "Hôm nay bạn muốn làm gì?": the trade, then a category, in one card. */}
      <section aria-labelledby="pick-title" className="mt-5 rounded-[var(--radius-xl)] border border-line bg-surface p-4 shadow-[0_1px_2px_rgb(28_24_18/0.03)] md:mt-8 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="pick-title" className="text-[19px] font-extrabold tracking-tight md:text-[22px]">Hôm nay bạn muốn làm gì?</h2>
          <VerticalSwitch value={vertical} onChange={(v) => { setVertical(v); setCategory("all"); setAllCategories(false) }} className="-mx-1 px-1" />
        </div>
        {categories.length > 1 && (
          <CategoryTiles
            className="mt-5"
            items={tileItems}
            value={shownCategory}
            // Tapping the chosen category again goes back to everything.
            onChange={(id) => pickCategory(id === shownCategory ? "all" : (id as CategoryId))}
            more={tiles.more ? { open: allCategories, onToggle: () => setAllCategories((v) => !v), className: allCategories ? undefined : "lg:hidden" } : undefined}
          />
        )}
      </section>

      <HeroCarousel now={now} onVertical={(v) => { setVertical(v); setCategory("all") }} />

      <Rebook />

      <section id="dich-vu" className="mt-12 scroll-mt-20 md:mt-16 md:scroll-mt-24">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{shown.length > 0 ? "Đang nhận lịch" : "Bảng giá 360đẹp"}</p>
            <h2 className="mt-1.5 text-[24px] font-extrabold leading-tight tracking-tight md:text-[30px]">{sectionTitle}</h2>
          </div>
          {shownCategoryInfo ? (
            <button
              type="button"
              onClick={() => setCategory("all")}
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-line bg-surface pl-3.5 pr-3 text-meta font-semibold text-ink hover:border-ink"
            >
              Tất cả <X className="size-3.5" aria-hidden />
            </button>
          ) : (
            <Link href="/search" className="hidden shrink-0 items-center gap-1 text-body font-bold text-ink hover:text-accent sm:inline-flex">
              Xem tất cả <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>

        {state.catalogError ? <DataUnavailable /> : shown.length === 0 ? (
          <>
            <EmptySupply vertical={vertical} city={city} elsewhere={elsewhere} category={shownCategoryInfo} />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {catalog.map((t, i) => (
                <CatalogCard key={t.id} template={t} index={i} priority={i < 2} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {visible.map((o, i) => (
              <ServiceCard key={o.template.id} offer={o} priority={i < 4} />
            ))}
          </div>
        )}
        {visible.length < shown.length && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-6 h-12 w-full rounded-full border border-line bg-surface text-body font-semibold hover:border-ink md:w-auto md:px-8"
          >
            Xem tất cả {shown.length} dịch vụ
          </button>
        )}
      </section>

      <Occasions now={now} />

      {proof.length > 0 && (
        <section className="mt-14 md:mt-20">
          <SectionTitle eyebrow="Tác phẩm" title="Ảnh thật từ người làm" href="/search?tab=works" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {proof.map((w) => (
              <PostCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}

      <HowItWorks />

      <section className="mt-14 overflow-hidden rounded-[var(--radius-xl)] bg-highlight-soft md:mt-20">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-xl">
            <p className="eyebrow text-[#7A5A0E]">Đăng yêu cầu</p>
            <p className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight md:text-[34px]">Không thấy đúng thứ bạn cần?</p>
            <p className="mt-2 text-body text-ink-soft">Chọn dịch vụ, giờ và nơi làm với giá niêm yết. Người làm gần bạn được báo, ai nhận trước sẽ gọi xác nhận. Không mất phí đăng.</p>
          </div>
          <ButtonLink href="/requests/new" size="lg" variant="dark" className="shrink-0">
            Đăng yêu cầu <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </section>

      {/* The footer is desktop-only; on a phone these are the links it would have given. */}
      <MobileLinks className="mt-10" />
    </div>
  )
}

/**
 * The big picture under the categories: one slide per trade, plus the
 * occasion in season. A photo with a dark fade, one line of promise and one
 * gold button; it turns by itself, and stops when touched or asked to.
 */
function HeroCarousel({ now, onVertical }: { now: Date; onVertical: (v: VerticalFilter) => void }) {
  const occasion = occasionsFor(now)[0]
  const slides = [
    {
      key: "beauty",
      eyebrow: "Làm đẹp tại nhà",
      title: "Nail, makeup, gội dưỡng: người làm đến tận nơi",
      text: `Giá niêm yết cho từng gói. Phí di chuyển: ${TRAVEL_FEE_SUMMARY}. Làm xong mới trả.`,
      cta: "Xem dịch vụ làm đẹp",
      photo: HERO_PHOTOS.beauty,
      onClick: () => onVertical("beauty"),
    },
    {
      key: "photo",
      eyebrow: "Chụp & quay",
      title: "Lên hình đẹp, chỉ cần một chiếc điện thoại",
      text: "Người chụp đi cùng bạn ra quán, ra phố, chụp bằng điện thoại hay máy ảnh.",
      cta: "Xem chụp & quay",
      photo: HERO_PHOTOS.photo,
      onClick: () => onVertical("photo"),
    },
    {
      key: "model",
      eyebrow: "Người mẫu",
      title: "Mẫu ảnh, mẫu livestream cho shop online",
      text: "Mẫu ảnh lookbook, mẫu clip và livestream, giá niêm yết theo từng gói.",
      cta: "Xem người mẫu",
      photo: HERO_PHOTOS.model,
      onClick: () => onVertical("model"),
    },
    ...(occasion
      ? [{ key: occasion.id, eyebrow: "Theo dịp", title: occasion.title, text: occasion.subtitle, cta: "Xem gói theo dịp", photo: OCCASION_PHOTOS[occasion.id] ?? HERO_PHOTOS.beauty, href: `/dip/${occasion.id}` }]
      : []),
  ]
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  React.useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000)
    return () => window.clearInterval(t)
  }, [paused, slides.length])
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length)

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Gợi ý nổi bật"
      className="relative mt-5 overflow-hidden rounded-[var(--radius-xl)] bg-ink md:mt-8"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
    >
      <div className="relative aspect-[7/8] min-[420px]:aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/8]">
        {slides.map((s, i) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
            aria-hidden={i !== index}
            className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
          >
            <Image src={s.photo} alt="" fill priority={i === 0} sizes="(min-width: 1200px) 1150px, 100vw" className="object-cover object-[60%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 md:bg-gradient-to-r md:from-black/75 md:via-black/35 md:to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 pb-12 md:inset-y-0 md:flex md:max-w-[58%] md:flex-col md:justify-center md:p-12">
              <span className="inline-flex w-fit rounded-full border border-white/40 bg-black/25 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur">{s.eyebrow}</span>
              <p className="mt-3 text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white md:text-[44px]">{s.title}</p>
              <p className="mt-2 max-w-md text-meta text-white/85 md:mt-2.5 md:text-lead">{s.text}</p>
              {"href" in s && s.href ? (
                <ButtonLink href={s.href} variant="highlight" className="mt-5 w-fit" tabIndex={i === index ? 0 : -1}>
                  {s.cta} <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              ) : (
                <Button
                  variant="highlight"
                  className="mt-5 w-fit"
                  tabIndex={i === index ? 0 : -1}
                  onClick={() => {
                    "onClick" in s && s.onClick?.()
                    document.getElementById("dich-vu")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                >
                  {s.cta} <ArrowRight className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        ))}
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">Ảnh minh hoạ</span>
      </div>
      <div className="absolute bottom-3.5 left-5 flex items-center gap-1.5 md:left-12 md:bottom-6">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Xem gợi ý ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className="flex h-6 items-center"
          >
            <span className={cn("block h-1.5 rounded-full transition-all", i === index ? "w-6 bg-white" : "w-1.5 bg-white/50")} />
          </button>
        ))}
      </div>
      <div className="absolute bottom-3 right-3 hidden gap-2 md:flex">
        <button type="button" aria-label="Gợi ý trước" onClick={() => go(-1)} className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white"><ChevronLeft className="size-5" /></button>
        <button type="button" aria-label="Gợi ý sau" onClick={() => go(1)} className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white"><ChevronRight className="size-5" /></button>
        <button type="button" aria-label={paused ? "Tiếp tục tự chuyển" : "Dừng tự chuyển"} onClick={() => setPaused((p) => !p)} className="inline-flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
      </div>
    </section>
  )
}

/** Search shortcuts chosen by the calendar, under the search box. */
function Suggestions({ now }: { now: Date }) {
  return (
    <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-auto md:max-w-3xl md:flex-wrap md:justify-center md:px-0">
      {suggestionsFor(now).map((s) => (
        <Link key={s.href} href={s.href} className="inline-flex h-9 shrink-0 items-center rounded-full border border-line bg-surface px-3.5 text-meta font-semibold text-ink-soft hover:border-ink hover:text-ink">
          {s.label}
        </Link>
      ))}
    </div>
  )
}

/** "Theo dịp": collections of services booked together, as editorial cards. */
function Occasions({ now }: { now: Date }) {
  const list = occasionsFor(now).slice(0, 4)
  return (
    <section className="mt-14 md:mt-20">
      <SectionTitle eyebrow="Theo dịp" title="Chuẩn bị cho dịp sắp tới" />
      <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:px-0">
        {list.map((o) => (
          <li key={o.id} className="w-[260px] shrink-0 snap-start md:w-auto">
            <Link href={`/dip/${o.id}`} className="group block overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
              <span className="relative block aspect-[4/3] overflow-hidden bg-subtle">
                <Image src={OCCASION_PHOTOS[o.id] ?? HERO_PHOTOS.beauty} alt="" fill sizes="(min-width: 768px) 280px, 260px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              </span>
              <span className="block p-4">
                <span className="eyebrow text-[11px] text-accent">{occasionTemplates(o).length} dịch vụ</span>
                <span className="mt-1 block font-display text-[21px] font-semibold leading-tight tracking-[-0.01em]">{o.title}</span>
                <span className="mt-1 block text-meta text-ink-soft">{o.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Three facts that decide whether to trust a stranger with your face. */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Chọn gói, thấy giá trước", text: "Giá niêm yết cho từng gói, khách không trả phí nền tảng, không đặt cọc." },
    { n: "02", title: "Người làm gọi xác nhận", text: `Người làm gọi cho bạn chốt giờ và nơi làm rồi mới nhận lịch, thường trong ${POLICY.confirmWithinHours} giờ.` },
    { n: "03", title: "Làm xong mới trả", text: `Trả trực tiếp sau khi xong. Phí di chuyển hiện rõ khi đặt; chỉ khách đã làm mới được đánh giá.` },
  ]
  return (
    <section className="mt-14 md:mt-20">
      <SectionTitle eyebrow="Cách 360đẹp làm việc" title="Rõ giá, rõ người, rõ giờ" href="/chinh-sach" linkLabel="Chính sách" />
      <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
        {steps.map((s) => (
          <li key={s.n} className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 md:p-6">
            <span className="font-display text-[30px] font-semibold leading-none text-accent">{s.n}</span>
            <p className="mt-3 text-lead font-bold tracking-tight">{s.title}</p>
            <p className="mt-1.5 text-body text-ink-soft">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** A signed-in customer's past services, one tap from booking the same again. */
function Rebook() {
  const state = useApp()
  const { session, bookings } = state
  if (session?.role !== "customer") return null
  const seen = new Set<string>()
  const list: Booking[] = []
  const done = bookings
    .filter((x) => x.mine && x.status === "completed")
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
  for (const b of done) {
    const key = `${b.proId}|${b.templateId}`
    if (seen.has(key) || !getPro(state, b.proId)?.acceptingJobs) continue
    seen.add(key)
    list.push(b)
    if (list.length === 4) break
  }
  if (!list.length) return null
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[20px] font-extrabold tracking-tight">Đặt lại</h2>
      <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0">
        {list.map((b) => {
          const image = bookingImage(state, b)
          return (
            <li key={b.id} className="w-[240px] shrink-0 md:w-auto">
              <Link
                href={`/book/${b.proId}?service=${b.templateId}&variant=${b.variantId}`}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-2.5 hover:border-ink"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-subtle">
                  {image && <Image src={image} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold">{b.serviceName}</span>
                  <span className="block truncate text-meta text-ink-soft">{b.proName}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-meta font-semibold text-accent">
                    <RotateCcw className="size-3.5" aria-hidden /> Đặt lại
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------

function TopBar() {
  const state = useApp()
  const { city, session } = state
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 md:hidden">
      <Link href="/" aria-label="360dep" className="flex items-center gap-2">
        <LogoMark size={30} />
        <Wordmark size={22} className="hidden min-[340px]:block" />
      </Link>
      <div className="flex items-center gap-0.5">
        <CityPicker value={city} />
        {session ? (
          <>
            <Link href="/tin-nhan" aria-label="Tin nhắn" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-subtle">
              <MessageCircle className="size-[22px]" />
            </Link>
            <Link href="/thong-bao" aria-label="Thông báo" className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-subtle">
              <Bell className="size-[22px]" />
              {state.unreadNotifications > 0 && (
                <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-accent px-1 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-canvas">
                  {state.unreadNotifications > 9 ? "9+" : state.unreadNotifications}
                </span>
              )}
            </Link>
          </>
        ) : (
          <Link href="/login" className="ml-1 inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-ink px-3.5 text-meta font-semibold text-white">
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  )
}

/**
 * The desktop search: where, then what, in one bar (as Airbnb and Booksy do),
 * so the city is chosen where it matters instead of in a box of its own.
 */
function HeroSearch({ city, className }: { city: string | null; className?: string }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  return (
    <form
      role="search"
      className={cn(
        "h-[60px] items-center rounded-full border border-line bg-surface pl-2 pr-2 shadow-[var(--shadow-soft)] transition-shadow focus-within:border-ink focus-within:shadow-[var(--shadow-raised)]",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
      }}
    >
      <label className="relative flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink hover:bg-subtle">
        <MapPin className="size-[18px] text-accent" aria-hidden />
        <span className="flex flex-col leading-tight">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">Khu vực</span>
          <span className="flex items-center gap-1 text-meta font-bold text-ink">
            {city ?? "Toàn quốc"} <ChevronDown className="size-3.5 text-muted" aria-hidden />
          </span>
        </span>
        <CitySelect value={city} />
      </label>
      <span aria-hidden className="mx-1 h-8 w-px bg-line" />
      <label className="flex h-11 min-w-0 flex-1 items-center gap-3 px-3">
        <Search className="size-5 shrink-0 text-ink" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Tìm nail, makeup, chụp ảnh, người mẫu…"
          aria-label="Tìm kiếm"
          className="h-full min-w-0 flex-1 bg-transparent text-body placeholder:text-muted focus:outline-none"
        />
      </label>
      <button type="submit" className="inline-flex h-11 shrink-0 items-center rounded-full bg-ink px-7 text-body font-semibold text-white hover:bg-accent">
        Tìm
      </button>
    </form>
  )
}

function SearchBox({ className }: { className?: string }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
      }}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder="Nail, makeup, chụp ảnh…"
        aria-label="Tìm kiếm"
        className="h-[52px] w-full rounded-full border border-line bg-surface pl-12 pr-[72px] text-body shadow-[var(--shadow-soft)] placeholder:text-muted focus:border-ink focus:outline-none"
      />
      <button type="submit" className="absolute right-1.5 top-1/2 inline-flex h-10 -translate-y-1/2 items-center rounded-full bg-ink px-4 text-meta font-semibold text-white">
        Tìm
      </button>
    </form>
  )
}

/**
 * The demo notice stays (the data is sample data, and saying so is the rule)
 * but as one quiet line that can be dismissed, not a banner in the way.
 */
function DemoNotice() {
  const [dismissed, setDismissed] = React.useState(false)
  const stored = React.useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(DEMO_KEY) === "hidden"
      } catch {
        return false
      }
    },
    // Not rendered on the server: it depends on this browser's choice.
    () => true,
  )
  const hidden = dismissed || stored
  if (hidden) return null
  return (
    <p className="mb-3 flex items-center gap-2 rounded-full bg-highlight-soft py-1 pl-3.5 pr-1 text-meta text-ink md:mx-auto md:mb-6 md:w-fit md:max-w-full">
      <span className="flex-1">
        <span className="md:hidden">Bản demo: hồ sơ là dữ liệu mẫu.</span>
        <span className="hidden md:inline">Bản demo: nhiều hồ sơ là dữ liệu mẫu, thanh toán online chưa hoạt động.</span>{" "}
        <Link href="/chinh-sach" className="font-semibold underline underline-offset-2">
          Chi tiết
        </Link>
      </span>
      <button
        type="button"
        aria-label="Ẩn thông báo"
        className="inline-flex size-8 items-center justify-center rounded-full hover:bg-black/5"
        onClick={() => {
          setDismissed(true)
          try {
            localStorage.setItem(DEMO_KEY, "hidden")
          } catch {}
        }}
      >
        <X className="size-4" />
      </button>
    </p>
  )
}

/**
 * Nobody offers this here yet. One line that says so and what to do, above
 * 360đẹp's own price list for it; the invitation to providers is a link.
 */
function EmptySupply({
  vertical,
  city,
  elsewhere,
  category,
}: {
  vertical: VerticalFilter
  city: string | null
  elsewhere: number
  category?: Category
}) {
  const label = category ? category.label : vertical === "all" ? null : getVertical(vertical).label
  const where = city ? ` ở ${city}` : ""
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-highlight-soft text-ink">
          <Sparkles className="size-5" />
        </span>
        <div>
          <p className="text-body font-bold">{label ? `${label}: chưa có người nhận lịch${where}` : `Chưa có người nhận lịch${where}`}</p>
          <p className="mt-0.5 text-meta text-ink-soft">
            {elsewhere > 0
              ? `Có ${elsewhere} dịch vụ ở thành phố khác. Hoặc đăng yêu cầu theo giá dưới đây: người làm phù hợp sẽ được báo.`
              : "Đăng yêu cầu theo giá niêm yết dưới đây: khi có người làm gần bạn, họ được báo và ai nhận trước sẽ làm."}{" "}
            <Link href="/doi-tac" className="font-semibold text-accent-dark underline underline-offset-2">Bạn làm trong ngành?</Link>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {elsewhere > 0 && (
          <button
            type="button"
            onClick={() => void actions.setCity(null)}
            className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-4 text-meta font-semibold hover:border-ink"
          >
            Xem cả nước
          </button>
        )}
        <ButtonLink
          size="sm"
          href={
            category
              ? `/requests/new?category=${category.id}`
              : vertical === "all"
                ? "/requests/new"
                : `/requests/new?category=${CATEGORIES.find((c) => c.vertical === vertical)?.id}`
          }
        >
          Đăng yêu cầu
        </ButtonLink>
      </div>
    </div>
  )
}

function SectionTitle({ eyebrow, title, href, linkLabel = "Xem tất cả" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1.5 text-[24px] font-extrabold leading-tight tracking-tight md:text-[30px]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-body font-bold text-ink hover:text-accent">
          {linkLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  )
}

function CitySelect({ value }: { value: string | null }) {
  return (
    <select
      aria-label="Chọn khu vực"
      value={value ?? ""}
      onChange={(e) => {
        try {
          localStorage.setItem(CITY_ASKED_KEY, "1")
        } catch {}
        void actions.setCity(e.target.value || null)
      }}
      className="absolute inset-0 cursor-pointer opacity-0"
    >
      <option value="">Toàn quốc</option>
      {CITIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  )
}

function CityPicker({ value }: { value: string | null }) {
  return (
    <label className="relative inline-flex min-h-10 items-center gap-1 rounded-full border border-line bg-surface px-3 text-meta font-semibold text-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
      <MapPin className="size-4 text-accent" aria-hidden />
      <span className="max-w-[84px] truncate">{value ?? "Toàn quốc"}</span>
      <ChevronDown className="size-3.5 text-muted" aria-hidden />
      <CitySelect value={value} />
    </label>
  )
}
