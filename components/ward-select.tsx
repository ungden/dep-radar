"use client"

import * as React from "react"
import { Check, ChevronDown, LocateFixed, MapPin } from "lucide-react"
import { Sheet } from "@/components/sheet"
import { inputClass } from "@/components/ui"
import { LOCATION_DENIED, LOCATION_FAILED } from "@/lib/chat-location"
import { isLegacyDistrict, searchWards, wardOfPoint } from "@/lib/geo"
import { cn } from "@/lib/utils"

export interface WardChoice {
  city: string
  district: string
  /** Set when it came from the browser's position: the exact point, not the ward's centre. */
  point?: { lat: number; lng: number }
}

/**
 * The phường / xã of an address (lib/geo.ts). A city has a hundred or more, so
 * it is a search, not a dropdown: today's name or the old quận and phường it
 * was formed from both find it. "Dùng vị trí hiện tại" picks the ward from the
 * browser and keeps the exact point. Not inside a <label>: the sheet would
 * re-open on every click in it.
 */
export function WardSelect({
  city,
  value,
  onChange,
  locate,
  label = "Phường/xã",
  className,
}: {
  city: string
  value: string
  onChange: (choice: WardChoice) => void
  /** Offer "Dùng vị trí hiện tại" (addresses; not where a freelancer is based). */
  locate?: boolean
  label?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [locating, setLocating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const results = React.useMemo(() => searchWards(city, query), [city, query])
  const legacy = Boolean(value) && isLegacyDistrict(city, value)
  const labelId = React.useId()
  const search = React.useRef<HTMLInputElement>(null)

  // The sheet stays mounted, so autoFocus would only fire once: focus on every open.
  React.useEffect(() => {
    if (open) requestAnimationFrame(() => search.current?.focus())
  }, [open])

  const close = () => {
    setOpen(false)
    setQuery("")
    setError(null)
  }
  const pick = (choice: WardChoice) => {
    onChange(choice)
    close()
  }

  const useHere = () => {
    if (!("geolocation" in navigator)) return setError(LOCATION_FAILED)
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const point = { lat: position.coords.latitude, lng: position.coords.longitude }
        const ward = wardOfPoint([point.lat, point.lng])
        if (!ward) return setError("Vị trí này ngoài khu vực 360dep đang phục vụ (Hà Nội, TP.HCM, Đà Nẵng).")
        pick({ ...ward, point })
      },
      (failure) => {
        setLocating(false)
        setError(failure.code === failure.PERMISSION_DENIED ? LOCATION_DENIED : LOCATION_FAILED)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  return (
    <div className={className}>
      <span id={labelId} className="mb-1.5 block text-meta font-semibold text-ink">
        {label}
      </span>
      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(inputClass, "flex items-center gap-2 text-left text-body", legacy && "border-accent")}
      >
        <MapPin className={cn("size-4 shrink-0", value ? "text-accent" : "text-muted")} />
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-muted")}>{value || "Chọn phường/xã"}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>
      {legacy && (
        <span className="mt-1 block text-label text-accent">
          &ldquo;{value}&rdquo; là quận cũ, không còn trên địa chỉ từ 1/7/2025. Chọn phường/xã mới.
        </span>
      )}

      <Sheet open={open} onClose={close} title={`${label} ở ${city}`}>
        <p className="text-label text-muted">Theo địa chỉ mới từ 1/7/2025. Gõ tên phường, xã, hoặc quận cũ.</p>
        <input
          ref={search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ví dụ: Bến Thành, Quận 1, Thủ Dầu Một"
          aria-label="Tìm phường, xã"
          className={cn(inputClass, "mt-2 text-body")}
        />
        {locate && (
          <button
            type="button"
            onClick={useHere}
            disabled={locating}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-meta font-semibold text-accent disabled:opacity-60"
          >
            <LocateFixed className="size-4" /> {locating ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}
          </button>
        )}
        {error && (
          <p role="alert" className="mt-1 text-label text-danger">
            {error}
          </p>
        )}
        <ul className="mt-2 divide-y divide-line">
          {results.map((w) => (
            <li key={w.name}>
              <button
                type="button"
                aria-pressed={w.name === value}
                onClick={() => pick({ city, district: w.name })}
                className="flex w-full items-center gap-3 py-3 text-left hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-body", w.name === value ? "font-bold" : "font-medium")}>{w.name}</span>
                  {w.formerly && <span className="line-clamp-2 block text-label text-muted">Trước đây: {w.formerly}</span>}
                </span>
                {w.name === value && <Check className="size-4 shrink-0 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <p className="py-6 text-body text-ink-soft">
            Không thấy &ldquo;{query}&rdquo; ở {city}. Thử tên phường cũ hoặc tên quận.
          </p>
        )}
      </Sheet>
    </div>
  )
}
