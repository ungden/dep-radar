"use client"

import * as React from "react"
import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Bell, ChevronDown, MapPin, MessageCircle, Search, X } from "lucide-react"
import { CategoryBubbles, PostCard, ProCard, ProTile, VerticalSwitch } from "@/components/beauty"
import { CastingStrip } from "@/components/casting"
import { InterestPicker } from "@/components/interest-picker"
import { Avatar, ButtonLink, LogoMark, PageSkeleton, Tabs } from "@/components/ui"
import { VerifiedMark } from "@/components/trust"
import { getVertical, isVertical, verticalOf as verticalOfCategory } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { interestsFrom, rankFeed, supplyIsThin, type FeedTab, type VerticalFilter } from "@/lib/feed"
import { CITIES } from "@/lib/geo"
import { occasionsFor, occasionTemplates, suggestionsFor, type Occasion } from "@/lib/occasions"
import { distanceToCustomer, getPro, useApp, type AppState } from "@/lib/store"
import { rankScore } from "@/lib/trust"
import type { CategoryId, Pro, Work } from "@/lib/types"
import { cn } from "@/lib/utils"

const PAGE = 24
/** A module (people, casting calls, reviews) is slotted in after every this many posts. */
const MODULE_EVERY = 10
const DEMO_KEY = "dep360_demo_notice"

export default function ExplorePage() {
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

  const [tab, setTab] = React.useState<FeedTab>("for-you")
  // How far the feed is shown resets whenever what it shows changes.
  const scope = `${tab}|${vertical}|${city}`
  const [shown, setShown] = React.useState({ scope, count: PAGE })
  const limit = shown.scope === scope ? shown.count : PAGE
  const showMore = React.useCallback(() => setShown({ scope, count: limit + PAGE }), [scope, limit])
  // Rendered on the server and in the browser: fixing "now" once keeps both in step.
  const [now] = React.useState(() => new Date())

  const inCity = React.useCallback((proId: string) => !city || getPro(state, proId)?.city === city, [state, city])

  const feed = React.useMemo(() => {
    const works = state.works.filter((w) => inCity(w.proId))
    const interests = interestsFrom({
      chosen: state.interests,
      booked: state.bookings.filter((b) => b.mine).map((b) => b.category),
      saved: state.savedWorks
        .map((slug) => state.works.find((w) => w.id === slug)?.category)
        .filter((c): c is CategoryId => Boolean(c)),
    })
    return rankFeed(works, state.pros, {
      vertical,
      interests,
      followed: new Set(state.followedPros),
      distanceKm: (proId) => (session?.role === "pro" ? null : distanceToCustomer(state, proId)),
      stats: state.workStats,
      now,
    }, tab)
  }, [state, inCity, vertical, tab, session, now])

  const people = React.useMemo(() => {
    const list = state.pros.filter(
      (p) => p.published && (!city || p.city === city) && (vertical === "all" || p.categories.some((c) => verticalOfCategory(c) === vertical)),
    )
    const km = (p: Pro) => distanceToCustomer(state, p.id)
    return list
      .filter((p) => p.acceptingJobs)
      .sort((a, b) => {
        const da = km(a)
        const db = km(b)
        if (da !== null && db !== null && Math.abs(da - db) > 1) return da - db
        return rankScore(b) - rankScore(a)
      })
  }, [state, city, vertical])

  const worksInScope = feed.length
  const thin = supplyIsThin(people.length, worksInScope)
  const hasAddress = Boolean(state.customerAddress)
  const place = city ? `ở ${city}` : "gần bạn"

  return (
    <div className="pt-1 md:pt-8">
      <TopBar />
      <Hero feed={feed} />

      <SearchBox className="mt-3 md:hidden" />
      <Suggestions now={now} className="mt-3 md:hidden" />

      {/* Sticky under the mobile top bar, so the trade is always one tap away. */}
      <div className="sticky top-0 z-30 -mx-4 mt-4 bg-canvas/95 px-4 py-2.5 backdrop-blur md:top-16 md:mx-0 md:mt-8 md:px-0">
        <VerticalSwitch value={vertical} onChange={setVertical} />
      </div>

      <DemoNotice />

      <CategoryBubbles vertical={vertical} className="mt-4" />

      <Occasions now={now} vertical={vertical} />

      {session && state.interests.length === 0 && !state.bookings.some((b) => b.mine) && (
        <InterestPicker className="mt-8" />
      )}

      {thin ? (
        <section className="mt-10">
          <SectionTitle
            title={people.length ? `Đang nhận lịch ${hasAddress ? "gần bạn" : place}` : "Chưa có ai ở khu vực này"}
            href={people.length ? `/pros${vertical !== "all" ? `?nganh=${vertical}` : ""}` : undefined}
          />
          {people.length === 0 ? (
            <EmptySupply vertical={vertical} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {people.slice(0, 3).map((p) => (
                <ProCard key={p.id} pro={p} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-10">
          <SectionTitle title={`Đang nhận lịch ${hasAddress ? "gần bạn" : place}`} href="/pros" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0 xl:grid-cols-4">
            {people.slice(0, 8).map((p) => (
              <ProTile key={p.id} pro={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="sr-only">Tác phẩm</h2>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "for-you", label: "Dành cho bạn" },
            { value: "latest", label: "Mới nhất" },
            ...(session ? [{ value: "following" as const, label: "Đang theo dõi" }] : []),
          ]}
        />
        {tab === "for-you" && (
          <p className="mt-3 text-[13px] text-muted">
            {state.interests.length || state.bookings.some((b) => b.mine) || state.savedWorks.length
              ? "Xếp theo dịch vụ bạn quan tâm, khoảng cách và đánh giá thật."
              : "Xếp theo khoảng cách, đánh giá thật và độ mới. Không ai trả tiền để lên đầu."}
          </p>
        )}
        {tab === "latest" && <p className="mt-3 text-[13px] text-muted">Đúng thứ tự đăng, mới nhất trước.</p>}

        {feed.length === 0 ? (
          <FeedEmpty tab={tab} vertical={vertical} />
        ) : (
          <FeedGrid works={feed.slice(0, limit)} state={state} />
        )}

        {feed.length > limit && (
          <LoadMore onMore={showMore} />
        )}
      </section>

      <section className="mt-14 flex flex-col gap-3 rounded-[var(--radius-xl)] bg-subtle p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-[20px] font-extrabold tracking-tight">Chưa thấy mẫu ưng ý?</p>
          <p className="mt-1 text-[15px] text-ink-soft">Đăng yêu cầu, người làm gần bạn gửi báo giá. Bạn chọn, không mất phí.</p>
        </div>
        <ButtonLink href="/requests/new" size="lg" className="shrink-0">
          Đăng yêu cầu
        </ButtonLink>
      </section>

      {session?.role !== "pro" && (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] bg-ink p-6 text-white md:flex md:items-center md:justify-between md:p-10">
          <div className="max-w-xl">
            <p className="text-[24px] font-extrabold leading-tight tracking-tight md:text-[32px]">Bạn làm nail, makeup, chụp ảnh hay làm mẫu?</p>
            <p className="mt-2 text-[15px] text-white/75">
              Nhận khách gần nhà, tự đặt giá trong khung chuẩn, không phí đăng ký. 360dep chỉ thu hoa hồng khi bạn hoàn thành lịch hẹn.
            </p>
          </div>
          <Link
            href={session ? (session.proId ? "/studio" : "/studio/onboarding") : "/login?role=pro"}
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink md:mt-0"
          >
            Bắt đầu nhận khách <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </div>
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
        <LogoMark size={30} />
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
                <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-accent px-1 text-center text-[11px] font-bold leading-[18px] text-white">
                  {state.unreadNotifications > 9 ? "9+" : state.unreadNotifications}
                </span>
              )}
            </Link>
          </>
        ) : (
          <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[13px] font-semibold text-white">
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  )
}

function Hero({ feed }: { feed: Work[] }) {
  const state = useApp()
  const photos = feed.filter((w) => w.images[0]).slice(0, 5)
  return (
    <div className="hidden md:grid md:grid-cols-[1.1fr_1fr] md:items-center md:gap-10">
      <div>
        <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-[-0.03em] xl:text-[52px]">
          Lên hình đẹp,
          <br />
          theo cách của bạn.
        </h1>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-soft">
          Đặt thợ làm đẹp, người chụp ảnh và người mẫu gần bạn. Xem tác phẩm thật, giá rõ trước khi đặt.
        </p>
        <SearchBox className="mt-6 max-w-xl" large />
        <Suggestions now={new Date()} className="mt-3" />
      </div>
      <div className="grid h-[340px] grid-cols-3 gap-2.5">
        {photos.map((w, i) => {
          const pro = getPro(state, w.proId)
          return (
            <Link
              key={w.id}
              href={`/works/${w.id}`}
              className={cn(
                "group relative overflow-hidden rounded-[var(--radius-lg)] bg-subtle",
                i === 0 && "row-span-2",
                i === 3 && "col-start-3 row-start-1",
              )}
            >
              <Image src={w.images[0]} alt={w.title} fill priority={i < 2} sizes="220px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              {pro && i === 0 && (
                <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 py-1 pl-1 pr-2.5 text-xs font-semibold backdrop-blur">
                  <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={20} />
                  {pro.name}
                  <VerifiedMark pro={pro} className="size-3.5" />
                </span>
              )}
            </Link>
          )
        })}
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
          "w-full rounded-full border border-line bg-surface pl-12 pr-4 text-[16px] shadow-[var(--shadow-soft)] placeholder:text-muted focus:border-ink focus:outline-none",
          large ? "h-14" : "h-12",
        )}
      />
    </form>
  )
}

function Suggestions({ now, className }: { now: Date; className?: string }) {
  const items = suggestionsFor(now)
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0", className)}>
      {items.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className="inline-flex h-9 shrink-0 items-center rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-ink hover:border-ink/30"
        >
          {s.label}
        </Link>
      ))}
    </div>
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

function Occasions({ now, vertical }: { now: Date; vertical: VerticalFilter }) {
  const state = useApp()
  const list = occasionsFor(now)
    .filter((o) => vertical === "all" || occasionTemplates(o).some((t) => verticalOfCategory(t.category) === vertical))
    .slice(0, 8)
  // One real photo per occasion, and not the same photo twice in the row:
  // the exact services first, then anything in the same categories.
  const used = new Set<string>()
  const covers = list.map((o) => {
    const templates = new Set(o.templates)
    const categories = new Set(occasionTemplates(o).map((t) => t.category))
    const candidates = [
      ...state.works.filter((w) => templates.has(w.templateId)),
      ...state.works.filter((w) => !templates.has(w.templateId) && categories.has(w.category)),
    ]
      .map((w) => w.images[0])
      .filter(Boolean)
    const pick = candidates.find((src) => !used.has(src))
    if (pick) used.add(pick)
    return pick
  })
  if (!list.length) return null
  return (
    <section className="mt-10">
      <SectionTitle title="Theo dịp" />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0 xl:grid-cols-8">
        {list.map((o, i) => (
          <OccasionCard key={o.id} occasion={o} photo={covers[i]} />
        ))}
      </div>
    </section>
  )
}

function OccasionCard({ occasion, photo }: { occasion: Occasion; photo?: string }) {
  const trades = [...new Set(occasionTemplates(occasion).map((t) => verticalOfCategory(t.category)))]
  return (
    <Link href={`/dip/${occasion.id}`} className="group block w-[150px] shrink-0 md:w-auto">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-subtle">
        {photo ? (
          <Image src={photo} alt="" fill sizes="(min-width: 1280px) 140px, (min-width: 768px) 25vw, 150px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0 flex items-end bg-gradient-to-br from-subtle to-subtle-strong p-3">
            <span className="text-[20px] font-extrabold leading-tight tracking-tight text-ink/70">{occasion.title}</span>
          </div>
        )}
        <span className="absolute bottom-2 left-2 flex gap-1" aria-hidden>
          {trades.map((t) => (
            <span
              key={t}
              className={cn(
                "size-2.5 rounded-full ring-2 ring-white",
                t === "beauty" && "bg-beauty",
                t === "photo" && "bg-photo",
                t === "model" && "bg-model",
              )}
            />
          ))}
        </span>
      </div>
      <p className="mt-2 text-[15px] font-bold leading-snug">{occasion.title}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-soft">{occasion.subtitle}</p>
    </Link>
  )
}

function FeedGrid({ works, state }: { works: Work[]; state: AppState }) {
  const reviews = state.reviews.filter((r) => r.photo)
  const blocks: React.ReactNode[] = []
  for (let i = 0; i < works.length; i += MODULE_EVERY) {
    const chunk = works.slice(i, i + MODULE_EVERY)
    blocks.push(
      <div key={`g${i}`} className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
        {chunk.map((w, j) => (
          <PostCard key={w.id} work={w} priority={i + j < 4} />
        ))}
      </div>,
    )
    const index = i / MODULE_EVERY
    if (chunk.length === MODULE_EVERY) {
      if (index === 0 && state.castings.some((c) => c.status === "open")) blocks.push(<CastingStrip key="castings" className="mt-10" />)
      else if (index === 1 && reviews.length) blocks.push(<ReviewStrip key="reviews" state={state} />)
    }
  }
  return <>{blocks}</>
}

function ReviewStrip({ state }: { state: AppState }) {
  const list = state.reviews.filter((r) => r.photo).slice(0, 6)
  return (
    <section className="mt-10">
      <SectionTitle title="Khách chụp lại sau khi làm" />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:px-0">
        {list.map((r) => {
          const pro = getPro(state, r.proId)
          return (
            <Link key={r.id} href={pro ? `/pros/${pro.id}#danh-gia` : "#"} className="w-[240px] shrink-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-subtle">
                <Image src={r.photo!} alt="" fill sizes="240px" className="object-cover" />
              </div>
              <p className="mt-2 text-[14px] font-semibold">★ {r.rating} · {r.author}</p>
              <p className="line-clamp-2 text-[13px] text-ink-soft">{r.text}</p>
              {pro && <p className="mt-0.5 text-[13px] text-muted">cho {pro.name}</p>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function LoadMore({ onMore }: { onMore: () => void }) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && onMore(), { rootMargin: "600px" })
    io.observe(el)
    return () => io.disconnect()
  }, [onMore])
  return (
    <div className="mt-8 flex justify-center">
      <button ref={ref} type="button" onClick={onMore} className="h-11 rounded-full border border-line px-6 text-sm font-semibold hover:border-ink/30">
        Xem thêm
      </button>
    </div>
  )
}

function FeedEmpty({ tab, vertical }: { tab: FeedTab; vertical: VerticalFilter }) {
  if (tab === "following")
    return (
      <div className="py-12 text-center">
        <p className="text-[17px] font-bold">Bạn chưa theo dõi ai</p>
        <p className="mt-1.5 text-[15px] text-ink-soft">Theo dõi để thấy tác phẩm mới của họ ở đây, đúng thứ tự đăng.</p>
        <ButtonLink href="/pros" className="mt-5">
          Tìm người để theo dõi
        </ButtonLink>
      </div>
    )
  return <EmptySupply vertical={vertical} />
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
      <h2 className="text-[20px] font-extrabold tracking-tight md:text-[24px]">{title}</h2>
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
