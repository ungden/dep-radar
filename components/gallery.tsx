"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BeforeAfter } from "@/components/before-after"
import type { Work } from "@/lib/types"
import { cn } from "@/lib/utils"

type Slide =
  | { type: "video"; src: string; poster?: string }
  | { type: "compare"; before: string; after: string }
  | { type: "image"; src: string }

/** What a post shows, in order: its clip first, then a before/after pair, then the rest. */
export function slidesOf(work: Pick<Work, "images" | "video" | "kind">): Slide[] {
  const slides: Slide[] = []
  if (work.video) slides.push({ type: "video", src: work.video, poster: work.images[0] })
  if (work.kind === "before_after" && work.images.length >= 2) {
    slides.push({ type: "compare", before: work.images[0], after: work.images[1] })
    work.images.slice(2).forEach((src) => slides.push({ type: "image", src }))
  } else {
    work.images.forEach((src) => slides.push({ type: "image", src }))
  }
  return slides
}

/** Keys typed into a field, or used by a control that owns the arrows, are not ours. */
function ownsArrows(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target.closest("input, textarea, select, [role=tablist], [role=radiogroup], video")) return true
  return false
}

/**
 * A post's photos, full width and swiped sideways (CSS scroll snap, so it is
 * the browser's own momentum). Dots show where you are; on a computer the
 * arrow keys and two buttons do the same.
 */
export function Gallery({
  work,
  sizes = "100vw",
  className,
  overlay,
}: {
  work: Pick<Work, "images" | "video" | "kind" | "title">
  sizes?: string
  className?: string
  /** Buttons laid over the top of the photo (back, share, save). */
  overlay?: React.ReactNode
}) {
  const slides = slidesOf(work)
  const [index, setIndex] = React.useState(0)
  const scroller = React.useRef<HTMLDivElement>(null)
  const count = slides.length

  const go = React.useCallback(
    (i: number) => {
      const el = scroller.current
      if (!el) return
      const next = Math.max(0, Math.min(count - 1, i))
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
    },
    [count],
  )

  React.useEffect(() => {
    if (count < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || ownsArrows(e.target)) return
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const el = scroller.current
      if (!el) return
      e.preventDefault()
      const current = Math.round(el.scrollLeft / el.clientWidth)
      go(current + (e.key === "ArrowRight" ? 1 : -1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [count, go])

  const caption = slides[index]?.type === "compare"

  return (
    <div className={className}>
      <div
        className="relative overflow-hidden bg-subtle md:rounded-[var(--radius-lg)]"
        role="region"
        aria-roledescription="carousel"
        aria-label={`Ảnh của ${work.title}`}
      >
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== index) setIndex(i)
          }}
          className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {slides.map((s, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              className="relative h-full w-full shrink-0 snap-center snap-always"
            >
              {s.type === "video" ? (
                <video
                  src={s.src}
                  poster={s.poster}
                  playsInline
                  controls
                  muted
                  loop
                  preload="metadata"
                  className="h-full w-full bg-accent object-contain"
                >
                  <track kind="captions" />
                </video>
              ) : s.type === "compare" ? (
                <BeforeAfter before={s.before} after={s.after} alt={work.title} priority={i === 0} sizes={sizes} />
              ) : (
                <Image
                  src={s.src}
                  alt={count > 1 ? `${work.title}, ảnh ${i + 1}` : work.title}
                  fill
                  priority={i === 0}
                  sizes={sizes}
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {overlay}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-[var(--shadow-raised)] transition-opacity disabled:opacity-0 md:inline-flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-[var(--shadow-raised)] transition-opacity disabled:opacity-0 md:inline-flex"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {(count > 1 || caption) && (
        <div className="mt-3 flex h-5 items-center justify-between px-4 text-[13px] font-semibold text-ink-soft md:px-0">
          <span className={cn("w-12", !caption && "invisible")}>Trước</span>
          {count > 1 ? (
            <span className="flex items-center gap-1.5" aria-hidden>
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  onClick={() => go(i)}
                  className={cn("rounded-full transition-all", i === index ? "h-2 w-5 bg-accent" : "size-2 bg-subtle-strong hover:bg-muted")}
                />
              ))}
            </span>
          ) : (
            <span />
          )}
          <span className={cn("w-12 text-right", !caption && "invisible")}>Sau</span>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {count > 1 ? `Ảnh ${index + 1} trên ${count}` : ""}
      </p>
    </div>
  )
}
