"use client"

import * as React from "react"
import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bell, ChevronDown, MapPin, MessageCircle, RotateCcw, Search, X } from "lucide-react"
import { bookingImage } from "@/components/booking-card"
import { PostCard, VerticalSwitch } from "@/components/beauty"
import { CategoryTiles } from "@/components/category-icon"
import { MobileLinks } from "@/components/mobile-links"
import { ServiceCard } from "@/components/service-card"
import { ButtonLink, PageSkeleton, Wordmark } from "@/components/ui"
import { DEMO_DATA_LIVE } from "@/lib/launch"
import { CATEGORIES, getVertical, isVertical } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { rankFeed, type VerticalFilter } from "@/lib/feed"
import { CITIES } from "@/lib/geo"
import { categoryRow, serviceOffers, type ServiceOffer } from "@/lib/offers"
import { distanceToCustomer, getPro, useApp } from "@/lib/store"
import type { Booking, Category, CategoryId } from "@/lib/types"
import { cn, formatPrice } from "@/lib/utils"

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
  // One row of the categories with the most on offer here; the rest (and the
  // ones nobody offers yet, marked "Sắp có") one tap away behind "Xem thêm".
  const categories = CATEGORIES.filter((c) => vertical === "all" || c.vertical === vertical)
  const shownCategory = categories.some((c) => c.id === category) ? category : "all"
  const tiles = categoryRow(categories, offers, shownCategory)
  const [allCategories, setAllCategories] = React.useState(false)
  const shownCategoryInfo = CATEGORIES.find((c) => c.id === shownCategory)
  const shown = offers.filter((o) => shownCategory === "all" || o.template.category === shownCategory)
  // The most offered first; the rest one tap away, so the first screen stays short.
  const [expanded, setExpanded] = React.useState(false)
  const visible = expanded || shownCategory !== "all" ? shown : shown.slice(0, SERVICES_FIRST)

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
    label: c.short ?? c.label,
    soon: !tiles.offered.has(c.id),
    className: allCategories || rowIds.has(c.id) ? undefined : "hidden lg:flex",
  }))

  return (
    <div className="pt-1 md:pt-6">
      <TopBar />
      {DEMO_DATA_LIVE && <DemoNotice />}

      <section className="md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:gap-10 lg:gap-14">
        <div>
          <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.02em] md:mt-0 md:text-[44px] md:leading-[1.05] md:tracking-[-0.03em]">
            Đặt dịch vụ, xem giá ngay.
          </h1>
          <p className="mt-3 hidden max-w-xl text-[17px] text-ink-soft md:block">
            Làm đẹp, chụp ảnh, người mẫu gần bạn. Giá niêm yết, người làm nhận lịch trong app rồi hai bên nhắn tin với nhau.
          </p>
          <SearchBox className="mt-3 md:hidden" large />
          <HeroSearch city={city} className="mt-7 hidden md:flex" />
          <p className="mt-4 hidden text-[14px] text-muted md:block">
            {offers.length > 0
              ? `${offers.length} dịch vụ đang nhận lịch${city ? ` ở ${city}` : ""} · trả tiền trực tiếp cho người làm sau khi xong`
              : "Chưa có dịch vụ nào ở khu vực này. Đăng yêu cầu để người làm quanh bạn nhận việc."}
          </p>
        </div>
        <HeroPhotos offers={offers} className="hidden md:grid" />
      </section>

      {/* Sticky under the mobile top bar, so the trade is always one tap away. */}
      <div className="sticky top-0 z-30 -mx-4 mt-4 bg-canvas/95 px-4 py-2.5 backdrop-blur md:top-16 md:mx-0 md:mt-10 md:px-0">
        <VerticalSwitch value={vertical} onChange={(v) => { setVertical(v); setCategory("all"); setAllCategories(false) }} />
      </div>

      <Rebook />

      <section className="mt-5">
        {categories.length > 1 && (
          <CategoryTiles
            className="mb-6 md:mb-8"
            items={tileItems}
            value={shownCategory}
            // Tapping the chosen category again goes back to everything.
            onChange={(id) => {
              setCategory(id === shownCategory ? "all" : (id as CategoryId))
              setAllCategories(false)
            }}
            more={tiles.more ? { open: allCategories, onToggle: () => setAllCategories((v) => !v), className: allCategories ? undefined : "lg:hidden" } : undefined}
          />
        )}

        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-[22px] font-bold tracking-tight md:text-[26px]">
            {shownCategoryInfo ? shownCategoryInfo.label : vertical === "all" ? "Dịch vụ" : getVertical(vertical).label}
            {city ? ` ở ${city}` : ""}
          </h2>
          {shownCategoryInfo ? (
            <button
              type="button"
              onClick={() => setCategory("all")}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-subtle pl-3 pr-2.5 text-[13px] font-semibold text-ink hover:bg-subtle-strong"
            >
              Tất cả <X className="size-3.5" aria-hidden />
            </button>
          ) : (
            shown.length > 0 && <span className="shrink-0 text-[14px] text-muted">{shown.length} dịch vụ</span>
          )}
        </div>

        {shown.length === 0 ? (
          <EmptySupply vertical={vertical} city={city} elsewhere={elsewhere} category={shownCategoryInfo} />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {visible.map((o, i) => (
              <ServiceCard key={o.template.id} offer={o} priority={i < 4} />
            ))}
          </div>
        )}
        {visible.length < shown.length && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-6 h-12 w-full rounded-full border border-line text-[15px] font-semibold hover:border-ink/30 md:w-auto md:px-8"
          >
            Xem tất cả {shown.length} dịch vụ
          </button>
        )}
      </section>

      {proof.length > 0 && (
        <section className="mt-14">
          <SectionTitle title="Tác phẩm thật từ người làm" href="/search?tab=works" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {proof.map((w) => (
              <PostCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 flex flex-col gap-3 rounded-[var(--radius-xl)] bg-subtle p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-[20px] font-bold tracking-tight">Không thấy dịch vụ bạn cần?</p>
          <p className="mt-1 text-[15px] text-ink-soft">Đăng yêu cầu với giá niêm yết, người làm gần bạn nhận việc. Không mất phí.</p>
        </div>
        <ButtonLink href="/requests/new" size="lg" className="shrink-0">
          Đăng yêu cầu
        </ButtonLink>
      </section>

      {/* The footer is desktop-only; on a phone these are the links it would have given. */}
      <MobileLinks className="mt-10" />
    </div>
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
    <section className="mt-5">
      <h2 className="mb-3 text-[17px] font-bold tracking-tight">Đặt lại</h2>
      <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0">
        {list.map((b) => {
          const image = bookingImage(state, b)
          return (
            <li key={b.id} className="w-[240px] shrink-0 md:w-auto">
              <Link
                href={`/book/${b.proId}?service=${b.templateId}&variant=${b.variantId}`}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface p-2.5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-raised)]"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-subtle">
                  {image && <Image src={image} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{b.serviceName}</span>
                  <span className="block truncate text-[13px] text-ink-soft">{b.proName}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
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
    <div className="flex h-12 items-center justify-between md:hidden">
      <CityPicker value={city} />
      <Link href="/" aria-label="360dep">
        <Wordmark size={24} />
      </Link>
      <div className="flex items-center">
        {session ? (
          <>
            <Link href="/tin-nhan" aria-label="Tin nhắn" className="inline-flex size-11 items-center justify-center">
              <MessageCircle className="size-[22px]" />
            </Link>
            <Link href="/thong-bao" aria-label="Thông báo" className="relative inline-flex size-11 items-center justify-center">
              <Bell className="size-[22px]" />
              {state.unreadNotifications > 0 && (
                <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-accent px-1 text-center text-xs font-bold leading-[18px] text-white">
                  {state.unreadNotifications > 9 ? "9+" : state.unreadNotifications}
                </span>
              )}
            </Link>
          </>
        ) : (
          <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-[13px] font-semibold text-white">
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
        "h-16 items-center rounded-full border border-line-strong bg-surface pl-2 pr-2 shadow-[var(--shadow-soft)] focus-within:border-accent",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
      }}
    >
      <label className="relative flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 hover:bg-subtle">
        <MapPin className="size-5 text-accent" aria-hidden />
        <span className="flex flex-col leading-tight">
          <span className="text-[12px] font-semibold text-muted">Khu vực</span>
          <span className="flex items-center gap-1 text-[15px] font-semibold text-ink">
            {city ?? "Toàn quốc"} <ChevronDown className="size-4 text-muted" aria-hidden />
          </span>
        </span>
        <select
          aria-label="Chọn khu vực"
          value={city ?? ""}
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
      </label>
      <span aria-hidden className="mx-1 h-8 w-px bg-line" />
      <label className="flex h-12 min-w-0 flex-1 items-center gap-3 px-3">
        <Search className="size-5 shrink-0 text-ink" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Nail, makeup, chụp ảnh…"
          aria-label="Tìm kiếm"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] placeholder:text-muted focus:outline-none"
        />
      </label>
      <button type="submit" className="inline-flex h-12 shrink-0 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-white hover:bg-accent-dark">
        Tìm
      </button>
    </form>
  )
}

/**
 * Real work next to the headline on a wide screen: three services that are on
 * sale here, each with its lowest price, so the first thing seen is what can
 * be booked and for how much.
 */
function HeroPhotos({ offers, className }: { offers: ServiceOffer[]; className?: string }) {
  const picks = offers.filter((o) => o.photo).slice(0, 3)
  if (picks.length < 3) return null
  return (
    <div className={cn("h-[380px] grid-cols-2 grid-rows-2 gap-3", className)}>
      {picks.map((o, i) => (
        <Link
          key={o.template.id}
          href={`/dich-vu/${o.template.id}`}
          className={cn(
            "group relative overflow-hidden rounded-[var(--radius-xl)] bg-subtle",
            i === 0 && "row-span-2",
          )}
        >
          <Image
            src={o.photo!}
            alt={o.template.name}
            fill
            priority={i === 0}
            sizes="(min-width: 1200px) 300px, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-x-3 bottom-3 rounded-2xl bg-surface/95 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur">
            <span className="block truncate text-[14px] font-semibold text-ink">{o.template.name}</span>
            <span className="block text-[13px] text-ink-soft">
              Từ <span className="font-semibold text-accent-dark">{formatPrice(o.fromPrice)}</span> · {o.pros.length} người nhận
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}

function SearchBox({ className, large }: { className?: string; large?: boolean }) {
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
        placeholder="Bạn muốn làm gì hôm nay?"
        aria-label="Tìm kiếm"
        className={cn(
          "w-full rounded-full border border-line-strong bg-surface pl-12 pr-4 text-[16px] shadow-[var(--shadow-soft)] placeholder:text-muted focus:border-accent focus:outline-none",
          large ? "h-14" : "h-12",
        )}
      />
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
    <p className="mb-3 flex items-center gap-2 rounded-full bg-warning-soft py-1 pl-3.5 pr-1 text-[13px] text-warning md:mb-8 md:w-fit md:max-w-full">
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
 * Nobody offers this here. What a customer can do comes first -- ask, or look
 * further afield -- and the invitation to providers is a small line under it.
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
    <div className="mt-5 rounded-[var(--radius-lg)] border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="text-[17px] font-bold">{label ? `${label}: chưa có ai nhận lịch${where}` : `Chưa có dịch vụ nào${where}`}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">
        {elsewhere > 0
          ? `Có ${elsewhere} dịch vụ ở thành phố khác. Hoặc đăng yêu cầu: người làm quanh bạn được báo, ai nhận trước sẽ làm.`
          : "Đăng yêu cầu: khi có người làm việc này quanh bạn, họ được báo và ai nhận trước sẽ làm. Không mất phí."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <ButtonLink
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
        {elsewhere > 0 && (
          <button
            type="button"
            onClick={() => void actions.setCity(null)}
            className="inline-flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-sm font-semibold hover:border-accent"
          >
            Xem cả nước
          </button>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-[20px] font-bold tracking-tight md:text-[24px]">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-[14px] font-semibold text-ink underline-offset-4 hover:underline">
          Xem tất cả
        </Link>
      )}
    </div>
  )
}

function CityPicker({ value }: { value: string | null }) {
  return (
    <label className="relative inline-flex h-11 items-center gap-1 text-[14px] font-semibold text-ink">
      <MapPin className="size-4" />
      <span>{value ?? "Toàn quốc"}</span>
      <ChevronDown className="size-4 text-muted" />
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
    </label>
  )
}
