"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BadgeCheck, Briefcase, ChevronLeft, Clock, Home, MapPin, MessageCircleHeart, Share2, Sparkles, Star } from "lucide-react"
import { FollowButton } from "@/components/follow-button"
import { Avatar, Button, ButtonLink, Card, Chip, EmptyState, Rating, Tabs } from "@/components/ui"
import { categoryLabel, getPro, reviewsByPro, worksByPro } from "@/lib/data"
import { servicesFor, useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"
import { cn, formatCompact, formatDuration, formatPrice, parseISODate } from "@/lib/utils"

type Tab = "works" | "services" | "about" | "reviews"

export function ProProfile({ proId }: { proId: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const state = useApp()
  const pro = getPro(proId)!
  const works = worksByPro(pro.id)
  const services = servicesFor(state, pro.id)
  const reviews = reviewsByPro(pro.id)
  const initialTab = (params.get("tab") as Tab | null) ?? "works"
  const [tab, setTab] = React.useState<Tab>(initialTab)
  const tabsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (params.get("tab")) tabsRef.current?.scrollIntoView({ block: "start" })
  }, [params])

  const openServices = () => {
    setTab("services")
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const cover = works[0]?.images[0] ?? "/images/works/nail-1.webp"

  return (
    <div className="-mx-4 md:mx-0 md:pt-6">
      <div className="relative h-44 overflow-hidden bg-blush md:h-64 md:rounded-3xl">
        <Image src={cover} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-canvas/60" />
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => router.back()}
          className="absolute left-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/85 backdrop-blur md:hidden"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="absolute right-6 top-6 font-display text-2xl italic leading-tight text-white/95 drop-shadow md:text-4xl">
          Beauty
          <br />
          in real life
        </p>
      </div>

      <div className="px-4 md:grid md:grid-cols-[320px_1fr] md:gap-10 md:px-0">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="-mt-12 flex items-end justify-between">
            <Avatar name={pro.name} tone={pro.tone} size={96} className="border-4 border-canvas text-3xl" />
            <div className="flex gap-2 pb-1">
              <ShareButton name={pro.name} />
              <FollowButton proId={pro.id} />
            </div>
          </div>
          <h1 className="mt-3 flex items-center gap-1.5 text-2xl font-semibold">
            {pro.name}
            {pro.verified && <BadgeCheck className="size-5 fill-rose text-white" aria-label="Đã xác minh" />}
          </h1>
          <p className="text-sm text-muted">{pro.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
            <Rating value={pro.rating} count={pro.reviewCount} />
            <span>·</span>
            <span>{formatCompact(pro.followers)} người theo dõi</span>
            <span>·</span>
            <span>{pro.completedJobs} job đã làm</span>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2 text-[13px] text-ink-soft">
            <InfoItem icon={<MapPin className="size-4" />}>
              {pro.district}, {pro.city}
            </InfoItem>
            <InfoItem icon={<Home className="size-4" />}>{pro.homeService ? "Nhận làm tại nhà" : "Làm tại studio"}</InfoItem>
            <InfoItem icon={<Briefcase className="size-4" />}>{pro.yearsExp} năm kinh nghiệm</InfoItem>
            <InfoItem icon={<Clock className="size-4" />}>{pro.responseTime.replace("Thường phản hồi trong ", "Phản hồi ~")}</InfoItem>
          </ul>

          <Button size="lg" className="mt-5 w-full" onClick={openServices}>
            Đặt lịch
          </Button>
        </aside>

        <div ref={tabsRef} className="scroll-mt-4 md:scroll-mt-24">
          <Tabs
            className="mt-6 md:mt-4"
            value={tab}
            onChange={setTab}
            items={[
              { value: "works", label: `Tác phẩm (${works.length})` },
              { value: "services", label: `Dịch vụ (${services.length})` },
              { value: "about", label: "Giới thiệu" },
              { value: "reviews", label: `Đánh giá (${pro.reviewCount})` },
            ]}
          />

          {tab === "works" &&
            (works.length ? (
              <div className="mt-4 grid grid-cols-3 gap-1.5 md:gap-3">
                {works.flatMap((w) =>
                  w.images.slice(0, 2).map((src, i) => (
                    <Link key={w.id + i} href={`/works/${w.id}`} className="relative aspect-square overflow-hidden rounded-xl bg-blush">
                      <Image src={src} alt={w.title} fill sizes="(min-width: 768px) 20vw, 33vw" className="object-cover transition-transform hover:scale-105" />
                    </Link>
                  )),
                )}
              </div>
            ) : (
              <EmptyState title="Chưa có tác phẩm" />
            ))}

          {tab === "services" && <ServiceList proId={pro.id} />}

          {tab === "about" && (
            <div className="mt-5 space-y-5">
              <p className="text-[15px] leading-relaxed text-ink-soft">{pro.bio}</p>
              <div>
                <p className="mb-2 text-sm font-semibold">Điểm nổi bật</p>
                <div className="flex flex-wrap gap-2">
                  {pro.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink-soft shadow-[var(--shadow-soft)]">
                      <Sparkles className="size-3.5 text-rose" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Khu vực nhận job</p>
                <p className="text-sm text-ink-soft">
                  {pro.areas.join(", ")} ({pro.city})
                </p>
                {pro.studioAddress && <p className="mt-1 text-sm text-ink-soft">Studio: {pro.studioAddress}</p>}
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="mt-5">
              <Card className="flex items-center gap-5 p-4">
                <div className="text-center">
                  <p className="text-4xl font-semibold">{pro.rating.toFixed(1)}</p>
                  <div className="mt-1 flex justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("size-3.5", i < Math.round(pro.rating) ? "fill-ink text-ink" : "text-line")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-ink-soft">
                  {pro.reviewCount} đánh giá từ khách đã đặt lịch qua dep360. Chỉ khách hoàn thành lịch hẹn mới được đánh giá.
                </p>
              </Card>
              <ul className="mt-4 divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id} className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.author} size={36} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.author}</p>
                        <p className="text-xs text-muted">
                          {r.serviceName} · {parseISODate(r.date).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <Rating value={r.rating} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.text}</p>
                  </li>
                ))}
                {reviews.length === 0 && <EmptyState icon={<MessageCircleHeart className="size-6" />} title="Chưa có đánh giá" />}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="text-muted">{icon}</span>
      <span className="truncate">{children}</span>
    </li>
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
      className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:text-rose"
    >
      <Share2 className="size-4" />
    </button>
  )
}

export function ServiceList({ proId }: { proId: string }) {
  const state = useApp()
  const services = servicesFor(state, proId)
  const pro = getPro(proId)!
  const [cat, setCat] = React.useState<CategoryId | "all">("all")
  const cats = Array.from(new Set(services.map((s) => s.category)))
  const shown = services.filter((s) => cat === "all" || s.category === cat)

  if (!services.length) return <EmptyState title="Chuyên viên đang cập nhật dịch vụ" />

  return (
    <div className="mt-4">
      {cats.length > 1 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            Tất cả
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {categoryLabel(c)}
            </Chip>
          ))}
        </div>
      )}
      <ul className="space-y-3">
        {shown.map((s) => {
          const sample = worksByPro(pro.id).find((w) => w.serviceId === s.id) ?? worksByPro(pro.id)[0]
          return (
            <li key={s.id}>
              <Card className="flex gap-3 p-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-blush">
                  {sample && <Image src={sample.images[0]} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-semibold">{s.name}</p>
                  <p className="line-clamp-2 text-xs text-muted">{s.description}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                    <Clock className="size-3.5" />
                    {formatDuration(s.durationMin)}
                  </p>
                  <div className="mt-auto flex items-end justify-between pt-1">
                    <p className="font-semibold">{formatPrice(s.price)}</p>
                    <ButtonLink href={`/book/${s.id}`} variant="outline" size="sm">
                      Đặt lịch
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
