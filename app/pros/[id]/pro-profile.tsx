"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  Camera,
  Car,
  Check,
  ChevronLeft,
  Columns2,
  Home,
  Layers,
  MapPin,
  Play,
  Ruler,
  Share2,
  Store,
  X,
} from "lucide-react"
import { whereLabel } from "@/components/beauty"
import { FollowButton } from "@/components/follow-button"
import { ServiceMenu } from "@/components/service-menu"
import { TradeDot } from "@/components/trade"
import { RatingSummaryBlock, ReviewItem, VerifiedBadge, VerifiedMark } from "@/components/trust"
import { Avatar, BottomBar, ButtonLink, Chip, EmptyState, Tabs } from "@/components/ui"
import { categoryLabel, verticalOf } from "@/lib/catalog"
import { POLICY, travelFeeFor } from "@/lib/pricing"
import { distanceToCustomer, fromPrice, proView, reviewsOf, servicesOf, useApp, worksOf } from "@/lib/store"
import { personWord, tradesOf } from "@/lib/trade"
import type { ModelProfile, Pro, Work } from "@/lib/types"
import { showsAverage } from "@/lib/connection"
import { cn, formatPrice, formatResponseTime, parseISODate } from "@/lib/utils"

type Tab = "works" | "services" | "reviews" | "about"
const TABS: Tab[] = ["works", "services", "reviews", "about"]
const REVIEWS_ANCHOR = "danh-gia"

/** Chat opens with a match (lib/connection.ts), so a profile says how to get one. */
const MATCH_NOTE = (name: string) => `Đặt lịch trước. Khi ${name} nhận lịch, hai bên nhắn tin với nhau trong lịch hẹn.`

/** The URL hash, read without a hydration mismatch (the server has none). */
function useHash() {
  return React.useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange)
      return () => window.removeEventListener("hashchange", onChange)
    },
    () => window.location.hash,
    () => "",
  )
}

export function ProProfile({ proId }: { proId: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const state = useApp()
  const hash = useHash()
  const pro = proView(state, proId)!
  const works = worksOf(state, pro.id)
  const services = servicesOf(state, pro.id)
  const reviews = reviewsOf(state, pro.id)
  const from = fromPrice(state, pro.id)
  const own = state.session?.proId === pro.id

  const asked = params.get("tab") as Tab | null
  const fallback: Tab = hash === `#${REVIEWS_ANCHOR}` ? "reviews" : asked && TABS.includes(asked) ? asked : works.length ? "works" : "services"
  const [chosen, setChosen] = React.useState<Tab | null>(null)
  const tab = chosen ?? fallback
  const [withPhotos, setWithPhotos] = React.useState(false)
  const shownReviews = withPhotos ? reviews.filter((r) => r.photo) : reviews
  const tabsRef = React.useRef<HTMLDivElement>(null)

  // Arriving from a link to the price list or the reviews: go straight there.
  React.useEffect(() => {
    if (asked || hash === `#${REVIEWS_ANCHOR}`) tabsRef.current?.scrollIntoView({ block: "start" })
  }, [asked, hash])

  const openTab = (t: Tab) => {
    setChosen(t)
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const covers = works
    .map((w) => (w.kind === "before_after" && w.images[1] ? w.images[1] : w.images[0]))
    .filter(Boolean)
    .slice(0, 3)
  const back = () => (window.history.length > 1 ? router.back() : router.push("/"))

  return (
    <div className="md:pt-8">
      {/* Cover: real work, one photo on the phone, three on a computer. */}
      <div className="relative -mx-4 md:mx-0">
        <div
          className={cn(
            "grid h-44 overflow-hidden bg-subtle md:h-60 md:gap-1.5 md:rounded-[var(--radius-xl)]",
            covers.length >= 3 ? "md:grid-cols-3" : covers.length === 2 ? "md:grid-cols-2" : "grid-cols-1",
          )}
        >
          {covers.map((src, i) => (
            <div key={src + i} className={cn("relative h-full", i > 0 && "hidden md:block")}>
              <Image src={src} alt="" fill priority={i === 0} sizes="(min-width: 768px) 400px, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Quay lại"
          onClick={back}
          className="absolute left-2 top-2 inline-flex size-11 items-center justify-center md:hidden"
        >
          <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur">
            <ChevronLeft className="size-5" />
          </span>
        </button>
      </div>

      {/* Who */}
      <div className="md:px-6">
        <div className="flex items-end justify-between gap-3">
          <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={96} className="-mt-12 ring-4 ring-canvas md:hidden" />
          <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={120} className="-mt-16 hidden ring-4 ring-canvas md:block" />
          <div className="flex items-center gap-1 pb-1">
            <ShareButton name={pro.name} />
            {!own && <FollowButton proId={pro.id} />}
          </div>
        </div>

        <h1 className="mt-3 flex flex-wrap items-center gap-x-2 text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">
          {pro.name}
          <VerifiedMark pro={pro} className="size-6" />
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            {tradesOf(pro.categories).map((v) => (
              <TradeDot key={v} vertical={v} />
            ))}
            {pro.title || pro.categories.map(categoryLabel).join(" · ")}
          </span>
          <span aria-hidden className="text-subtle-strong">•</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4 text-muted" />
            {whereLabel(state, pro)}
            {whereLabel(state, pro) === pro.district ? `, ${pro.city}` : ""}
          </span>
        </p>
        <VerifiedBadge pro={pro} className="mt-3" />

        {/* On a phone the booking facts sit under the name, where the
            computer's side card would be: open or not, from what price, how far
            they travel and what that costs. */}
        {!own && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-line bg-surface p-4 md:hidden">
            <p className="flex flex-wrap items-baseline gap-x-2 text-[14px]">
              <span className={cn("font-semibold", pro.acceptingJobs ? "text-success" : "text-warning")}>
                {pro.acceptingJobs ? "Đang nhận lịch" : "Tạm nghỉ nhận lịch mới"}
              </span>
              {from !== null && (
                <>
                  <span aria-hidden className="text-muted">·</span>
                  <span className="text-ink-soft">
                    Từ <b className="text-ink">{formatPrice(from)}</b>
                  </span>
                </>
              )}
            </p>
            <WhereFacts pro={pro} className="mt-3" />
          </div>
        )}

        <Stats pro={pro} onReviews={() => openTab("reviews")} />

        {/* No messages before a booking: the way to reach them is "Đặt lịch" below. */}
        {!own && <p className="mt-4 text-[13px] text-muted md:hidden">{MATCH_NOTE(pro.name)}</p>}
      </div>

      <div className="mt-6 md:mt-10 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-10 lg:gap-14">
        <div ref={tabsRef} className="scroll-mt-2 md:scroll-mt-20">
          {/* No counts in the labels: the four have to fit a phone, and the numbers are just above. */}
          <Tabs
            className="gap-5 md:gap-7"
            value={tab}
            onChange={setChosen}
            items={[
              { value: "works", label: "Tác phẩm" },
              { value: "services", label: "Bảng giá" },
              { value: "reviews", label: "Đánh giá" },
              { value: "about", label: "Giới thiệu" },
            ]}
          />

          <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {tab === "works" &&
              (works.length ? (
                <WorkGrid works={works} />
              ) : (
                <EmptyState title="Chưa có tác phẩm" text={`${pro.name} chưa đăng tác phẩm nào.`} />
              ))}

            {tab === "services" && <ServiceMenu proId={pro.id} bookable={!own} />}

            {tab === "reviews" && (
              <div id={REVIEWS_ANCHOR} className="mt-5 scroll-mt-24">
                {pro.rating.count > 0 && (
                  <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                    <RatingSummaryBlock rating={pro.rating} />
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <p className="flex-1 text-[13px] text-muted">Chỉ khách đã hoàn thành lịch hẹn qua 360dep mới đánh giá được.</p>
                  {reviews.some((r) => r.photo) && (
                    <Chip active={withPhotos} onClick={() => setWithPhotos((v) => !v)}>
                      Có ảnh
                    </Chip>
                  )}
                </div>
                {shownReviews.length ? (
                  <ul className="mt-2 divide-y divide-line">
                    {shownReviews.map((r) => (
                      <ReviewItem key={r.id} review={r} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title={withPhotos ? "Chưa có đánh giá kèm ảnh" : "Chưa có đánh giá"} />
                )}
              </div>
            )}

            {tab === "about" && <About pro={pro} />}
          </div>
        </div>

        {/* A computer has the room: the booking card stays in view while you browse. */}
        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
            {own ? (
              <>
                <p className="text-[17px] font-bold">Đây là hồ sơ của bạn</p>
                <p className="mt-1 text-[15px] text-ink-soft">Khách thấy trang này khi tìm {personWord(pro.categories)}.</p>
                <ButtonLink href="/studio/profile" variant="outline" className="mt-4 w-full">
                  Sửa hồ sơ
                </ButtonLink>
              </>
            ) : (
              <>
                {from !== null ? (
                  <p className="text-[14px] text-muted">
                    Từ <span className="text-[24px] font-bold tracking-tight text-ink">{formatPrice(from)}</span>
                  </p>
                ) : (
                  <p className="text-[15px] font-semibold">Chưa có bảng giá</p>
                )}
                <p className={cn("mt-1 text-[14px] font-semibold", pro.acceptingJobs ? "text-success" : "text-warning")}>
                  {pro.acceptingJobs ? "Đang nhận lịch" : "Tạm nghỉ nhận lịch mới"}
                </p>
                <WhereFacts pro={pro} className="mt-4" />
                <BookButton pro={pro} disabled={!services.length} className="mt-5 w-full" />
                <p className="mt-2 text-[13px] text-muted">{MATCH_NOTE(pro.name)}</p>
                {services.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openTab("services")}
                    className="mt-2 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-4 hover:underline"
                  >
                    Xem bảng giá ({services.length} dịch vụ)
                  </button>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Phone: the price and the booking button stay in reach while browsing. */}
      {!own && (
        <BottomBar className="md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {from !== null ? (
                <p className="text-[13px] text-muted">
                  Từ <span className="text-[17px] font-bold text-ink">{formatPrice(from)}</span>
                </p>
              ) : (
                <p className="text-[14px] font-semibold">Chưa có bảng giá</p>
              )}
              <p className={cn("text-[13px] font-medium", pro.acceptingJobs ? "text-success" : "text-warning")}>
                {pro.acceptingJobs ? "Đang nhận lịch" : "Tạm nghỉ nhận lịch"}
              </p>
            </div>
            <BookButton pro={pro} disabled={!services.length} size="lg" className="shrink-0 px-8" />
          </div>
        </BottomBar>
      )}
    </div>
  )
}

function BookButton({ pro, disabled, size, className }: { pro: Pro; disabled?: boolean; size?: "md" | "lg"; className?: string }) {
  if (disabled)
    return (
      <span
        aria-disabled
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-subtle px-5 text-sm font-semibold text-muted",
          size === "lg" ? "h-13" : "h-11",
          className,
        )}
      >
        Chưa nhận đặt
      </span>
    )
  return (
    <ButtonLink href={`/book/${pro.id}`} size={size} className={className}>
      Đặt lịch
    </ButtonLink>
  )
}

/** Three numbers, each shown only when there is something real behind it. */
function Stats({ pro, onReviews }: { pro: Pro; onReviews: () => void }) {
  const response = formatResponseTime(pro.stats.responseMinutes)
  const items: React.ReactNode[] = []
  if (pro.stats.completedJobs > 0)
    items.push(
      <li key="jobs">
        <p className="text-[20px] font-bold tracking-tight">{pro.stats.completedJobs.toLocaleString("vi-VN")}</p>
        <p className="text-[13px] text-ink-soft">lịch đã làm</p>
      </li>,
    )
  if (pro.rating.count > 0)
    items.push(
      <li key="rating">
        <button type="button" onClick={onReviews} className="text-left">
          {/* An average of one or two reviews is not a number worth showing. */}
          <p className="text-[20px] font-bold tracking-tight">{showsAverage(pro.rating.count) ? `★ ${pro.rating.average.toFixed(1)}` : "Mới"}</p>
          <p className="text-[13px] text-ink-soft underline decoration-line underline-offset-2">{pro.rating.count} đánh giá</p>
        </button>
      </li>,
    )
  if (response)
    items.push(
      <li key="response">
        <p className="text-[20px] font-bold tracking-tight">{response}</p>
        <p className="text-[13px] text-ink-soft">phản hồi</p>
      </li>,
    )
  if (!items.length) return <p className="mt-4 text-[14px] text-ink-soft">Mới trên 360dep, chưa có lịch hẹn hay đánh giá nào.</p>
  return <ul className="mt-5 flex gap-8 md:gap-12">{items}</ul>
}

function WorkBadge({ work }: { work: Work }) {
  const Icon = work.video ? Play : work.kind === "before_after" ? Columns2 : work.images.length > 1 ? Layers : null
  if (!Icon) return null
  const label = work.video ? "Có clip" : work.kind === "before_after" ? "Ảnh trước và sau" : `${work.images.length} ảnh`
  return (
    <span className="absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
      <Icon className={cn("size-3.5", work.video && "fill-white")} />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Instagram-style: one tile per post, three across, nothing written on the photos. */
function WorkGrid({ works }: { works: Work[] }) {
  return (
    <ul className="-mx-4 mt-1 grid grid-cols-3 gap-0.5 md:mx-0 md:mt-5 md:gap-2">
      {works.map((w) => {
        const cover = w.kind === "before_after" && w.images[1] ? w.images[1] : w.images[0]
        return (
          <li key={w.id}>
            <Link href={`/works/${w.id}`} className="group relative block aspect-[4/5] overflow-hidden bg-subtle md:rounded-[var(--radius-md)]">
              {cover && (
                <Image
                  src={cover}
                  alt={w.title}
                  fill
                  sizes="(min-width: 1200px) 260px, (min-width: 768px) 22vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
              <WorkBadge work={w} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Where and how they work, in the trade's own words. */
function WhereFacts({ pro, className }: { pro: Pro; className?: string }) {
  const state = useApp()
  const km = state.session?.role !== "pro" ? distanceToCustomer(state, pro.id) : null
  const beauty = pro.categories.some((c) => verticalOf(c) === "beauty")
  const onlyOnLocation = !beauty && pro.categories.length > 0
  return (
    <ul className={cn("space-y-2.5 text-[14px] text-ink", className)}>
      <li className="flex items-start gap-2.5">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
        <span>
          {pro.district}, {pro.city}
          {km !== null && <span className="text-ink-soft"> · cách bạn khoảng {km.toLocaleString("vi-VN")} km</span>}
        </span>
      </li>
      {pro.homeService ? (
        <li className="flex items-start gap-2.5">
          <Home className="mt-0.5 size-4 shrink-0 text-muted" />
          {onlyOnLocation
            ? `Đến địa điểm bạn chọn, trong bán kính ${pro.maxTravelKm} km`
            : `Làm tại nhà bạn, trong bán kính ${pro.maxTravelKm} km`}
        </li>
      ) : (
        <li className="flex items-start gap-2.5">
          <Store className="mt-0.5 size-4 shrink-0 text-muted" />
          Chỉ làm tại studio
        </li>
      )}
      {pro.studioAddress && pro.homeService && (
        <li className="flex items-start gap-2.5">
          <Store className="mt-0.5 size-4 shrink-0 text-muted" />
          Có studio riêng
        </li>
      )}
      {pro.homeService && (
        <li className="flex items-start gap-2.5">
          <Car className="mt-0.5 size-4 shrink-0 text-muted" />
          {km !== null && km <= pro.maxTravelKm
            ? travelFeeFor(km) === 0
              ? "Miễn phí di chuyển tới địa chỉ của bạn"
              : `Phí di chuyển tới bạn: ${formatPrice(travelFeeFor(km))}`
            : `Miễn phí di chuyển trong ${POLICY.freeTravelKm} km đầu`}
        </li>
      )}
    </ul>
  )
}

function About({ pro }: { pro: Pro }) {
  const joined = parseISODate(pro.joinedAt)
  return (
    <div className="mt-5 space-y-7">
      {pro.bio && <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{pro.bio}</p>}

      {pro.highlights.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {pro.highlights.map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-3 py-1.5 text-[13px] font-medium text-ink">
              <Check className="size-3.5" />
              {t}
            </li>
          ))}
        </ul>
      )}

      <AboutSection title="Làm việc">
        <WhereFacts pro={pro} />
        <ul className="mt-2.5 space-y-2.5 text-[14px] text-ink">
          {pro.areas.length > 0 && (
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
              Nhận lịch ở {pro.areas.join(", ")}
            </li>
          )}
          {pro.studioAddress && (
            <li className="flex items-start gap-2.5">
              <Store className="mt-0.5 size-4 shrink-0 text-muted" />
              Studio: {pro.studioAddress}
            </li>
          )}
          <li className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted" />
            {pro.yearsExp > 0 ? `${pro.yearsExp} năm kinh nghiệm · ` : ""}
            Trên 360dep từ tháng {joined.getUTCMonth() + 1}/{joined.getUTCFullYear()}
          </li>
        </ul>
      </AboutSection>

      {pro.equipment && (
        <AboutSection title="Thiết bị">
          <p className="flex items-start gap-2.5 text-[15px] text-ink">
            <Camera className="mt-0.5 size-4 shrink-0 text-muted" />
            {pro.equipment}
          </p>
        </AboutSection>
      )}

      {pro.model && <ModelCard model={pro.model} />}

      <AboutSection title="Xác minh">
        <p className="text-[15px] text-ink-soft">
          {pro.identity === "verified"
            ? "360dep đã đối chiếu ảnh CCCD với ảnh chân dung của người này."
            : "Chưa xác minh danh tính với 360dep."}
        </p>
      </AboutSection>
    </div>
  )
}

function AboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[17px] font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

/** What someone casting a model needs. Body measurements are deliberately not here. */
function ModelCard({ model }: { model: ModelProfile }) {
  const sizes = [
    model.topSize && `áo ${model.topSize}`,
    model.bottomSize && `quần ${model.bottomSize}`,
    model.shoeSize && `giày ${model.shoeSize}`,
  ].filter(Boolean)
  return (
    <AboutSection title="Hồ sơ mẫu">
      <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
        {(model.heightCm || sizes.length > 0) && (
          <dl className="grid grid-cols-2 gap-4">
            {model.heightCm ? (
              <div>
                <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                  <Ruler className="size-3.5" /> Chiều cao
                </dt>
                <dd className="mt-0.5 text-[17px] font-bold">{model.heightCm} cm</dd>
              </div>
            ) : null}
            {sizes.length > 0 && (
              <div>
                <dt className="text-[13px] text-muted">Size</dt>
                <dd className="mt-0.5 text-[15px] font-semibold">{sizes.join(" · ")}</dd>
              </div>
            )}
          </dl>
        )}
        {model.styles.length > 0 && (
          <div className="mt-4">
            <p className="text-[13px] text-muted">Phong cách</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {model.styles.map((s) => (
                <li key={s} className="rounded-full bg-subtle px-3 py-1 text-[13px] font-medium">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(model.accepts.length > 0 || model.refuses.length > 0) && (
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            {model.accepts.length > 0 && (
              <div>
                <p className="text-[14px] font-bold">Nhận</p>
                <ul className="mt-1.5 space-y-1.5">
                  {model.accepts.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-[14px]">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {model.refuses.length > 0 && (
              <div>
                <p className="text-[14px] font-bold">Không nhận</p>
                <ul className="mt-1.5 space-y-1.5">
                  {model.refuses.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-[14px]">
                      <X className="mt-0.5 size-4 shrink-0 text-danger" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-[13px] text-muted">360dep không thu thập số đo cơ thể của mẫu.</p>
    </AboutSection>
  )
}

function ShareButton({ name }: { name: string }) {
  return (
    <button
      type="button"
      aria-label={`Chia sẻ hồ sơ ${name}`}
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ title: name, url: window.location.href })
          else await navigator.clipboard.writeText(window.location.href)
        } catch {
          // The share sheet was dismissed.
        }
      }}
      className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-subtle"
    >
      <Share2 className="size-5" />
    </button>
  )
}
