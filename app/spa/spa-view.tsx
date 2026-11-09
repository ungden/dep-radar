"use client"

import * as React from "react"
import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { DataUnavailable } from "@/components/data-unavailable"
import { EmptyState, PageSkeleton } from "@/components/ui"
import { IllustrationBadge } from "@/components/shop"
import { getTemplate } from "@/lib/catalog"
import { actions } from "@/lib/client-actions"
import { isSpa } from "@/lib/launch"
import { SPA, openState, spaPhoto } from "@/lib/spa"
import { distanceToCustomer, servicesOf, useApp } from "@/lib/store"
import { showsAverage } from "@/lib/connection"
import { rankScore } from "@/lib/trust"
import type { Pro, ProService } from "@/lib/types"
import { cn, formatPrice, todayISO } from "@/lib/utils"

const km = (n: number) => `${n.toFixed(1).replace(".", ",")} km`

export function SpaPageView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SpaList />
    </Suspense>
  )
}

/**
 * Spas near the customer (owner, 08/11/2026), as the app's /spa: nearest
 * first, open now, the price of the chosen service and today's free times.
 * Makeup and the Artists stay the main page; this is one link from home.
 */
function SpaList() {
  const state = useApp()
  const params = useSearchParams()
  const [service, setService] = React.useState<string | null>(params.get("service"))
  const [openOnly, setOpenOnly] = React.useState(false)
  const [ratedOnly, setRatedOnly] = React.useState(false)

  const listingsOf = React.useCallback(
    (spa: Pro): ProService[] => servicesOf(state, spa.id).filter((s) => Object.keys(s.prices).length > 0 && !getTemplate(s.templateId)?.addon),
    [state],
  )
  const spas = state.pros
    .filter((p) => isSpa(p) && p.published && p.acceptingJobs && (!state.city || p.city === state.city))
    .map((pro) => ({ pro, distance: distanceToCustomer(state, pro.id) }))
    .sort((a, b) => (a.distance !== null && b.distance !== null && a.distance !== b.distance ? a.distance - b.distance : rankScore(b.pro) - rankScore(a.pro)))

  const services = React.useMemo(() => {
    const count = new Map<string, number>()
    for (const { pro } of spas) for (const s of listingsOf(pro)) count.set(s.templateId, (count.get(s.templateId) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => getTemplate(id)!).filter(Boolean)
  }, [spas, listingsOf])

  const shown = spas.filter(({ pro }) => {
    if (service && !listingsOf(pro).some((s) => s.templateId === service)) return false
    if (openOnly && !openState(pro.openingHours ?? []).open) return false
    if (ratedOnly && !(showsAverage(pro.rating.count) && pro.rating.average >= 4.5)) return false
    return true
  })

  if (state.catalogError) return <div className="py-8"><DataUnavailable /></div>

  return (
    <div className="roomy pt-5 md:pt-10">
      <h1 className="text-[28px] font-bold tracking-[-0.03em] md:text-[38px]">{service ? getTemplate(service)?.name ?? SPA.listTitle : SPA.listTitle}</h1>
      <p className="mt-1 text-ink-soft">Bạn đến spa, trả tiền tại spa sau khi làm xong.</p>

      {services.length > 1 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Toggle active={!service} onClick={() => setService(null)}>Tất cả dịch vụ</Toggle>
          {services.map((t) => (
            <Toggle key={t.id} active={service === t.id} onClick={() => setService(service === t.id ? null : t.id)}>{t.name}</Toggle>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Toggle active solid>{spas.some((s) => s.distance !== null) ? "Gần nhất" : "Phù hợp"}</Toggle>
        <Toggle active={openOnly} onClick={() => setOpenOnly((v) => !v)}>Đang mở cửa</Toggle>
        <Toggle active={ratedOnly} onClick={() => setRatedOnly((v) => !v)}>★ 4,5+</Toggle>
      </div>

      {shown.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ pro, distance }, i) => (
            <SpaCard key={pro.id} spa={pro} distance={distance} index={i} listings={listingsOf(pro)} service={service} photo={state.works.find((w) => w.proId === pro.id && w.images[0])?.images[0]} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title={spas.length ? "Không có spa khớp bộ lọc" : "Chưa có spa ở khu vực này"}
            text={spas.length ? "Bỏ bớt bộ lọc để xem thêm spa." : "360đẹp đang mời thêm spa. Bạn có thể đặt Artist đến tận nơi."}
          />
        </div>
      )}
    </div>
  )
}

function Toggle({ active, solid, onClick, children }: { active: boolean; solid?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-full border px-4 text-meta font-semibold transition-colors",
        solid ? "border-ink bg-ink text-white" : active ? "border-accent bg-accent-soft text-accent-dark" : "border-line bg-surface text-ink hover:border-line-strong",
      )}
    >
      {children}
    </button>
  )
}

function SpaCard({ spa, distance, index, listings, service, photo }: { spa: Pro; distance: number | null; index: number; listings: ProService[]; service: string | null; photo?: string }) {
  const open = openState(spa.openingHours ?? [])
  const shown = (service ? listings.find((s) => s.templateId === service) : undefined) ?? [...listings].sort((a, b) => Math.min(...Object.values(a.prices)) - Math.min(...Object.values(b.prices)))[0]
  const template = shown ? getTemplate(shown.templateId) : undefined
  const variants = template?.variants.filter((v) => shown?.prices[v.id]) ?? []
  const first = variants[0]
  const [today, setToday] = React.useState<{ startsAt: string; time: string }[]>([])

  React.useEffect(() => {
    if (!shown || !first) return
    let live = true
    void actions.cartSlotBedsFor({ proId: spa.id, items: [{ template: shown.templateId, variant: first.id, quantity: 1 }], date: todayISO() }).then((r) => {
      if (live && r.ok) setToday(r.data.filter((s) => s.freeBeds > 0).slice(0, 4))
    })
    return () => {
      live = false
    }
  }, [spa.id, shown?.templateId, first?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const bookHref = (variant?: string, time?: string) => `/book/${spa.id}${shown ? `?service=${shown.templateId}&variant=${variant ?? first?.id ?? ""}${time ? `&date=${todayISO()}&time=${encodeURIComponent(time)}` : ""}` : ""}`

  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] bg-surface">
      <Link href={`/pros/${spa.id}${shown ? `?service=${shown.templateId}` : ""}`} className="relative block aspect-[16/10] bg-subtle">
        <Image src={photo ?? spaPhoto(index)} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
        {photo ? null : <IllustrationBadge className="left-2.5 top-2.5" />}
        {distance !== null ? <span className="absolute bottom-3 right-3 rounded-full bg-surface px-2.5 py-0.5 text-meta font-bold">{km(distance)}</span> : null}
      </Link>
      <div className="flex flex-col gap-3 p-5">
        <div>
          <Link href={`/pros/${spa.id}`} className="block truncate text-[20px] font-bold tracking-[-0.02em] hover:underline">{spa.name}</Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-meta text-ink-soft">
            <span className={cn("size-2 rounded-full", open.open ? "bg-success" : "bg-muted")} aria-hidden />
            {open.label}
            {distance === null ? ` · ${spa.district}` : ""}
          </p>
          <p className="text-meta text-ink-soft">
            {showsAverage(spa.rating.count) ? `★ ${spa.rating.average.toFixed(1).replace(".", ",")} (${spa.rating.count})` : "Spa mới"}
            {spa.stats.completedJobs > 0 ? ` · ${spa.stats.completedJobs} lịch đã xong` : ""}
          </p>
        </div>
        {template && variants.length ? (
          <div className="border-t border-line">
            {!service && listings.length > 1 ? <p className="pt-2.5 text-meta text-muted">{template.name} · và {listings.length - 1} dịch vụ khác</p> : null}
            {variants.slice(0, 3).map((v) => (
              <Link key={v.id} href={bookHref(v.id)} className="flex items-center justify-between gap-3 border-b border-line py-2.5 hover:bg-subtle/50">
                <span className="truncate">{v.label}</span>
                <span className="font-bold text-accent">{formatPrice(shown!.prices[v.id]!)}</span>
              </Link>
            ))}
          </div>
        ) : null}
        {today.length ? (
          <div>
            <p className="text-meta text-muted">Còn chỗ hôm nay</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {today.map((s) => (
                <Link key={s.startsAt} href={bookHref(undefined, s.time)} className="flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-accent-soft text-meta font-bold text-accent-dark hover:bg-[#F8DCE6]">
                  {s.time}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
