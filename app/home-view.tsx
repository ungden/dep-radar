"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Leaf, RotateCcw, User, X } from "lucide-react"
import { bookingImage } from "@/components/booking-card"
import { DataUnavailable } from "@/components/data-unavailable"
import { MobileLinks } from "@/components/mobile-links"
import { CatalogTile, CategoryBubble, CitySelect, IllustrationBadge, ServiceTile, notYetOffered } from "@/components/shop"
import { DEMO_DATA_LIVE, isSpa } from "@/lib/launch"
import { SPA, SPA_RING_INDEX, SPA_TINT, spaPhoto } from "@/lib/spa"
import { CATEGORIES } from "@/lib/catalog"
import { categoryPhoto } from "@/lib/design/photos"
import { priorityFirst } from "@/lib/discovery"
import { categoryRow, serviceOffers } from "@/lib/offers"
import { getPro, useApp } from "@/lib/store"
import type { Booking, CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"

const DEMO_KEY = "dep360_demo_notice"
const SERVICES_FIRST = 8
/** Categories a wide screen shows beside the headline; a phone swipes through all of them. */
const RAIL_WIDE = 5
const BOOK_PHOTO = { category: "nail", index: 1 } as const

/**
 * The home page asks one question, how the customer wants to book: choose a
 * service and let an Artist take the order, or choose the Artist. Under it, the
 * services themselves with real prices: what people offer here first, then the
 * rest of the catalogue, which can still be requested. As the app's Khám phá
 * (apps/mobile/src/app/(tabs)/index.tsx). Browsing never asks for a sign-in.
 */
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
  const offered = offers.slice(0, SERVICES_FIRST)
  const rest = notYetOffered(offers, CATEGORIES, studioBookingOpen, SERVICES_FIRST - offered.length)

  // Makeup and Nail lead, then whatever is on offer here.
  const rail = priorityFirst(categoryRow(CATEGORIES, offers, "all", CATEGORIES.length + 1).ordered)
  const worksHere = state.works.filter((w) => w.images[0] && (!city || getPro(state, w.proId)?.city === city))
  const photoOf = (c: CategoryId) => worksHere.find((w) => w.category === c)?.images[0] ?? categoryPhoto(c)
  // A picture under "Artist" must not be an illustration: real work, or just the icon.
  const realWork = worksHere[0]?.images[0]

  // Illustrations take turns within a category, so two tiles never share one,
  // and pass over the one on the "Đặt theo dịch vụ" card.
  const turns = new Map<CategoryId, number>()
  const nextTurn = (c: CategoryId) => {
    const n = turns.get(c) ?? 0
    turns.set(c, n + 1)
    return c === BOOK_PHOTO.category && n >= BOOK_PHOTO.index ? n + 1 : n
  }

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
              {spas.length && i === SPA_RING_INDEX ? <SpaBubble photo={worksHere.find((w) => spas.some((s) => s.id === w.proId))?.images[0] ?? spaPhoto(0)} /> : null}
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

      <Rebook />

      <section aria-labelledby="dat-the-nao" className="mt-8 md:mt-11">
        <h2 id="dat-the-nao" className="text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">Bạn muốn đặt thế nào?</h2>
        <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-2 md:gap-6">
          <WayToBook
            href="/dat-lich"
            title="Đặt theo dịch vụ"
            text="Chọn dịch vụ và giờ, Artist rảnh sẽ nhận đơn."
            action="Đặt ngay"
            primary
            picture={
              <>
                <Image src={categoryPhoto(BOOK_PHOTO.category, BOOK_PHOTO.index)} alt="" fill priority sizes="(min-width: 768px) 280px, 40vw" className="object-cover" />
                <IllustrationBadge className="left-2.5 top-2.5" />
              </>
            }
          />
          <WayToBook
            href="/pros"
            title="Tự chọn Artist"
            text="Xem tác phẩm và giá, chọn người bạn thích."
            action="Xem Artist"
            picture={
              realWork ? (
                <Image src={realWork} alt="" fill sizes="(min-width: 768px) 280px, 40vw" className="object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center bg-accent-soft text-accent">
                  <User className="size-14 stroke-[1.5]" aria-hidden />
                </span>
              )
            }
          />
        </div>
      </section>

      <section aria-labelledby="dich-vu" className="mt-9 md:mt-14">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="dich-vu" className="text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">Dịch vụ</h2>
            {/* On a phone the bar on top has this. */}
            <CitySelect value={city} variant="chip" className="hidden md:inline-flex" />
          </div>
          <Link href="/search" className="inline-flex min-h-11 shrink-0 items-center text-meta font-semibold text-accent-dark hover:underline md:text-[16px]">
            Xem tất cả
          </Link>
        </div>
        {state.catalogError ? (
          <DataUnavailable />
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
            {offered.map((o, i) => (
              <ServiceTile key={o.template.id} offer={o} index={o.photo ? 0 : nextTurn(o.template.category)} priority={i < 4} />
            ))}
            {rest.map((t, i) => (
              <CatalogTile key={t.id} template={t} index={nextTurn(t.category)} priority={offered.length + i < 4} />
            ))}
          </div>
        )}
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

/** One of the two ways to book: a picture beside what it means and one button. The whole card is the link. */
function WayToBook({ href, title, text, action, primary, picture }: { href: string; title: string; text: string; action: string; primary?: boolean; picture: React.ReactNode }) {
  return (
    <Link href={href} className="group flex min-h-[176px] overflow-hidden rounded-[var(--radius-xl)] bg-surface transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] md:min-h-[256px]">
      <span className="relative w-[40%] shrink-0 bg-subtle md:w-[45%]">{picture}</span>
      <span className="flex min-w-0 flex-1 flex-col items-start p-4 md:px-7 md:py-6">
        <span className="block text-[20px] font-bold leading-tight tracking-[-0.02em] md:text-[26px]">{title}</span>
        <span className="mt-1.5 block text-meta leading-[1.4] text-ink-soft md:mt-2 md:text-body">{text}</span>
        <span
          className={cn(
            "mt-auto inline-flex h-11 items-center rounded-full px-[18px] text-meta font-bold transition-colors",
            primary ? "bg-accent text-white group-hover:bg-accent-dark" : "bg-accent-soft text-accent-dark group-hover:bg-[#F8DCE6]",
          )}
        >
          {action}
        </span>
      </span>
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
              <Link href={`/book/${b.proId}?service=${b.templateId}&variant=${b.variantId}`} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface p-3 hover:shadow-[var(--shadow-soft)]">
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
