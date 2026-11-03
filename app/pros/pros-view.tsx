"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { DataUnavailable } from "@/components/data-unavailable"
import { MobileLinks } from "@/components/mobile-links"
import { ArtistCard, CitySelect, artistFromPrice } from "@/components/shop"
import { ButtonLink, EmptyState, PageSkeleton } from "@/components/ui"
import { CATEGORIES, categoryLabel, getTemplate } from "@/lib/catalog"
import { providerLocationOpen } from "@/lib/launch"
import { moveRadio } from "@/lib/radio-navigation"
import { distanceToCustomer, useApp } from "@/lib/store"
import { rankScore } from "@/lib/trust"
import type { CategoryId, ServiceTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Services in the side list before "Xem thêm"; the phone's row of chips swipes through all. */
const SIDE_FIRST = 8

export function ProsPageView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ChooseArtist />
    </Suspense>
  )
}

/**
 * The second way to book: pick the service, see who does it with their own
 * work and price, and choose. Only people taking bookings; nearest first when
 * we know the address. As the app's Artist tab (apps/mobile/src/app/(tabs)/artist.tsx).
 */
function ChooseArtist() {
  const state = useApp()
  const params = useSearchParams()
  const { city, session } = state
  const studioBookingOpen = state.platform?.studioBookingOpen

  const asked = params.get("service")
  const rawCategory = params.get("category")
  const category: CategoryId | null = CATEGORIES.some((c) => c.id === rawCategory) ? (rawCategory as CategoryId) : null

  // In the URL, so coming back from a profile keeps it. A plain history entry:
  // this filters what the page already has, nothing to fetch.
  const setService = (id: string | null) => {
    const next = new URLSearchParams(params.toString())
    next.delete("category")
    if (id) next.set("service", id)
    else next.delete("service")
    window.history.replaceState(null, "", `${window.location.pathname}${next.size ? `?${next}` : ""}`)
  }

  const isPro = session?.role === "pro"
  const kmOf = React.useCallback((proId: string) => (isPro ? null : distanceToCustomer(state, proId)), [isPro, state])

  const people = React.useMemo(
    () =>
      state.pros
        .filter((p) => providerLocationOpen(p, studioBookingOpen) && p.published && p.acceptingJobs && (!city || p.city === city))
        .map((pro) => ({ pro, km: kmOf(pro.id) }))
        .sort((a, b) => (a.km !== null && b.km !== null && a.km !== b.km ? a.km - b.km : rankScore(b.pro) - rankScore(a.pro))),
    [state.pros, studioBookingOpen, city, kmOf],
  )

  // The services someone here does, most people first; the one asked for stays even with nobody.
  const services = React.useMemo(() => {
    const here = new Set(people.map((p) => p.pro.id))
    const counts = new Map<string, number>()
    for (const s of state.proServices) {
      if (!s.active || !here.has(s.proId) || !Object.keys(s.prices).length || getTemplate(s.templateId)?.addon) continue
      counts.set(s.templateId, (counts.get(s.templateId) ?? 0) + 1)
    }
    if (asked && !counts.has(asked)) counts.set(asked, 0)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => getTemplate(id))
      .filter((t): t is ServiceTemplate => t !== undefined && (!category || t.category === category))
  }, [people, state.proServices, asked, category])

  const chosen = asked ? getTemplate(asked) : undefined
  const offersIt = (proId: string, templateId: string) => state.proServices.some((s) => s.proId === proId && s.templateId === templateId && s.active && Object.keys(s.prices).length > 0)
  const shown = people.filter(({ pro }) => (chosen ? offersIt(pro.id, chosen.id) : !category || pro.categories.includes(category)))

  // Work of the chosen service first, so the card answers "how do they do this".
  const worksOf = (proId: string) => state.works.filter((w) => w.proId === proId && w.images[0])
  const photosOf = (proId: string) =>
    [...worksOf(proId)]
      .sort((a, b) => Number(b.templateId === chosen?.id) - Number(a.templateId === chosen?.id))
      .slice(0, 3)
      .map((w) => w.images[0])
  const serviceNamesOf = (proId: string) =>
    state.proServices
      .filter((s) => s.proId === proId && s.active && Object.keys(s.prices).length > 0)
      .map((s) => getTemplate(s.templateId))
      .filter((t): t is ServiceTemplate => t !== undefined && !t.addon)
      .sort((a, b) => Number(b.id === chosen?.id) - Number(a.id === chosen?.id))
      .map((t) => t.name)

  const orderHref = chosen ? `/dat-lich?service=${chosen.id}` : category ? `/dat-lich?category=${category}` : "/dat-lich"
  const where = city ? ` ở ${city}` : " trên toàn quốc"
  const what = chosen ? ` làm ${chosen.name}` : category ? ` làm ${categoryLabel(category)}` : ""
  const [sideOpen, setSideOpen] = React.useState(false)
  const inSide = sideOpen || services.length <= SIDE_FIRST ? services : services.slice(0, SIDE_FIRST)
  // A service chosen from further down still shows, so the choice stays in sight.
  const side = chosen && !inSide.includes(chosen) && services.includes(chosen) ? [...inSide, chosen] : inSide

  return (
    <div className="roomy pt-5 md:pt-10">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0">
          <h1 className="text-[30px] font-bold tracking-[-0.03em]">Chọn Artist</h1>

          {/* A phone keeps the filters in one sideways row. */}
          <div role="radiogroup" aria-label="Dịch vụ" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
            <CitySelect value={city} variant="chip" />
            <ServiceChip label="Tất cả" active={!chosen} onPick={() => setService(null)} />
            {services.map((t) => (
              <ServiceChip key={t.id} label={t.name} active={chosen?.id === t.id} onPick={() => setService(t.id)} />
            ))}
          </div>

          <div className="mt-7 hidden space-y-7 lg:block">
            <div>
              <p className="mb-2 text-[16px] font-bold">Dịch vụ</p>
              <div role="radiogroup" aria-label="Dịch vụ" className="space-y-0.5">
                <ServiceRow label="Tất cả" active={!chosen} onPick={() => setService(null)} />
                {side.map((t) => (
                  <ServiceRow key={t.id} label={t.name} active={chosen?.id === t.id} onPick={() => setService(t.id)} />
                ))}
              </div>
              {services.length > SIDE_FIRST && (
                <button type="button" onClick={() => setSideOpen((v) => !v)} className="mt-1 inline-flex min-h-11 items-center px-4 text-meta font-semibold text-accent-dark hover:underline">
                  {sideOpen ? "Thu gọn" : `Xem thêm ${services.length - SIDE_FIRST} dịch vụ`}
                </button>
              )}
            </div>
            <div>
              <p className="mb-2 text-[16px] font-bold">Khu vực</p>
              <CitySelect value={city} />
            </div>
            <StillLooking href={orderHref} />
          </div>
        </aside>

        <div className="min-w-0">
          {state.catalogError ? (
            <DataUnavailable />
          ) : shown.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-meta text-muted md:text-[16px]">
                  {shown.length.toLocaleString("vi-VN")} Artist{what}
                  {where}
                </p>
                <p className="text-meta font-bold md:text-[16px]">{!isPro && state.customerAddress ? "Gần bạn trước" : "Đánh giá cao trước"}</p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
                {shown.map(({ pro, km }, i) => (
                  <li key={pro.id}>
                    <ArtistCard
                      pro={pro}
                      photos={photosOf(pro.id)}
                      photoCount={worksOf(pro.id).length}
                      services={serviceNamesOf(pro.id)}
                      illustrationOf={chosen?.category ?? category ?? pro.categories[0] ?? "nail"}
                      price={artistFromPrice(state.proServices, pro.id, chosen?.id, studioBookingOpen)}
                      km={km}
                      priority={i < 3}
                      href={`/pros/${pro.id}${chosen ? `?album=${chosen.category}` : category ? `?album=${category}` : ""}`}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-meta text-muted">Xếp theo đánh giá thật, số lịch đã làm và trạng thái xác minh danh tính. Không ai trả tiền để lên đầu.</p>
            </>
          ) : (
            <div className="rounded-[var(--radius-xl)] bg-surface">
              <EmptyState
                title={chosen || category ? `Chưa có Artist${what}${where}` : `Chưa có Artist nào${where}`}
                text="Bạn vẫn đặt được theo dịch vụ, Artist mới vào sẽ thấy đơn của bạn."
                action={<ButtonLink href={orderHref} className="rounded-[var(--radius-md)] shadow-none">Đặt theo dịch vụ</ButtonLink>}
              />
            </div>
          )}
          <StillLooking href={orderHref} className="mt-5 lg:hidden" />
        </div>
      </div>
      <MobileLinks className="mt-10" />
    </div>
  )
}

function ServiceRow({ label, active, onPick }: { label: string; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      onKeyDown={(e) => moveRadio(e, onPick)}
      onClick={onPick}
      className={cn("flex min-h-11 w-full items-center rounded-xl px-4 py-2 text-left text-[16px] leading-snug transition-colors", active ? "bg-accent font-semibold text-white" : "font-medium text-ink hover:bg-subtle")}
    >
      {label}
    </button>
  )
}

function ServiceChip({ label, active, onPick }: { label: string; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      onKeyDown={(e) => moveRadio(e, onPick)}
      onClick={onPick}
      className={cn("inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-meta font-semibold transition-colors", active ? "bg-accent text-white" : "bg-surface text-ink")}
    >
      {label}
    </button>
  )
}

/** Not everyone wants to choose: the other way to book, one tap from any list. */
function StillLooking({ href, className }: { href: string; className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] bg-highlight-soft p-5", className)}>
      <p className="text-body font-bold">Chưa thấy ai hợp ý?</p>
      <p className="mt-1 text-meta text-ink-soft">Đặt theo dịch vụ, Artist sẽ vào nhận đơn.</p>
      <Link href={href} className="mt-3.5 inline-flex h-11 items-center rounded-full bg-surface px-[18px] text-meta font-bold text-accent-dark hover:bg-white/70">
        Đặt ngay
      </Link>
    </div>
  )
}
