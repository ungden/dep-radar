"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { listedOptions } from "@/lib/offers"
import { isVerified } from "@/lib/trust"
import { IDENTITY_VERIFICATION_OPEN } from "@/lib/launch"
import { Check, Clock, MapPin, Package } from "lucide-react"
import { DataUnavailable } from "@/components/data-unavailable"
import { PostCard, whereLabel } from "@/components/beauty"
import { VerifiedMark } from "@/components/trust"
import { Avatar, ButtonLink, PageHeader } from "@/components/ui"
import { CategoryIcon } from "@/components/category-icon"
import { ConductNote } from "@/components/conduct"
import { CATEGORY_TINTS } from "@/lib/design/category-icons"
import { categoryPhoto } from "@/lib/design/photos"
import { categoryLabel, getTemplate, serviceDuration, serviceQuantity } from "@/lib/catalog"
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
  const params = useSearchParams()
  const router = useRouter()
  const cityParam = params.get("city")
  const city = cityParam === "all" ? null : cityParam ?? state.city
  const maxPrice = Math.max(0, Number(params.get("price")) || 0)
  const comesToYou = params.get("home") === "1"
  const optionsOf = (p: Pro) => listedOptions(template, servicesOf(state, p.id).find((s) => s.templateId === templateId)?.prices ?? {}).filter((o) => !maxPrice || o.minimumTotal <= maxPrice)
  const proOk = (p: Pro) => (!comesToYou || (p.homeService && !template.studioOnly)) && (params.get("open") !== "1" || p.acceptingJobs) && (!IDENTITY_VERIFICATION_OPEN || params.get("verified") !== "1" || isVerified(p))
  if (state.catalogError) return <div className="py-8"><DataUnavailable /></div>

  const offering = (p: Pro) => servicesOf(state, p.id).find((s) => s.templateId === templateId)
  const all = state.pros.filter((p) => p.published && offering(p) && proOk(p) && optionsOf(p).length > 0)
  const near = all.filter((p) => !city || p.city === city)
  const elsewhere = all.filter((p) => city && p.city !== city)

  const ranked = [...near].sort((a, b) => {
    if (a.acceptingJobs !== b.acceptingJobs) return a.acceptingJobs ? -1 : 1
    const da = distanceToCustomer(state, a.id)
    const db = distanceToCustomer(state, b.id)
    if (da !== null && db !== null && Math.abs(da - db) > 1) return da - db
    return rankScore(b) - rankScore(a)
  })

  const availablePackages = template.variants.flatMap((variant) => {
    const prices = near.filter((p) => p.acceptingJobs).flatMap((p) => optionsOf(p).filter((o) => o.variant.id === variant.id).map((o) => o.unitPrice))
    return prices.length ? [{ variant, price: Math.min(...prices) }] : []
  })
  const works = state.works.filter((w) => w.templateId === templateId && (!city || near.some((p) => p.id === w.proId))).slice(0, 8)
  // A real photo of this service when someone posted one; otherwise its category's illustration, labelled.
  const realPhoto = works[0]?.images[0]
  const tint = CATEGORY_TINTS[template.category]

  return (
    <div className="mx-auto max-w-5xl md:pt-4">
      <PageHeader back={params.toString() ? `/search?${params.toString()}` : "/"} />

      {/* On a phone the options come right after the description, before the
          people: price first is the point of this page. */}
      <div className="grid gap-8 md:grid-cols-[1fr_340px] md:gap-x-8 md:gap-y-2">
        <div className="md:col-start-1">
          <figure className="relative -mx-4 mb-6 aspect-[16/10] overflow-hidden bg-subtle sm:mx-0 sm:rounded-[var(--radius-xl)] md:aspect-[16/8]">
            <Image src={realPhoto ?? categoryPhoto(template.category)} alt={realPhoto ? template.name : ""} fill priority sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
            {!realPhoto && <figcaption className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">Ảnh minh hoạ</figcaption>}
          </figure>
          <span className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-label font-bold" style={{ background: tint.bg, color: tint.fg }}>
            <CategoryIcon id={template.category} className="size-4" />
            {categoryLabel(template.category)}
          </span>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] md:text-[42px]">{template.name}</h1>
          <p className="mt-3 text-lead text-ink-soft">{template.description}</p>

          <ul className="mt-6 space-y-2.5 rounded-[var(--radius-lg)] border border-line bg-surface p-5 text-body">
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
          <ConductNote className="mt-4" />
        </div>

        <aside className="md:sticky md:top-24 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
            <p className="text-lead font-extrabold tracking-tight">Gói đang có người nhận</p>
            {availablePackages.length ? <ul className="mt-3 divide-y divide-line">
              {availablePackages.map(({ variant: v, price }) => (
                <li key={v.id} className="space-y-2 py-4 text-body">
                  <p className="font-semibold">{v.label}</p>
                  <p className="flex items-start gap-2 text-meta text-ink-soft"><Clock className="mt-1 size-4 shrink-0" />{formatDuration(serviceDuration(v, serviceQuantity(v)))}</p>
                  <p className="text-price font-bold">Từ {formatPrice(price)}{v.perPerson ? "/người" : ""}</p>
                  {(v.minQuantity ?? 1) > 1 && <p className="text-meta text-ink-soft">Tối thiểu {v.minQuantity} người · từ {formatPrice(price * v.minQuantity!)}/nhóm</p>}
                </li>
              ))}
            </ul> : <p className="mt-2 text-meta text-ink-soft">Chưa có ai nhận gói này ở đây. Giá dưới đây là khung giá niêm yết của 360đẹp.</p>}
            <details className="mt-4 border-t border-line pt-4" open={!availablePackages.length}>
              <summary className="cursor-pointer text-meta font-bold">Khung 3 mức giá của 360đẹp</summary>
              <p className="mt-3 text-meta text-ink-soft">Khung giá tham khảo. Người làm chọn một mức cho từng gói; mức đang nhận lịch nằm ở trên.</p>
              <ul className="mt-3 space-y-4">
                {template.variants.map((v) => <li key={v.id} className="min-w-0 space-y-2"><p className="text-meta font-semibold">{v.label}</p><div className="flex flex-wrap gap-2">{v.tiers.map((tier) => <span key={tier} className="rounded-full border border-line bg-canvas px-2.5 py-1 text-label font-semibold">{formatPrice(tier)}{v.perPerson ? "/người" : ""}</span>)}</div></li>)}
              </ul>
              <p className="mt-3 text-meta text-ink-soft">Khách không trả phí nền tảng.</p>
            </details>
          </div>
        </aside>

        <div className="md:col-start-1">
          <section className="md:mt-2">
            <h2 className="text-[24px] font-extrabold tracking-tight">
              Chọn người làm{city ? ` ở ${city}` : ""}
              {ranked.length > 0 && <span className="ml-2 text-body font-medium text-muted">{ranked.length}</span>}
            </h2>
            {ranked.length === 0 ? (
              <div className="mt-4 rounded-[var(--radius-lg)] bg-highlight-soft px-5 py-8 text-center">
                <p className="text-body font-bold">Chưa có ai nhận dịch vụ này{city ? ` ở ${city}` : ""}</p>
                <p className="mx-auto mt-1 max-w-sm text-body text-ink-soft">
                  {elsewhere.length
                    ? `Có ${elsewhere.length} người nhận ở thành phố khác. Hoặc đăng yêu cầu: người làm quanh bạn được báo, ai nhận trước sẽ làm.`
                    : "Đăng yêu cầu: khi có người làm việc này quanh bạn, họ được báo và ai nhận trước sẽ làm. Không mất phí."}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <ButtonLink href={`/requests/new?service=${template.id}`}>Đăng yêu cầu</ButtonLink>
                  {elsewhere.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { const next = new URLSearchParams(params.toString()); next.set("city", "all"); router.replace(`/dich-vu/${templateId}?${next}`) }}
                      className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-body font-semibold hover:border-ink"
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
                    <ProOffer pro={p} templateId={templateId} maxPrice={maxPrice} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {works.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-[24px] font-extrabold tracking-tight">Ảnh thật của dịch vụ này</h2>
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

function ProOffer({ pro, templateId, maxPrice }: { pro: Pro; templateId: string; maxPrice: number }) {
  const state = useApp()
  const listing = servicesOf(state, pro.id).find((s) => s.templateId === templateId)
  const start = listedOptions(getTemplate(templateId)!, listing?.prices ?? {}).filter((o) => !maxPrice || o.minimumTotal <= maxPrice).sort((a, b) => a.minimumTotal - b.minimumTotal)[0]
  const from = start?.unitPrice ?? null
  const photos = state.works
    .filter((w) => w.proId === pro.id)
    .sort((a, b) => Number(b.templateId === templateId) - Number(a.templateId === templateId))
    .map((w) => w.images[0])
    .filter(Boolean)
    .slice(0, 3)

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/pros/${pro.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={48} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-body font-bold">
              <span className="truncate">{pro.name}</span>
              <VerifiedMark pro={pro} />
            </span>
            <span className="block truncate text-meta text-ink-soft">
              {pro.rating.count ? `${ratingText(pro.rating)} · ` : ""}
              {whereLabel(state, pro)}
            </span>
          </span>
        </Link>
        <div className="shrink-0 text-right">
          {from !== null && (
            <p className="text-body">
              <span className="text-label text-muted">Từ </span>
              <span className="font-bold">{formatPrice(from)}{start?.variant.perPerson ? "/người" : ""}</span>
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
          <ButtonLink href={`/book/${pro.id}?service=${templateId}&variant=${start?.variant.id ?? ""}${start && start.minimumQuantity > 1 ? `&qty=${start.minimumQuantity}` : ""}`} size="sm" className="flex-1">
            Đặt lịch
          </ButtonLink>
        ) : (
          <span className="flex flex-1 items-center justify-center rounded-full bg-subtle text-meta text-ink-soft">Đang tạm nghỉ</span>
        )}
      </div>
    </div>
  )
}
