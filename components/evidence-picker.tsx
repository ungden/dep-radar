"use client"

import * as React from "react"
import { Film, ImagePlus, X } from "lucide-react"
import { VIDEO_MAX_MB, VIDEO_MAX_SECONDS, removeEvidence, uploadEvidenceVideo, uploadImage } from "@/lib/uploads"
import { cn } from "@/lib/utils"

interface Item {
  key: string
  preview: string
  video: boolean
  path?: string
  progress: number
  error?: string
}

/**
 * Photos and clips as evidence for a report. Each file goes up as soon as it
 * is picked, the same way as everywhere else: photos re-encoded on the device
 * (smaller, no GPS), clips checked for length and size with their location
 * removed, sent in resumable pieces. Only the reporter and the staff can open
 * them (private `evidence` bucket).
 */
export function EvidencePicker({
  max = 8,
  onChange,
  onBusyChange,
}: {
  /** Files this report can still take. */
  max?: number
  onChange: (paths: string[]) => void
  onBusyChange?: (busy: boolean) => void
}) {
  const [items, setItems] = React.useState<Item[]>([])
  const input = React.useRef<HTMLInputElement>(null)

  // The form above hears which files are up and whether any is still going.
  const paths = items.flatMap((i) => (i.path ? [i.path] : [])).join("|")
  const busy = items.some((i) => !i.path && !i.error)
  React.useEffect(() => onChange(paths ? paths.split("|") : []), [paths]) // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => onBusyChange?.(busy), [busy]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (key: string, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)))

  const pick = (files: FileList | null) => {
    if (!files) return
    const room = max - items.length
    const chosen = Array.from(files).slice(0, Math.max(room, 0))
    const added = chosen.map((file) => ({
      file,
      item: {
        key: crypto.randomUUID(),
        preview: URL.createObjectURL(file),
        video: file.type.startsWith("video/"),
        progress: 0,
      } satisfies Item,
    }))
    if (!added.length) return
    setItems((list) => [...list, ...added.map((a) => a.item)])
    for (const { file, item } of added) {
      const upload = item.video
        ? uploadEvidenceVideo(file, (f) => update(item.key, { progress: f }))
        : uploadImage("evidence", file)
      upload.then(
        (path) => update(item.key, { path, progress: 1 }),
        (err: unknown) => update(item.key, { error: err instanceof Error ? err.message : "Tải lên không thành công." }),
      )
    }
  }

  const remove = (item: Item) => {
    if (item.path) void removeEvidence([item.path])
    URL.revokeObjectURL(item.preview)
    setItems((list) => list.filter((i) => i.key !== item.key))
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.key} className="relative aspect-square overflow-hidden rounded-lg bg-subtle">
            {item.video ? (
              <video src={item.preview} muted playsInline className="size-full object-cover" />
            ) : (
              // A local preview of the picked file: a plain img.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.preview} alt="" className="size-full object-cover" />
            )}
            {item.video && <Film className="absolute left-1 top-1 size-4 text-white drop-shadow" />}
            {!item.path && !item.error && (
              <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-center text-[10px] text-white">
                {item.video ? `${Math.round(item.progress * 100)}%` : "Đang tải…"}
              </span>
            )}
            {item.error && (
              <span className="absolute inset-0 flex items-center bg-danger/85 p-1 text-center text-[10px] leading-tight text-white">{item.error}</span>
            )}
            <button
              type="button"
              aria-label="Bỏ tệp này"
              onClick={() => remove(item)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {items.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[11px] text-muted hover:bg-subtle",
            )}
          >
            <ImagePlus className="size-5" />
            Ảnh / clip
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        Tối đa {max} tệp. Clip dài tối đa {VIDEO_MAX_SECONDS} giây, dưới {VIDEO_MAX_MB} MB. Chỉ bạn và đội ngũ 360dep xem được.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/*,video/mp4,video/quicktime,video/webm"
        multiple
        hidden
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

/** Evidence already sent, through short-lived signed links: for the reporter and the staff. */
export function EvidenceGrid({ items }: { items: { path: string; url: string; video: boolean }[] }) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-2">
      {items.map((e) =>
        e.url ? (
          <a key={e.path} href={e.url} target="_blank" rel="noreferrer" className="relative block aspect-square overflow-hidden rounded-lg bg-subtle">
            {e.video ? (
              <>
                <video src={e.url} muted playsInline preload="metadata" className="size-full object-cover" />
                <Film className="absolute left-1 top-1 size-4 text-white drop-shadow" />
              </>
            ) : (
              // Short-lived signed links from a private bucket: a plain img, not next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.url} alt="Bằng chứng" className="size-full object-cover" />
            )}
          </a>
        ) : null,
      )}
    </div>
  )
}
