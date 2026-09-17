"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bookmark, ChevronLeft, Clock, Heart, MessageCircle, Share2 } from "lucide-react"
import { FollowButton } from "@/components/follow-button"
import { TrustedBadge, VerifiedMark } from "@/components/trust"
import { WorkCard } from "@/components/beauty"
import { Avatar, ButtonLink, Card, Pill } from "@/components/ui"
import { getTemplate } from "@/lib/catalog"
import { categoryLabel, getWork, worksByPro } from "@/lib/data"
import { actions, proView, servicesOf, useApp } from "@/lib/store"
import { cn, formatDuration, formatPrice } from "@/lib/utils"

export function WorkDetail({ workId }: { workId: string }) {
  const router = useRouter()
  const state = useApp()
  const work = getWork(workId)!
  const pro = proView(state, work.proId)!
  const tpl = getTemplate(work.templateId)!
  const listing = servicesOf(state, pro.id).find((x) => x.templateId === work.templateId)
  const offered = listing ? tpl.variants.filter((v) => listing.prices[v.id] !== undefined) : []
  const saved = state.savedWorks.includes(work.id)
  const [index, setIndex] = React.useState(0)
  const [liked, setLiked] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const scroller = React.useRef<HTMLDivElement>(null)
  const others = worksByPro(pro.id).filter((w) => w.id !== work.id)

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: work.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      // user dismissed share sheet
    }
  }

  return (
    <div className="-mx-4 md:mx-0 md:pt-6">
      <div className="md:grid md:grid-cols-[1.1fr_1fr] md:gap-10">
        {/* Gallery */}
        <div className="relative md:overflow-hidden md:rounded-3xl">
          <div
            ref={scroller}
            onScroll={(e) => {
              const el = e.currentTarget
              setIndex(Math.round(el.scrollLeft / el.clientWidth))
            }}
            className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto md:aspect-square"
          >
            {work.images.map((src, i) => (
              <div key={src + i} className="relative h-full w-full shrink-0 snap-center bg-blush">
                <Image src={src} alt={`${work.title} ${i + 1}`} fill priority={i === 0} sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label="Quay lại"
            onClick={() => router.back()}
            className="absolute left-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/85 backdrop-blur md:hidden"
          >
            <ChevronLeft className="size-5" />
          </button>
          {work.images.length > 1 && (
            <>
              <span className="absolute bottom-8 right-4 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white md:bottom-4">
                {index + 1}/{work.images.length}
              </span>
              <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 gap-1.5 md:bottom-4 md:flex">
                {work.images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ảnh ${i + 1}`}
                    onClick={() => scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: "smooth" })}
                    className={cn("size-2 rounded-full", i === index ? "bg-white" : "bg-white/50")}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="relative -mt-5 rounded-t-3xl bg-canvas px-4 pt-5 md:mt-0 md:rounded-none md:bg-transparent md:px-0 md:pt-2">
          <Pill>{categoryLabel(work.category)}</Pill>
          <h1 className="mt-2 text-xl font-semibold md:text-3xl">{work.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{work.description}</p>

          <div className="mt-5 flex items-center gap-3">
            <Link href={`/pros/${pro.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={pro.name} tone={pro.tone} src={pro.avatar} size={44} />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {pro.name}
                  <VerifiedMark pro={pro} />
                  <TrustedBadge pro={pro} />
                </span>
                <span className="block text-xs text-muted">
                  ★ {pro.rating.average.toFixed(1)} ({pro.rating.count}) · {pro.stats.completedJobs} job hoàn thành
                </span>
              </span>
            </Link>
            <FollowButton proId={pro.id} />
          </div>

          <div className="mt-5 flex items-center gap-5 border-y border-line py-3 text-sm text-ink-soft">
            <button type="button" onClick={() => setLiked((v) => !v)} className="inline-flex items-center gap-1.5" aria-pressed={liked}>
              <Heart className={cn("size-5", liked && "fill-rose text-rose")} /> {work.likes + (liked ? 1 : 0)}
            </button>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-5" /> {work.comments}
            </span>
            <button type="button" onClick={() => actions.toggleSaveWork(work.id)} className="inline-flex items-center gap-1.5" aria-pressed={saved}>
              <Bookmark className={cn("size-5", saved && "fill-rose text-rose")} /> {saved ? "Đã lưu" : "Lưu"}
            </button>
            <button type="button" onClick={share} className="ml-auto inline-flex items-center gap-1.5">
              <Share2 className="size-5" /> {copied ? "Đã chép link" : "Chia sẻ"}
            </button>
          </div>

          <Card className="mt-5 p-4">
            <p className="text-sm font-semibold">Muốn làm mẫu này?</p>
            <p className="mt-0.5 text-[13px] text-muted">Đặt lịch với {pro.name}</p>
            <p className="mt-3 text-sm font-medium">{tpl.name}</p>
            {listing ? (
              <ul className="mt-2 divide-y divide-line rounded-xl bg-canvas px-3">
                {offered.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      {v.label}
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted">
                        <Clock className="size-3.5" />
                        {formatDuration(v.durationMin)}
                      </span>
                    </span>
                    <Link href={`/book/${pro.id}?service=${tpl.id}&variant=${v.id}`} className="font-semibold text-rose">
                      {formatPrice(listing.prices[v.id])} →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Chuyên viên tạm ngưng dịch vụ này.</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ButtonLink href={`/pros/${pro.id}?tab=services`} variant="outline">
                Bảng giá đầy đủ
              </ButtonLink>
              {listing ? (
                <ButtonLink href={`/book/${pro.id}?service=${tpl.id}&variant=${offered[0].id}`}>Đặt lịch ngay</ButtonLink>
              ) : (
                <ButtonLink href={`/pros/${pro.id}?tab=services`}>Chọn dịch vụ khác</ButtonLink>
              )}
            </div>
          </Card>
        </div>
      </div>

      {others.length > 0 && (
        <section className="mt-10 px-4 md:px-0">
          <h2 className="mb-3 text-lg font-semibold">Tác phẩm khác của {pro.name}</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
            {others.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
