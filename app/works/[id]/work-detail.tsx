"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, Clock, MapPin, PackageCheck, Share2, X } from "lucide-react"
import { FollowButton } from "@/components/follow-button"
import { Gallery } from "@/components/gallery"
import { MessageButton } from "@/components/message-button"
import { CategoryTag } from "@/components/trade"
import { VerifiedMark } from "@/components/trust"
import { PostCard, SaveWorkButton, whereLabel } from "@/components/beauty"
import { Avatar, ButtonLink } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { trackWork } from "@/lib/feed-events"
import { POLICY } from "@/lib/pricing"
import { proView, servicesOf, useApp, worksOf } from "@/lib/store"
import { excludes, personWord, placeLabel } from "@/lib/trade"
import { rankScore } from "@/lib/trust"
import type { Pro, ServiceTemplate } from "@/lib/types"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

export function WorkDetail({ workId }: { workId: string }) {
  const router = useRouter()
  const state = useApp()
  const work = state.works.find((w) => w.id === workId)
  const pro = work ? proView(state, work.proId) : undefined
  const tpl = work ? getTemplate(work.templateId) : undefined

  const listing = work && pro ? servicesOf(state, pro.id).find((x) => x.templateId === work.templateId) : undefined
  const offered = listing && tpl ? tpl.variants.filter((v) => listing.prices[v.id] !== undefined) : []
  const [variantId, setVariantId] = React.useState<string | null>(null)
  const variant = offered.find((v) => v.id === variantId) ?? offered[0]

  // One "open" per page view, however often React runs the effect.
  const opened = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!work || opened.current === work.dbId) return
    opened.current = work.dbId
    trackWork(work.dbId, "open")
  }, [work])

  // The page component already resolved this work, so a miss here means the
  // freelancer unpublished it between the server render and this one.
  if (!work || !pro || !tpl) {
    return (
      <div className="py-24 text-center">
        <p className="text-[17px] font-bold">Tác phẩm này không còn hiển thị</p>
        <ButtonLink href="/" className="mt-5">
          Về trang khám phá
        </ButtonLink>
      </div>
    )
  }

  const own = state.session?.proId === pro.id
  const bookable = Boolean(listing && variant) && !own
  const from = offered.length ? Math.min(...offered.map((v) => listing!.prices[v.id])) : null
  const bookHref = variant ? `/book/${pro.id}?service=${tpl.id}&variant=${variant.id}` : `/pros/${pro.id}?tab=services`
  const onBook = () => trackWork(work.dbId, "book_click")

  // The same service by someone else, in the city the customer is browsing:
  // this is how people compare before booking.
  const byOthers = state.works.filter((w) => w.templateId === work.templateId && w.proId !== work.proId)
  const inCity = byOthers.filter((w) => !state.city || proView(state, w.proId)?.city === state.city)
  const similar = (inCity.length ? inCity : byOthers)
    .sort((a, b) => rankOf(state, b.proId) - rankOf(state, a.proId))
    .slice(0, 8)
  const others = worksOf(state, pro.id)
    .filter((w) => w.id !== work.id)
    .slice(0, 8)

  const back = () => (window.history.length > 1 ? router.back() : router.push("/"))

  return (
    <div className="md:pt-8">
      <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(340px,1fr)] md:grid-rows-[auto_1fr_auto] md:gap-x-10 lg:gap-x-14">
        {/* A: the photos */}
        <Gallery
          work={work}
          sizes="(min-width: 1200px) 620px, (min-width: 768px) 55vw, 100vw"
          className="-mx-4 md:col-start-1 md:row-span-2 md:row-start-1 md:mx-0"
          overlay={
            <>
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
              <div className="absolute right-1 top-2 flex">
                <ShareButton title={work.title} />
                <SaveWorkButton workId={work.id} />
              </div>
            </>
          }
        />

        {/* B: what it is and who made it */}
        <header className="pt-5 md:col-start-2 md:row-start-1 md:pt-0">
          <CategoryTag category={work.category} href={`/search?category=${work.category}`} />
          <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight md:text-[34px]">{work.title}</h1>
          <ProRow pro={pro} own={own} />
          {work.description && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink">{work.description}</p>}
        </header>

        {/* C: the service behind the post. After the booking card on the phone. */}
        <section className="order-1 mt-8 md:order-none md:col-start-1 md:row-start-3 md:mt-10">
          <h2 className="text-[20px] font-extrabold tracking-tight">Về dịch vụ</h2>
          <p className="mt-1 text-[15px] text-ink-soft">{tpl.description}</p>
          <ServiceFacts tpl={tpl} pro={pro} className="mt-4" />
          {tpl.includes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {tpl.includes.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[15px] text-ink">
                  {excludes(x) ? (
                    <X className="mt-0.5 size-[18px] shrink-0 text-muted" />
                  ) : (
                    <Check className="mt-0.5 size-[18px] shrink-0 text-success" />
                  )}
                  {x}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* D: booking. Inline on the phone (with a bar at the bottom), a sticky card on a computer. */}
        <aside className="mt-8 md:sticky md:top-24 md:col-start-2 md:row-span-2 md:row-start-2 md:mt-6 md:self-start">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 md:p-5">
            {own ? (
              <>
                <p className="text-[17px] font-bold">Đây là tác phẩm của bạn</p>
                <p className="mt-1 text-[15px] text-ink-soft">Khách thấy giá và nút đặt lịch ở đây.</p>
                <ButtonLink href="/studio/works" variant="outline" className="mt-4 w-full">
                  Quản lý tác phẩm
                </ButtonLink>
              </>
            ) : listing && variant ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-bold">{tpl.name}</p>
                  {from !== null && (
                    <p className="shrink-0 text-[14px] text-muted">
                      Từ <span className="text-[17px] font-extrabold text-ink">{formatPrice(from)}</span>
                    </p>
                  )}
                </div>
                <div role="radiogroup" aria-label="Chọn gói" className="mt-3 space-y-2">
                  {offered.map((v) => {
                    const active = v.id === variant.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setVariantId(v.id)}
                        className={cn(
                          "flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-left transition-colors",
                          active ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink/30",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold leading-snug">{v.label}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                            <Clock className="size-3.5" />
                            {formatDuration(v.durationMin)}
                            {v.perPerson ? " · mỗi người" : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-[15px] font-bold">{formatPrice(listing.prices[v.id])}</span>
                      </button>
                    )
                  })}
                </div>
                <ButtonLink href={bookHref} onClick={onBook} size="lg" className="mt-4 hidden w-full md:flex">
                  Đặt lịch · {formatPrice(listing.prices[variant.id])}
                </ButtonLink>
                <MessageButton proId={pro.id} label="Nhắn tin hỏi trước" className="mt-2 w-full" />
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  Sau khi bạn đặt, {pro.name} gọi xác nhận trong {POLICY.confirmWithinHours} giờ. Phí di chuyển, nếu có, hiện rõ
                  trước khi bạn xác nhận.
                </p>
              </>
            ) : (
              <>
                <p className="text-[17px] font-bold">{pro.name} tạm ngưng dịch vụ này</p>
                <p className="mt-1 text-[15px] text-ink-soft">Xem các dịch vụ khác {pro.name} đang nhận, hoặc nhắn tin để hỏi.</p>
                <ButtonLink href={`/pros/${pro.id}?tab=services`} className="mt-4 w-full">
                  Xem bảng giá
                </ButtonLink>
                <MessageButton proId={pro.id} className="mt-2 w-full" />
              </>
            )}
          </div>
          {!own && (
            <Link
              href={`/pros/${pro.id}?tab=services`}
              className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-4 hover:underline"
            >
              Bảng giá đầy đủ của {pro.name}
            </Link>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12 md:mt-16">
          <h2 className="text-[20px] font-extrabold tracking-tight md:text-[24px]">Mẫu tương tự từ người khác</h2>
          <p className="mt-1 text-[15px] text-ink-soft">
            {tpl.name}, do {personWord([work.category])} khác làm. So tay nghề và giá trước khi đặt.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
            {similar.map((w) => (
              <PostCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-12 md:mt-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[20px] font-extrabold tracking-tight md:text-[24px]">Tác phẩm khác của {pro.name}</h2>
            <Link href={`/pros/${pro.id}`} className="shrink-0 text-[14px] font-semibold underline-offset-4 hover:underline">
              Xem hồ sơ
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
            {others.map((w) => (
              <PostCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}

      {bookable && variant && listing && (
        <>
          <div className="h-24 md:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-muted">{tpl.name}</p>
                <p className="truncate text-[15px] font-semibold leading-tight">{variant.label}</p>
              </div>
              <ButtonLink href={bookHref} onClick={onBook} size="lg" className="shrink-0 px-6">
                {/* Until a package is picked, the cheapest one sets the price. */}
                {variantId === null && from !== null
                  ? `Từ ${formatPrice(from)} · Đặt lịch`
                  : `Đặt lịch · ${formatPrice(listing.prices[variant.id])}`}
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function rankOf(state: ReturnType<typeof useApp>, proId: string) {
  const p = proView(state, proId)
  return p ? rankScore(p) : 0
}

function ProRow({ pro, own }: { pro: Pro; own: boolean }) {
  const state = useApp()
  return (
    <div className="mt-4 flex items-center gap-3">
      <Link href={`/pros/${pro.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={48} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-[15px] font-bold">
            <span className="truncate">{pro.name}</span>
            <VerifiedMark pro={pro} />
          </span>
          <span className="block truncate text-[13px] text-ink-soft">
            {pro.rating.count > 0 ? (
              <>
                <span className="font-semibold text-ink">★ {pro.rating.average.toFixed(1)}</span> ({pro.rating.count})
              </>
            ) : (
              "Chưa có đánh giá"
            )}
            {" · "}
            {whereLabel(state, pro)}
          </span>
        </span>
      </Link>
      {!own && <FollowButton proId={pro.id} />}
    </div>
  )
}

function ServiceFacts({ tpl, pro, className }: { tpl: ServiceTemplate; pro: Pro; className?: string }) {
  return (
    <ul className={cn("space-y-2 text-[15px] text-ink", className)}>
      <li className="flex items-start gap-2.5">
        <MapPin className="mt-0.5 size-[18px] shrink-0 text-muted" />
        {placeLabel(tpl, pro)}
      </li>
      {tpl.deliverable && (
        <li className="flex items-start gap-2.5">
          <PackageCheck className="mt-0.5 size-[18px] shrink-0 text-muted" />
          <span>
            {tpl.deliverable}
            {tpl.deliveryDays ? <span className="text-ink-soft"> · Giao trong {tpl.deliveryDays} ngày</span> : null}
          </span>
        </li>
      )}
    </ul>
  )
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      type="button"
      aria-label={copied ? "Đã chép liên kết" : "Chia sẻ"}
      onClick={async () => {
        const url = window.location.href
        try {
          if (navigator.share) await navigator.share({ title, url })
          else {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          }
        } catch {
          // The share sheet was dismissed.
        }
      }}
      className="group/share inline-flex size-11 items-center justify-center"
    >
      <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform group-active/share:scale-90">
        {copied ? <Check className="size-[18px]" /> : <Share2 className="size-[18px]" />}
      </span>
    </button>
  )
}
