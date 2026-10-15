"use client"

import * as React from "react"
import { supabaseBrowser } from "@/lib/supabase/client"
import { uploadImage } from "@/lib/uploads"
import { cn } from "@/lib/utils"

export type RefUpload = { path: string; preview: string }

/**
 * Adding 1 to 3 reference photos ("ảnh mẫu"): each is uploaded to the private
 * references bucket as it is chosen, and the caller sends the paths with the
 * request or booking.
 */
export function ReferenceUpload({ value, onChange, onError }: { value: RefUpload[]; onChange: (refs: RefUpload[]) => void; onError: (message: string) => void }) {
  const [busy, setBusy] = React.useState(false)
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((r) => (
        <span key={r.path} className="relative block size-20 overflow-hidden rounded-lg bg-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.preview} alt="Ảnh mẫu" className="size-full object-cover" />
          <button
            type="button"
            aria-label="Bỏ ảnh này"
            onClick={() => onChange(value.filter((x) => x.path !== r.path))}
            className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-label text-white"
          >
            ✕
          </button>
        </span>
      ))}
      {value.length < 3 && (
        <label className={cn("flex size-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line text-label text-ink-soft", busy && "opacity-50")}>
          {busy ? "Đang tải…" : "+ Thêm ảnh"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={async (e) => {
              const files = [...(e.target.files ?? [])].slice(0, 3 - value.length)
              e.target.value = ""
              if (!files.length) return
              setBusy(true)
              try {
                const added = await Promise.all(files.map(async (f) => ({ path: await uploadImage("references", f), preview: URL.createObjectURL(f) })))
                onChange([...value, ...added].slice(0, 3))
              } catch (err) {
                onError(err instanceof Error ? err.message : "Chưa tải được ảnh mẫu.")
              }
              setBusy(false)
            }}
          />
        </label>
      )}
    </div>
  )
}

/** Sent reference photos, signed for the reader (the storage policies decide who). Nothing when there are none. */
export function ReferenceGallery({ paths, title, className }: { paths: string[]; title: string; className?: string }) {
  const [urls, setUrls] = React.useState<string[]>([])
  const key = paths.join("|")
  React.useEffect(() => {
    if (!key) return
    let live = true
    void supabaseBrowser()
      .storage.from("references")
      .createSignedUrls(key.split("|"), 60 * 60)
      .then(({ data }) => {
        if (live) setUrls((data ?? []).flatMap((d) => (d.signedUrl ? [d.signedUrl] : [])))
      })
    return () => {
      live = false
    }
  }, [key])
  if (!paths.length) return null
  return (
    <div className={className}>
      <p className="text-meta font-semibold">{title}</p>
      <div className="mt-2 grid max-w-sm grid-cols-3 gap-2">
        {urls.map((u) => (
          <a key={u} href={u} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="Ảnh mẫu" className="aspect-square w-full rounded-lg bg-subtle object-cover" />
          </a>
        ))}
      </div>
    </div>
  )
}
