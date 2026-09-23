"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, MapPin, PackageCheck, Users, X } from "lucide-react"
import { ProCard } from "@/components/beauty"
import { CategoryTag, TradeDot } from "@/components/trade"
import { ButtonLink } from "@/components/ui"
import { getVertical, verticalOf } from "@/lib/catalog"
import { getOccasion, OCCASIONS, occasionTemplates } from "@/lib/occasions"
import { fromPrice, getPro, useApp, type AppState } from "@/lib/store"
import { excludes, personWord, placeLabel, priceBand } from "@/lib/trade"
import { rankScore } from "@/lib/trust"
import type { Pro, ServiceTemplate } from "@/lib/types"
import { cn, formatPrice } from "@/lib/utils"

/** Desktop collage on a 3 x 2 grid: the first photo tall, the rest filling the grid without holes. */
function collageSpan(i: number, n: number) {
  if (n === 1) return "md:col-span-3 md:row-span-2"
  if (i === 0) return "md:row-span-2"
  if (n === 2) return "md:col-span-2 md:row-span-2"
  if (n === 3) return "md:col-span-2"
  if (n === 4 && i === 3) return "md:col-span-2"
  return ""
}

/** Published freelancers who list this exact service, best first. */
function providersOf(state: AppState, templateId: string) {
  const seen = new Set<string>()
  const list: Pro[] = []
  for (const s of state.proServices) {
    if (s.templateId !== templateId || !s.active || seen.has(s.proId)) continue
    const pro = getPro(state, s.proId)
    if (!pro?.published) continue
    seen.add(pro.id)
    list.push(pro)
  }
  return list.sort((a, b) => rankScore(b) - rankScore(a))
}

export function OccasionView({ occasionId }: { occasionId: string }) {
  const state = useApp()
  const router = useRouter()
  const occasion = getOccasion(occasionId)!
  const templates = occasionTemplates(occasion)
  const trades = [...new Set(templates.map((t) => verticalOf(t.category)))]
  const city = state.city

  // Real work for the exact services first, in the city being browsed first.
  const photos = React.useMemo(() => {
    const ids = new Set(occasion.templates)
    const categories = new Set(templates.map((t) => t.category))
    const local = (proId: string) => !city || getPro(state, proId)?.city === city
    const ranked = [
      ...state.works.filter((w) => ids.has(w.templateId) && local(w.proId)),
      ...state.works.filter((w) => ids.has(w.templateId) && !local(w.proId)),
      ...state.works.filter((w) => !ids.has(w.templateId) && categories.has(w.category)),
    ]
    const seen = new Set<string>()
    const out: { src: string; workId: string; title: string }[] = []
    for (const w of ranked) {
      const src = w.kind === "before_after" && w.images[1] ? w.images[1] : w.images[0]
      if (!src || seen.has(src)) continue
      seen.add(src)
      out.push({ src, workId: w.id, title: w.title })
      if (out.length === 5) break
    }
    return out
  }, [state, occasion, templates, city])

  const others = OCCASIONS.filter((o) => o.id !== occasion.id)

  return (
    <div className="pt-1 md:pt-10">
      <button
        type="button"
        aria-label="Quay lại"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="-ml-3 inline-flex size-11 items-center justify-center md:hidden"
      >
        <ChevronLeft className="size-6" />
      </button>

      {/* Hero */}
      <header className="md:grid md:grid-cols-[1fr_1.05fr] md:items-center md:gap-12">
        <div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-ink-soft">
            <span className="text-ink">Theo dịp</span>
            {trades.map((v) => (
              <span key={v} className="inline-flex items-center gap-1.5">
                <TradeDot vertical={v} />
                {getVertical(v).label}
              </span>
            ))}
          </p>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[48px]">{occasion.title}</h1>
          <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-soft">{occasion.subtitle}.</p>
          {occasion.months.length > 0 && (
            <p className="mt-3 text-[14px] text-muted">Mùa cao điểm: tháng {occasion.months.join(", ")}</p>
          )}
        </div>

        {photos.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:mt-0 md:grid md:h-[380px] md:grid-cols-3 md:grid-rows-2 md:gap-2.5 md:overflow-visible md:px-0">
            {photos.map((p, i) => (
              <Link
                key={p.src}
                href={`/works/${p.workId}`}
                className={cn(
                  "group relative aspect-[4/5] w-[140px] shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-subtle md:aspect-auto md:w-auto",
                  collageSpan(i, photos.length),
                )}
              >
                <Image
                  src={p.src}
                  alt={p.title}
                  fill
                  priority={i < 2}
                  sizes="(min-width: 768px) 220px, 140px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* How a combo is booked */}
      {templates.length > 1 && (
        <section className="mt-8 flex gap-4 rounded-[var(--radius-xl)] bg-subtle p-5 md:mt-12 md:p-6">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-surface sm:inline-flex">
            <Users className="size-5" />
          </span>
          <div>
            <h2 className="text-[17px] font-bold tracking-tight">Đặt nhiều người cho một buổi</h2>
            <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
              Mỗi người làm là một lịch hẹn riêng: bạn đặt từng người cho cùng giờ, cùng địa điểm. Khi đặt, chọn “Đặt chung
              một buổi” để các lịch hẹn được gắn với nhau. Mỗi người vẫn tự nhận lịch của mình.
            </p>
          </div>
        </section>
      )}

      <section className="mt-10 md:mt-14">
        <h2 className="text-[24px] font-bold tracking-tight md:text-[32px]">Cần những ai</h2>
        <p className="mt-1 text-[15px] text-ink-soft">
          Theo thứ tự trong buổi{city ? `, với người làm ở ${city}` : ""}.
        </p>
        <ol className="mt-6 space-y-12 md:mt-8 md:space-y-16">
          {templates.map((t, i) => (
            <Step key={t.id} index={i + 1} template={t} state={state} city={city} />
          ))}
        </ol>
      </section>

      {others.length > 0 && (
        <nav className="mt-14 border-t border-line pt-8" aria-label="Dịp khác">
          <h2 className="text-[20px] font-bold tracking-tight">Dịp khác</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dip/${o.id}`}
                  className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-[14px] font-medium hover:border-ink/30"
                >
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}

function Step({ index, template: t, state, city }: { index: number; template: ServiceTemplate; state: AppState; city: string | null }) {
  const all = providersOf(state, t.id)
  const local = all.filter((p) => !city || p.city === city)
  const band = priceBand(t)
  const who = personWord([t.category])
  return (
    <li>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-[15px] font-bold text-white">
              {index}
            </span>
            <CategoryTag category={t.category} href={`/search?category=${t.category}`} />
          </div>
          <h3 className="mt-3 text-[20px] font-bold leading-snug tracking-tight md:text-[24px]">{t.name}</h3>
          <p className="mt-1 text-[15px] text-ink-soft">{t.description}</p>
          {band && (
            <p className="mt-3 text-[15px]">
              <span className="text-muted">Khung giá </span>
              <span className="font-bold">
                {formatPrice(band[0])} – {formatPrice(band[1])}
              </span>
            </p>
          )}
          <ul className="mt-3 space-y-1.5 text-[14px] text-ink">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
              {placeLabel(t)}
            </li>
            {t.deliverable && (
              <li className="flex items-start gap-2">
                <PackageCheck className="mt-0.5 size-4 shrink-0 text-muted" />
                {t.deliverable}
                {t.deliveryDays ? `, giao trong ${t.deliveryDays} ngày` : ""}
              </li>
            )}
            {t.includes.map((x) => (
              <li key={x} className="flex items-start gap-2">
                {excludes(x) ? <X className="mt-0.5 size-4 shrink-0 text-muted" /> : <Check className="mt-0.5 size-4 shrink-0 text-success" />}
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 md:mt-0">
          {local.length ? (
            <>
              <ul className="grid gap-3 sm:grid-cols-2">
                {local.slice(0, 4).map((p) => {
                  const price = fromPrice(state, p.id, t.id)
                  return (
                    <li key={p.id} className="flex flex-col">
                      <ProCard pro={p} className="flex-1 rounded-b-none" />
                      <div className="flex items-center justify-between gap-3 rounded-b-[var(--radius-lg)] border border-t-0 border-line bg-surface px-3 py-2.5">
                        <p className="min-w-0 truncate text-[13px] text-ink-soft">
                          {price !== null ? (
                            <>
                              Dịch vụ này từ <span className="font-bold text-ink">{formatPrice(price)}</span>
                            </>
                          ) : (
                            t.name
                          )}
                        </p>
                        <ButtonLink href={`/book/${p.id}?service=${t.id}`} size="sm" className="shrink-0 px-5">
                          Đặt
                        </ButtonLink>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {local.length > 4 && (
                <Link
                  href={`/search?category=${t.category}&tab=pros`}
                  className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-4 hover:underline"
                >
                  Xem tất cả {local.length} {who}
                </Link>
              )}
            </>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong px-5 py-8 text-center">
              <p className="text-[15px] font-bold">
                Chưa có ai {city ? `ở ${city} ` : ""}nhận “{t.name}”
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[14px] text-ink-soft">
                {all.length > 0
                  ? `Có ${all.length} ${who} ở thành phố khác đang nhận dịch vụ này. Hoặc đăng yêu cầu: người làm quanh bạn được báo, ai nhận trước sẽ làm.`
                  : "Đăng yêu cầu: khi có người làm việc này quanh bạn, họ được báo và ai nhận trước sẽ làm."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <ButtonLink href={`/requests/new?service=${t.id}`} size="sm">
                  Đăng yêu cầu
                </ButtonLink>
                {all.length > 0 && (
                  <ButtonLink href={`/search?category=${t.category}&city=all&tab=pros`} variant="outline" size="sm">
                    Xem cả nước
                  </ButtonLink>
                )}
              </div>
              <p className="mt-3 text-[13px] text-ink-soft">
                <Link href="/login?role=pro" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink">
                  Bạn làm nghề này? Mở hồ sơ
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
