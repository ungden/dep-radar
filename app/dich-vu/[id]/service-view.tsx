"use client"

import Image from "next/image"
import Link from "next/link"
import { Check, Clock, MapPin, Package } from "lucide-react"
import { PostCard, whereLabel } from "@/components/beauty"
import { VerifiedMark } from "@/components/trust"
import { Avatar, ButtonLink, PageHeader } from "@/components/ui"
import { categoryLabel, getTemplate } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { distanceToCustomer, servicesOf, useApp } from "@/lib/store"
import { excludes, placeLabel } from "@/lib/trade"
import { rankScore } from "@/lib/trust"
import type { Pro } from "@/lib/types"
import { cn, formatDuration, formatPrice, ratingText } from "@/lib/utils"

/**
 * A service, for sale: what it is, what each option costs, and who near the
 * customer does it -- each with their own price and real work -- one tap
 * from booking. This is where a card on the home page leads.
 */
export function ServiceView({ templateId }: { templateId: string }) {
  const state = useApp()
  const template = getTemplate(templateId)!
  const { city } = state

  const offering = (p: Pro) => servicesOf(state, p.id).find((s) => s.templateId === templateId)
  const all = state.pros.filter((p) => p.published && offering(p))
  const near = all.filter((p) => !city || p.city === city)
  const elsewhere = all.filter((p) => city && p.city !== city)

  const ranked = [...near].sort((a, b) => {
    if (a.acceptingJobs !== b.acceptingJobs) return a.acceptingJobs ? -1 : 1
    const da = distanceToCustomer(state, a.id)
    const db = distanceToCustomer(state, b.id)
    if (da !== null && db !== null && Math.abs(da - db) > 1) return da - db
    return rankScore(b) - rankScore(a)
  })

  const works = state.works.filter((w) => w.templateId === templateId && (!city || near.some((p) => p.id === w.proId))).slice(0, 8)

  return (
    <div className="mx-auto max-w-5xl md:pt-4">
      <PageHeader back="/" />

      {/* On a phone the options come right after the description, before the
          people: price first is the point of this page. */}
      <div className="grid gap-8 md:grid-cols-[1fr_340px] md:gap-x-8 md:gap-y-2">
        <div className="md:col-start-1">
          <p className="text-[13px] font-semibold text-muted">{categoryLabel(template.category)}</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-tight md:text-[38px]">{template.name}</h1>
          <p className="mt-2 text-[16px] text-ink-soft">{template.description}</p>

          <ul className="mt-5 space-y-2 text-[15px]">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {placeLabel(template)}
            </li>
            {template.deliverable && (
              <li className="flex gap-2.5">
                <Package className="mt-0.5 size-4 shrink-0" />
                {template.deliverable}
                {template.deliveryDays ? `, giao trong ${template.deliveryDays} ngày` : ""}
              </li>
            )}
            {template.includes.map((line) => (
              <li key={line} className={cn("flex gap-2.5", excludes(line) && "text-ink-soft")}>
                <Check className={cn("mt-0.5 size-4 shrink-0", excludes(line) && "opacity-0")} />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <aside className="md:sticky md:top-24 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
            <p className="text-[15px] font-bold">Các gói</p>
            <ul className="mt-3 divide-y divide-line">
              {template.variants.map((v) => (
                <li key={v.id} className="flex items-start justify-between gap-3 py-3 text-[14px]">
                  <span>
                    <span className="block font-semibold">{v.label}</span>
                    <span className="flex items-center gap-1 text-ink-soft">
                      <Clock className="size-3.5" /> {formatDuration(v.durationMin)}
                      {v.perPerson ? " · mỗi người" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-semibold">
                    {formatPrice(v.minPrice)}
                    <span className="block text-[12px] font-normal text-muted">đến {formatPrice(v.maxPrice)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-ink-soft">
              Khung giá chuẩn của 360dep; mỗi người làm tự đặt giá trong khung. Khách không trả phí nền tảng.
            </p>
          </div>
        </aside>

        <div className="md:col-start-1">
          <section className="md:mt-2">
            <h2 className="text-[22px] font-bold tracking-tight">
              Chọn người làm{city ? ` ở ${city}` : ""}
              {ranked.length > 0 && <span className="ml-2 text-[15px] font-medium text-muted">{ranked.length}</span>}
            </h2>
            {ranked.length === 0 ? (
              <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-line-strong px-5 py-8 text-center">
                <p className="text-[16px] font-bold">Chưa có ai nhận dịch vụ này{city ? ` ở ${city}` : ""}</p>
                <p className="mx-auto mt-1 max-w-sm text-[14px] text-ink-soft">
                  {elsewhere.length
                    ? `Có ${elsewhere.length} người nhận ở thành phố khác. Hoặc đăng yêu cầu: người làm quanh bạn được báo, ai nhận trước sẽ làm.`
                    : "Đăng yêu cầu: khi có người làm việc này quanh bạn, họ được báo và ai nhận trước sẽ làm. Không mất phí."}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <ButtonLink href={`/requests/new?service=${template.id}`}>Đăng yêu cầu</ButtonLink>
                  {elsewhere.length > 0 && (
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
            ) : (
              <ul className="mt-4 space-y-3">
                {ranked.map((p) => (
                  <li key={p.id}>
                    <ProOffer pro={p} templateId={templateId} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {works.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-[22px] font-bold tracking-tight">Ảnh thật của dịch vụ này</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3">
                {works.map((w) => (
                  <PostCard key={w.id} work={w} />
                ))}
              </div>
            </section>
          )}
        </div>

      </div>
    </div>
  )
}

function ProOffer({ pro, templateId }: { pro: Pro; templateId: string }) {
  const state = useApp()
  const listing = servicesOf(state, pro.id).find((s) => s.templateId === templateId)
  const prices = Object.values(listing?.prices ?? {})
  const from = prices.length ? Math.min(...prices) : null
  const photos = state.works
    .filter((w) => w.proId === pro.id)
    .sort((a, b) => Number(b.templateId === templateId) - Number(a.templateId === templateId))
    .map((w) => w.images[0])
    .filter(Boolean)
    .slice(0, 3)

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <Link href={`/pros/${pro.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={48} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[16px] font-bold">
              <span className="truncate">{pro.name}</span>
              <VerifiedMark pro={pro} />
            </span>
            <span className="block truncate text-[13px] text-ink-soft">
              {pro.rating.count ? `${ratingText(pro.rating)} · ` : ""}
              {whereLabel(state, pro)}
            </span>
          </span>
        </Link>
        <div className="shrink-0 text-right">
          {from !== null && (
            <p className="text-[15px]">
              <span className="text-[12px] text-muted">Từ </span>
              <span className="font-bold">{formatPrice(from)}</span>
            </p>
          )}
        </div>
      </div>
      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {photos.map((src, i) => (
            <Link key={i} href={`/pros/${pro.id}`} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-sm)] bg-subtle">
              <Image src={src} alt="" fill sizes="(min-width: 768px) 180px, 30vw" className="object-cover" />
            </Link>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <ButtonLink href={`/pros/${pro.id}`} variant="outline" size="sm" className="flex-1">
          Xem hồ sơ
        </ButtonLink>
        {pro.acceptingJobs ? (
          <ButtonLink href={`/book/${pro.id}?service=${templateId}`} size="sm" className="flex-1">
            Đặt lịch
          </ButtonLink>
        ) : (
          <span className="flex flex-1 items-center justify-center rounded-full bg-subtle text-[13px] text-ink-soft">Đang tạm nghỉ</span>
        )}
      </div>
    </div>
  )
}
