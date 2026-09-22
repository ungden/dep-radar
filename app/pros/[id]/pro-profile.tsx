"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Briefcase, CalendarDays, Car, ChevronLeft, Home, MapPin, Share2, Sparkles, Store } from "lucide-react"
import { FollowButton } from "@/components/follow-button"
import { MessageButton } from "@/components/message-button"
import { ServiceMenu } from "@/components/service-menu"
import { RatingSummaryBlock, ReviewItem, VerifiedBadge, VerifiedMark } from "@/components/trust"
import { Avatar, Button, Card, Chip, EmptyState, Tabs } from "@/components/ui"
import { POLICY, travelFeeFor } from "@/lib/pricing"
import { distanceToCustomer, fromPrice, proView, reviewsOf, servicesOf, useApp, worksOf } from "@/lib/store"
import { cn, formatPrice, formatResponseTime, parseISODate } from "@/lib/utils"

type Tab = "services" | "works" | "reviews" | "about"

export function ProProfile({ proId }: { proId: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const state = useApp()
  const pro = proView(state, proId)!
  const works = worksOf(state, pro.id)
  const services = servicesOf(state, pro.id)
  const reviews = reviewsOf(state, pro.id)
  const from = fromPrice(state, pro.id)
  const km = state.session?.role !== "pro" ? distanceToCustomer(state, pro.id) : null
  const [tab, setTab] = React.useState<Tab>((params.get("tab") as Tab | null) ?? "services")
  const [withPhotos, setWithPhotos] = React.useState(false)
  const shownReviews = withPhotos ? reviews.filter((r) => r.photo) : reviews
  const tabsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (params.get("tab")) tabsRef.current?.scrollIntoView({ block: "start" })
  }, [params])

  const openServices = () => {
    setTab("services")
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const cover = works[0]?.images[0] ?? "/images/works/nail-milky-1.webp"
  const joined = parseISODate(pro.joinedAt)

  return (
    <div className="-mx-4 md:mx-0 md:pt-6">
      <div className="relative h-44 overflow-hidden bg-subtle md:h-64 md:rounded-3xl">
        <Image src={cover} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-canvas/70" />
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => router.back()}
          className="absolute left-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/85 backdrop-blur md:hidden"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>

      <div className="px-4 md:grid md:grid-cols-[340px_1fr] md:gap-10 md:px-0">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="-mt-12 flex items-end justify-between">
            <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={96} className="border-4 border-canvas" />
            <div className="flex gap-2 pb-1">
              <ShareButton name={pro.name} />
              <FollowButton proId={pro.id} />
            </div>
          </div>
          <h1 className="mt-3 flex flex-wrap items-center gap-1.5 text-[28px] font-extrabold tracking-tight">
            {pro.name}
            <VerifiedMark pro={pro} className="size-5" />
          </h1>
          <p className="text-sm text-muted">
            {pro.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setTab("reviews")} className="inline-flex items-center gap-1 text-sm">
              <span className="text-[#e0a33a]">★</span>
              <b>{pro.rating.average.toFixed(1)}</b>
              <span className="text-muted underline underline-offset-2">({pro.rating.count} đánh giá)</span>
            </button>
          </div>

          <VerifiedBadge pro={pro} className="mt-3" />
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              [pro.stats.completedJobs.toLocaleString("vi-VN"), "Job hoàn thành"],
              [`${pro.yearsExp} năm`, "Kinh nghiệm"],
              [formatResponseTime(pro.stats.responseMinutes) ?? "—", "Phản hồi"],
            ].map(([value, label]) => (
              <li key={label} className="rounded-2xl bg-surface px-2 py-3 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </li>
            ))}
          </ul>

          <ul className="mt-4 space-y-2 text-[13px] text-ink-soft">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-muted" />
              {pro.district}, {pro.city}
              {km !== null && <span className="text-muted">· cách bạn ~{km.toLocaleString("vi-VN")} km</span>}
            </li>
            <li className="flex items-center gap-2">
              {pro.homeService ? <Home className="size-4 text-muted" /> : <Store className="size-4 text-muted" />}
              {pro.homeService ? `Làm tại nhà trong bán kính ${pro.maxTravelKm} km` : "Chỉ làm tại studio"}
              {pro.studioAddress && pro.homeService && " · có studio"}
            </li>
            {pro.homeService && (
              <li className="flex items-center gap-2">
                <Car className="size-4 text-muted" />
                {km !== null && km <= pro.maxTravelKm
                  ? travelFeeFor(km) === 0
                    ? "Miễn phí di chuyển tới địa chỉ của bạn"
                    : `Phí di chuyển tới bạn: ${formatPrice(travelFeeFor(km))}`
                  : `Miễn phí di chuyển trong ${POLICY.freeTravelKm} km`}
              </li>
            )}
            <li className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted" />
              Tham gia 360dep từ tháng {joined.getMonth() + 1}/{joined.getFullYear()}
            </li>
          </ul>

          <Button size="lg" className="mt-5 w-full" onClick={openServices} disabled={!services.length}>
            Xem bảng giá & đặt lịch{from !== null ? ` · từ ${formatPrice(from)}` : ""}
          </Button>
          {/* Asking before booking is often the difference between booking and
              not: "tóc tôi đã tẩy, có uốn được không?" */}
          {state.session?.proId !== pro.id && (
            <MessageButton proId={pro.id} label={`Nhắn tin cho ${pro.name.split(" ").slice(-1)[0]}`} className="mt-2 w-full" />
          )}
        </aside>

        <div ref={tabsRef} className="scroll-mt-4 md:scroll-mt-24">
          <Tabs
            className="mt-6 md:mt-4"
            value={tab}
            onChange={setTab}
            items={[
              { value: "services", label: `Bảng giá (${services.length})` },
              { value: "works", label: `Tác phẩm (${works.length})` },
              { value: "reviews", label: `Đánh giá (${pro.rating.count})` },
              { value: "about", label: "Giới thiệu" },
            ]}
          />

          {tab === "services" && <ServiceMenu proId={pro.id} bookable={state.session?.proId !== pro.id} />}

          {tab === "works" &&
            (works.length ? (
              <div className="mt-4 grid grid-cols-3 gap-1.5 md:gap-3">
                {works.flatMap((w) =>
                  w.images.slice(0, 2).map((src, i) => (
                    <Link key={w.id + i} href={`/works/${w.id}`} className="relative aspect-square overflow-hidden rounded-xl bg-subtle">
                      <Image src={src} alt={w.title} fill sizes="(min-width: 768px) 20vw, 33vw" className="object-cover transition-transform hover:scale-105" />
                    </Link>
                  )),
                )}
              </div>
            ) : (
              <EmptyState title="Chưa có tác phẩm" />
            ))}

          {tab === "reviews" && (
            <div className="mt-5">
              <Card className="p-4">
                <RatingSummaryBlock rating={pro.rating} />
              </Card>
              <div className="mt-3 flex items-center gap-2">
                <p className="flex-1 text-xs text-muted">Chỉ khách đã hoàn thành lịch hẹn qua 360dep mới được đánh giá.</p>
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

          {tab === "about" && (
            <div className="mt-5 space-y-6">
              <p className="text-[15px] leading-relaxed text-ink-soft">{pro.bio}</p>
              <div>
                <p className="mb-2 text-sm font-semibold">Điểm nổi bật</p>
                <div className="flex flex-wrap gap-2">
                  {pro.highlights.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink-soft shadow-[var(--shadow-soft)]">
                      <Sparkles className="size-3.5 text-accent" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <Card className="px-4 py-3 text-sm">
                <p className="font-semibold">Xác minh bởi 360dep</p>
                <p className="mt-1 text-ink-soft">
                  {pro.identity === "verified"
                    ? "Đã đối chiếu ảnh CCCD với ảnh chân dung của chuyên viên."
                    : "Chuyên viên chưa xác minh danh tính."}
                </p>
              </Card>
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                  <Briefcase className="size-4" /> Khu vực nhận job
                </p>
                <p className="text-sm text-ink-soft">
                  {pro.areas.join(", ")} ({pro.city})
                </p>
                {pro.studioAddress && <p className="mt-1 text-sm text-ink-soft">Studio: {pro.studioAddress}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
          // dismissed
        }
      }}
      className={cn("inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:text-accent")}
    >
      <Share2 className="size-4" />
    </button>
  )
}
