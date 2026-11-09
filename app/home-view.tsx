"use client"

import { requestCopy } from "@/lib/request-copy"
import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Leaf, RotateCcw, X } from "lucide-react"
import { bookingImage } from "@/components/booking-card"
import { DataUnavailable } from "@/components/data-unavailable"
import { MobileLinks } from "@/components/mobile-links"
import { CategoryBubble } from "@/components/shop"
import { DEMO_DATA_LIVE, isSpa } from "@/lib/launch"
import { SPA, SPA_RING_INDEX, SPA_TINT, spaPhoto } from "@/lib/spa"
import { CATEGORIES } from "@/lib/catalog"
import { categoryPhoto } from "@/lib/design/photos"
import { priorityFirst } from "@/lib/discovery"
import { categoryRow, serviceOffers } from "@/lib/offers"
import { getPro, useApp } from "@/lib/store"
import type { Booking, CategoryId } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"
import { REQUEST_GOALS } from "@/lib/request-goals"
import { rebookCart } from "@/lib/service-cart"
import { editorialTemplates, marketplaceFeed } from "@/lib/marketplace-feed"

const DEMO_KEY = "dep360_demo_notice"
/** Categories a wide screen shows beside the headline; a phone swipes through all of them. */
const RAIL_WIDE = 5

export function HomeView() {
  const state = useApp()
  const { city } = state
  const studioBookingOpen = state.platform?.studioBookingOpen

  // Spas have their own page (/spa); the services here are the Artists'.
  const artists = React.useMemo(() => state.pros.filter((p) => !isSpa(p)), [state.pros])
  const spas = state.pros.filter((p) => isSpa(p) && p.published && p.acceptingJobs && (!city || p.city === city))
  const offers = React.useMemo(
    () => serviceOffers({ studioBookingOpen, pros: artists, proServices: state.proServices, works: state.works, city, vertical: "all" }),
    [artists, state.proServices, state.works, city, studioBookingOpen],
  )
  const rail = priorityFirst(categoryRow(CATEGORIES, offers, "all", CATEGORIES.length + 1).ordered)
  const [following, setFollowing] = React.useState(false)
  const [limit, setLimit] = React.useState(8)
  const feed = React.useMemo(() => marketplaceFeed({
    pros: artists, services: state.proServices, works: state.works, city, studioOpen: studioBookingOpen, following: following ? new Set(state.followedPros) : undefined,
  }), [artists, state.proServices, state.works, city, studioBookingOpen, following, state.followedPros])
  const editorial = following ? [] : editorialTemplates(new Set(feed.map((entry) => entry.template.id)), studioBookingOpen).slice(0, Math.max(0, 4 - feed.length))
  const photoOf = (c: CategoryId) => feed.find((item) => item.template.category === c && item.photo)?.photo ?? categoryPhoto(c)
  return (
    <div className="roomy pt-5 md:pt-10">
      {DEMO_DATA_LIVE && <DemoNotice />}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <h1 className="text-[32px] font-bold leading-[1.14] tracking-[-0.03em] md:text-[46px]">
          Làm đẹp tại nhà, <br />
          đúng giờ, giá rõ
        </h1>
        <nav aria-label="Danh mục" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:gap-2.5 md:px-0">
          {rail.map((c, i) => (
            <React.Fragment key={c.id}>
              {spas.length && i === SPA_RING_INDEX ? <SpaBubble photo={state.works.find((w) => spas.some((s) => s.id === w.proId))?.images[0] ?? spaPhoto(0)} /> : null}
              <CategoryBubble category={c} photo={photoOf(c.id)} href={`/search?category=${c.id}`} className={cn(i >= (spas.length ? RAIL_WIDE - 1 : RAIL_WIDE) && "lg:hidden")} />
            </React.Fragment>
          ))}
          <Link href="/search" className="group flex w-[84px] shrink-0 flex-col items-center gap-2 md:w-[100px]">
            <span className="block p-[5px]">
              <span className="flex size-[66px] items-center justify-center rounded-full bg-accent text-[15px] font-bold text-white transition-transform duration-200 group-hover:-translate-y-0.5 md:size-[80px]">Tất cả</span>
            </span>
            <span className="sr-only">Xem tất cả dịch vụ</span>
          </Link>
        </nav>
      </div>

      <section aria-label={requestCopy.vi.title} className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent-soft px-4 py-2">
        <Link href="/dat-lich" className="inline-flex min-h-11 items-center gap-2">
          <span><strong className="block text-accent-dark">{requestCopy.vi.title}</strong><span className="block text-meta text-ink-soft">{requestCopy.vi.summary}</span></span>
          <ChevronRight className="size-4 text-accent-dark" aria-hidden />
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {REQUEST_GOALS.map((g) => <Link key={g.templateId} href={`/dat-lich?service=${g.templateId}&variant=${g.variantId}`} className="inline-flex min-h-11 items-center rounded-full bg-surface px-3 text-meta font-semibold text-accent-dark">{g.label}</Link>)}
        </div>
      </section>
      <section aria-labelledby="danh-cho-ban" className="mt-6 md:mt-9">
        <div className="flex items-center justify-between gap-3">
          <h2 id="danh-cho-ban" className="sr-only">Khám phá tác phẩm</h2>
          <div className="flex gap-4" aria-label="Nguồn tác phẩm">
            <button type="button" aria-pressed={!following} onClick={() => { setFollowing(false); setLimit(8) }} className="min-h-11 font-bold aria-pressed:text-accent-dark">Dành cho bạn</button>
            <button type="button" aria-pressed={following} onClick={() => { setFollowing(true); setLimit(8) }} className="min-h-11 font-bold aria-pressed:text-accent-dark">Theo dõi</button>
          </div>
          <Link href="/search" className="inline-flex min-h-11 items-center text-meta font-semibold text-accent-dark">Xem tất cả</Link>
        </div>
        {state.catalogError ? <DataUnavailable /> : feed.length || editorial.length ? (
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 md:gap-6 lg:grid-cols-4">
            {feed.slice(0, limit).map(({ id, pro, work, template, option, photo }, i) => {
              const href = work ? `/works/${work.id}?variant=${option.variant.id}` : `/pros/${pro.id}?service=${template.id}&variant=${option.variant.id}&tab=services`
              return <Link key={id} href={href} className="group min-w-0 rounded-[var(--radius-md)]">
                <span className="relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-accent-soft">
                  {photo ? <Image src={photo} alt="" fill priority={i < 4} sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                    : <span aria-hidden className="grid size-14 place-items-center rounded-full bg-surface font-bold text-accent-dark">{pro.name.slice(0, 1)}</span>}
                </span>
                <span className="mt-2 block truncate text-meta font-bold">{pro.name}</span>
                <span className="block font-semibold group-hover:underline">{template.name}</span>
                <span className="block text-meta text-ink-soft"><strong className="text-accent-dark">{formatPrice(option.minimumTotal)}</strong> · {formatDuration(option.durationMin)}</span>
                <span className="block text-meta text-muted">{!pro.acceptingJobs ? "Tạm nghỉ nhận lịch" : pro.homeService && !template.studioOnly ? "Tại nhà" : "Tại cơ sở"}{option.minimumQuantity > 1 ? ` · từ ${option.minimumQuantity} người` : ""}</span>
              </Link>
            })}
            {editorial.map((template) => <Link key={template.id} href={`/dich-vu/${template.id}`} className="group min-w-0">
              <span className="relative block aspect-[5/4] overflow-hidden rounded-[var(--radius-md)] bg-accent-soft">
                <Image src={categoryPhoto(template.category, template.id === "makeup-bridal" ? 1 : template.id === "makeup-daily" ? 2 : 0)} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                <span className="absolute bottom-2 left-2 rounded bg-surface px-2 py-1 text-label">Ảnh minh hoạ</span>
              </span>
              <span className="mt-2 block font-semibold group-hover:underline">{template.name}</span>
              <span className="block text-meta text-ink-soft">Gợi ý dịch vụ</span>
              <span className="block text-meta font-bold text-accent-dark">Xem gói và gửi nhu cầu</span>
            </Link>)}
          </div>
        ) : <p className="mt-3 text-ink-soft">{following ? "Chưa có tác phẩm từ chuyên viên bạn theo dõi." : "Chưa có dịch vụ tại khu vực này. Bạn có thể xem danh mục hoặc gửi nhu cầu."}</p>}
        {feed.length > limit && <button type="button" className="mt-4 min-h-11 font-semibold text-accent-dark" onClick={() => setLimit((n) => n + 12)}>Xem thêm tác phẩm</button>}
      </section>
      {spas.length ? (
        <Link href="/spa" className="mt-8 flex items-center gap-4 rounded-[var(--radius-lg)] bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-raised)] md:mt-10 md:p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)]" style={{ background: SPA_TINT.bg, color: SPA_TINT.fg }}>
            <Leaf className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{SPA.row}</span>
            <span className="block truncate text-meta text-ink-soft">{SPA.rowText}</span>
          </span>
          <ChevronRight className="size-5 text-muted" aria-hidden />
        </Link>
      ) : null}

      <Rebook />
      <div className="mt-7 flex flex-wrap gap-5 text-meta font-semibold text-accent-dark">
        <Link href="/dat-lich" className="inline-flex min-h-11 items-center">Gửi nhu cầu</Link>
        <Link href="/pros" className="inline-flex min-h-11 items-center">Xem chuyên viên</Link>
      </div>
      {/* The footer is desktop-only; on a phone these are the links it would have given. */}
      <MobileLinks className="mt-10" />
    </div>
  )
}

/** The Spa ring: not a category, the way to the spas (/spa). */
function SpaBubble({ photo }: { photo: string }) {
  return (
    <Link href="/spa" className="group flex w-[84px] shrink-0 flex-col items-center gap-2 md:w-[100px]">
      <span className="block rounded-full border-2 p-[3px] transition-transform duration-200 group-hover:-translate-y-0.5" style={{ borderColor: SPA_TINT.fg }}>
        <span className="relative block size-[66px] overflow-hidden rounded-full md:size-[80px]" style={{ background: SPA_TINT.bg }}>
          <Image src={photo} alt="" fill sizes="160px" className="object-cover" />
        </span>
      </span>
      <span className="block text-center text-meta font-medium leading-[20px] text-ink md:text-[16px]">{SPA.ring}</span>
    </Link>
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
    <section className="mt-8 md:mt-11">
      <h2 className="mb-3 text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">Đặt lại</h2>
      <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0">
        {list.map((b) => {
          const image = bookingImage(state, b)
          return (
            <li key={b.id} className="w-[260px] shrink-0 md:w-auto">
              <Link href={`/book/${b.proId}?cart=${encodeURIComponent(rebookCart(b))}`} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface p-3 hover:shadow-[var(--shadow-soft)]">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-subtle">
                  {image && <Image src={image} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold">{b.serviceName}</span>
                  <span className="block truncate text-meta text-ink-soft">{b.proName}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-meta font-semibold text-accent-dark">
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
    <p className="mb-5 flex items-center gap-2 rounded-full bg-highlight-soft py-1 pl-3.5 pr-1 text-meta text-ink md:mb-6 md:w-fit md:max-w-full">
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
