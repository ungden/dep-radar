"use client"

import * as React from "react"
import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bell, ChevronDown, MapPin, MessageCircle, Search, X } from "lucide-react"
import { CATEGORY_ICON, PostCard, VerticalSwitch } from "@/components/beauty"
import { CategoryTiles } from "@/components/category-icon"
import { Avatar, ButtonLink, PageSkeleton } from "@/components/ui"
import { CATEGORIES, getVertical, isVertical } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { rankFeed, type VerticalFilter } from "@/lib/feed"
import { CITIES } from "@/lib/geo"
import { serviceOffers, type ServiceOffer } from "@/lib/offers"
import { distanceToCustomer, getPro, useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

const DEMO_KEY = "dep360_demo_notice"
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
  const categories = CATEGORIES.filter((c) => offers.some((o) => o.template.category === c.id))
  const shownCategory = categories.some((c) => c.id === category) ? category : "all"
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

  return (
    <div className="pt-1 md:pt-10">
      <TopBar />

      <div className="md:max-w-2xl">
        <h1 className="hidden text-[40px] font-bold leading-[1.05] tracking-[-0.03em] md:block">
          Đặt dịch vụ, xem giá ngay.
        </h1>
        <p className="mt-3 hidden text-[17px] text-ink-soft md:block">
          Làm đẹp, chụp ảnh, người mẫu gần bạn. Giá niêm yết, người làm gọi xác nhận trước khi đến.
        </p>
        <SearchBox className="mt-3 md:mt-6" large />
      </div>

      {/* Sticky under the mobile top bar, so the trade is always one tap away. */}
      <div className="sticky top-0 z-30 -mx-4 mt-4 bg-canvas/95 px-4 py-2.5 backdrop-blur md:top-16 md:mx-0 md:mt-8 md:px-0">
        <VerticalSwitch value={vertical} onChange={(v) => { setVertical(v); setCategory("all") }} />
      </div>

      <DemoNotice />

      <section className="mt-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-[22px] font-bold tracking-tight md:text-[26px]">
            {vertical === "all" ? "Dịch vụ" : getVertical(vertical).label}
            {city ? ` ở ${city}` : ""}
          </h2>
          {shown.length > 0 && <span className="shrink-0 text-[14px] text-muted">{shown.length} dịch vụ</span>}
        </div>

        {categories.length > 1 && (
          <CategoryTiles
            className="mb-7"
            items={[{ id: "all", label: "Tất cả" }, ...categories.map((c) => ({ id: c.id, label: c.label }))]}
            value={shownCategory}
            onChange={(id) => setCategory(id as CategoryId | "all")}
          />
        )}

        {shown.length === 0 ? (
          <EmptySupply vertical={vertical} />
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
          <SectionTitle title="Tác phẩm thật từ người làm" href="/search" />
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
          <p className="mt-1 text-[15px] text-ink-soft">Đăng yêu cầu, người làm gần bạn gửi báo giá. Bạn chọn, không mất phí.</p>
        </div>
        <ButtonLink href="/requests/new" size="lg" className="shrink-0">
          Đăng yêu cầu
        </ButtonLink>
      </section>
    </div>
  )
}

/**
 * One thing for sale: the service, a real photo of it, the lowest real price
 * near the customer, and who offers it. The whole card opens the service,
 * where the customer picks a person and books.
 */
function ServiceCard({ offer, priority }: { offer: ServiceOffer; priority?: boolean }) {
  const { template, pros, fromPrice, photo } = offer
  const shortest = Math.min(...template.variants.map((v) => v.durationMin))
  const Icon = CATEGORY_ICON[template.category]
  return (
    <Link
      href={`/dich-vu/${template.id}`}
      className="group block animate-fade-up overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-raised)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-subtle">
        {photo ? (
          <Image
            src={photo}
            alt={template.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 290px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Icon className="size-12 text-accent" />
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{template.name}</p>
        <p className="mt-0.5 text-[14px]">
          <span className="text-muted">Từ </span>
          <span className="font-semibold text-accent-dark">{formatPrice(fromPrice)}</span>
          <span className="text-muted"> · {formatDuration(shortest)}</span>
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-soft">
            <span className="hidden -space-x-1.5 sm:flex">
              {pros.slice(0, 3).map((p) => (
                <Avatar key={p.id} name={p.name} tone={p.tone} src={p.avatar} size={20} className="ring-2 ring-surface" />
              ))}
            </span>
            <span className="truncate">
              {pros.length === 1 ? pros[0].name : `${pros.length} người nhận`}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors group-hover:bg-accent-dark">
            Đặt
          </span>
        </div>
      </div>
    </Link>
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
        <span className="font-display text-[24px] font-bold leading-none text-accent">360dep</span>
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
          "w-full rounded-full border border-line bg-surface pl-12 pr-4 text-[16px] shadow-[var(--shadow-soft)] placeholder:text-muted focus:border-accent focus:outline-none",
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
    <p className="mt-3 flex items-center gap-2 rounded-full bg-warning-soft py-1.5 pl-3.5 pr-1 text-[13px] text-warning">
      <span className="flex-1">
        Bản demo: nhiều hồ sơ là dữ liệu mẫu, thanh toán online chưa hoạt động.{" "}
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

function EmptySupply({ vertical }: { vertical: VerticalFilter }) {
  const label = vertical === "all" ? null : getVertical(vertical).label
  return (
    <div className="mt-5 rounded-[var(--radius-lg)] border border-dashed border-line px-6 py-10 text-center">
      <p className="text-[17px] font-bold">{label ? `${label}: chưa có ai ở khu vực này` : "Chưa có tác phẩm ở khu vực này"}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-ink-soft">
        {vertical === "photo"
          ? "Bạn chụp ảnh bằng điện thoại hoặc quay clip? Mở hồ sơ để là những người đầu tiên nhận khách ở đây."
          : vertical === "model"
            ? "Bạn làm mẫu ảnh, mẫu livestream? Xác minh danh tính rồi mở hồ sơ để nhận việc an toàn."
            : "Thử đổi khu vực, hoặc đăng yêu cầu để người làm gần bạn gửi báo giá."}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {vertical === "photo" || vertical === "model" ? (
          <ButtonLink href="/login?role=pro">Mở hồ sơ</ButtonLink>
        ) : (
          <ButtonLink href="/requests/new">Đăng yêu cầu</ButtonLink>
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
        onChange={(e) => void actions.setCity(e.target.value || null)}
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
