"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronsLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Before and after, one over the other, with a handle to drag between them.
 * The handle is a real range input, so it works with a keyboard (arrow keys)
 * and a screen reader announces how much of each photo is showing. Left of the
 * handle is "before", right is "after"; the labels sit under the photo, not on it.
 */
export function BeforeAfter({
  before,
  after,
  alt,
  priority,
  sizes = "100vw",
  className,
}: {
  before: string
  after: string
  alt: string
  priority?: boolean
  sizes?: string
  className?: string
}) {
  const [value, setValue] = React.useState(50)
  const dragging = React.useRef(false)
  const id = React.useId()
  const moveTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    setValue(Math.round(Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100))))
  }
  return (
    // pan-y: a sideways drag that starts here moves the handle instead of
    // swiping the gallery this sits in. The pointer is handled here (Safari
    // only lets a range input be dragged by its thumb); the input below is for
    // the keyboard and screen readers.
    <div
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        moveTo(e)
      }}
      onPointerMove={(e) => dragging.current && moveTo(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      className={cn(
        "relative h-full w-full cursor-ew-resize touch-pan-y select-none overflow-hidden bg-subtle",
        "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-4 has-[input:focus-visible]:outline-white",
        className,
      )}
    >
      <Image src={after} alt={`${alt}: sau`} fill priority={priority} sizes={sizes} draggable={false} className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
        <Image src={before} alt={`${alt}: trước`} fill priority={priority} sizes={sizes} draggable={false} className="object-cover" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white" style={{ left: `${value}%` }}>
        <span className="absolute left-1/2 top-1/2 inline-flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-raised)]">
          <ChevronsLeftRight className="size-5" />
        </span>
      </div>
      <label htmlFor={id} className="sr-only">
        So sánh trước và sau: kéo sang trái để xem ảnh sau, sang phải để xem ảnh trước
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        aria-valuetext={`${value}% ảnh trước, ${100 - value}% ảnh sau`}
        className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent opacity-0"
      />
    </div>
  )
}
