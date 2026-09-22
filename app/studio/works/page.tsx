"use client"

import * as React from "react"
import Image from "next/image"
import { Columns2, Film, ImagePlus, Play, Trash2, X } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Button, Card, EmptyState, Field, PageHeader, inputClass } from "@/components/ui"
import { deleteWork, saveWork } from "@/lib/api/actions"
import { getTemplate } from "@/lib/catalog"
import { useApp, useRefresh, worksOf } from "@/lib/store"
import { servicesOf } from "@/lib/store"
import { uploadImage, uploadVideo, VIDEO_MAX_SECONDS } from "@/lib/uploads"
import { cn } from "@/lib/utils"

export default function StudioWorksPage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <PageHeader title="Tác phẩm" back="/studio" />
      <RequireSession role="pro">
        <WorksManager />
      </RequireSession>
    </div>
  )
}

function WorksManager() {
  const state = useApp()
  const refresh = useRefresh()
  const proId = state.session!.proId!
  const works = worksOf(state, proId)
  const listings = servicesOf(state, proId, true)
  const [adding, setAdding] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  return (
    <>
      <p className="mb-4 rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px] text-ink-soft">
        Tác phẩm là thứ khách xem đầu tiên. Chỉ đăng ảnh, clip do chính bạn làm: nội dung lấy trên mạng sẽ bị gỡ và có thể
        bị khoá hồ sơ. Ảnh và clip được xoá thông tin vị trí trước khi tải lên.
      </p>

      {listings.length === 0 && (
        <p className="mb-4 rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
          Thêm ít nhất một dịch vụ trước, để gắn tác phẩm vào đúng dịch vụ.
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {adding && listings.length > 0 && (
        <WorkForm
          templateIds={listings.map((l) => l.templateId)}
          onDone={() => {
            setAdding(false)
            refresh()
          }}
          onError={setError}
        />
      )}

      {!adding && (
        <Button className="mb-4" disabled={!listings.length} onClick={() => setAdding(true)}>
          <ImagePlus className="size-4" /> Thêm tác phẩm
        </Button>
      )}

      {works.length === 0 ? (
        <EmptyState
          icon={<ImagePlus className="size-6" />}
          title="Chưa có tác phẩm nào"
          text="Hồ sơ chỉ hiện với khách khi có ít nhất một ảnh tác phẩm."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {works.map((work) => (
            <li key={work.id}>
              <Card className="overflow-hidden">
                <div className="relative aspect-[4/5] bg-subtle">
                  <Image src={work.images[work.kind === "before_after" ? 1 : 0] ?? work.images[0]} alt={work.title} fill sizes="200px" className="object-cover" />
                  {(work.video || work.kind === "before_after") && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white">
                      {work.video ? (
                        <>
                          <Play className="size-3 fill-white" /> Clip
                        </>
                      ) : (
                        "Trước / sau"
                      )}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[14px] font-semibold">{work.title}</p>
                  <p className="truncate text-xs text-muted">{getTemplate(work.templateId)?.name}</p>
                  <button
                    type="button"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
                    onClick={async () => {
                      const result = await deleteWork(work.dbId)
                      if (!result.ok) return setError(result.error)
                      refresh()
                    }}
                  >
                    <Trash2 className="size-3.5" /> Xoá
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

type PostKind = "photos" | "before_after" | "clip"

function WorkForm({
  templateIds,
  onDone,
  onError,
}: {
  templateIds: string[]
  onDone: () => void
  onError: (message: string | null) => void
}) {
  const [kind, setKind] = React.useState<PostKind>("photos")
  const [templateId, setTemplateId] = React.useState(templateIds[0])
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [images, setImages] = React.useState<string[]>([])
  const [before, setBefore] = React.useState<string | null>(null)
  const [after, setAfter] = React.useState<string | null>(null)
  const [clip, setClip] = React.useState<{ video: string; poster: string } | null>(null)
  const [busy, setBusy] = React.useState(false)

  const guard = async (run: () => Promise<void>) => {
    setBusy(true)
    onError(null)
    try {
      await run()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Tải lên không thành công.")
    }
    setBusy(false)
  }

  const pickPhotos = (files: FileList | null) =>
    guard(async () => {
      if (!files?.length) return
      const uploaded = await Promise.all([...files].slice(0, 5).map((file) => uploadImage("works", file)))
      setImages((current) => [...current, ...uploaded].slice(0, 5))
    })

  const pickOne = (files: FileList | null, set: (url: string) => void) =>
    guard(async () => {
      if (files?.[0]) set(await uploadImage("works", files[0]))
    })

  const pickClip = (files: FileList | null) =>
    guard(async () => {
      if (files?.[0]) setClip(await uploadVideo(files[0]))
    })

  const media =
    kind === "photos" ? images : kind === "before_after" ? [before, after].filter((x): x is string => Boolean(x)) : clip ? [clip.poster] : []
  const mediaOk = kind === "before_after" ? media.length === 2 : media.length > 0
  const valid = title.trim().length >= 3 && mediaOk

  return (
    <Card className="mb-6 space-y-4 p-5">
      <div role="radiogroup" aria-label="Loại bài" className="grid grid-cols-3 gap-2">
        {(
          [
            ["photos", "Ảnh", <ImagePlus key="i" className="size-4" />],
            ["before_after", "Trước & sau", <Columns2 key="b" className="size-4" />],
            ["clip", "Clip ngắn", <Film key="f" className="size-4" />],
          ] as const
        ).map(([value, label, icon]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={kind === value}
            onClick={() => setKind(value)}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-1.5 rounded-full border text-[14px] font-semibold transition-colors",
              kind === value ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink/30",
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {kind === "photos" && (
        <div>
          <p className="mb-2 text-[13px] font-semibold">Ảnh ({images.length}/5) · ảnh đầu tiên là ảnh bìa</p>
          <div className="flex flex-wrap gap-2">
            {images.map((src) => (
              <Thumb key={src} src={src} onRemove={() => setImages((list) => list.filter((x) => x !== src))} />
            ))}
            {images.length < 5 && <PickTile accept="image/*" multiple onPick={pickPhotos} label="Thêm ảnh" />}
          </div>
        </div>
      )}

      {kind === "before_after" && (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["Trước", before, setBefore],
              ["Sau", after, setAfter],
            ] as const
          ).map(([label, src, set]) => (
            <div key={label}>
              <p className="mb-2 text-[13px] font-semibold">{label}</p>
              {src ? (
                <Thumb src={src} large onRemove={() => set(null)} />
              ) : (
                <PickTile accept="image/*" large onPick={(files) => pickOne(files, set)} label={`Chọn ảnh ${label.toLowerCase()}`} />
              )}
            </div>
          ))}
          <p className="col-span-2 text-[13px] text-ink-soft">Chụp cùng góc, cùng ánh sáng để khách so sánh công bằng.</p>
        </div>
      )}

      {kind === "clip" && (
        <div>
          <p className="mb-2 text-[13px] font-semibold">Clip dọc, tối đa {VIDEO_MAX_SECONDS} giây, dưới 50 MB</p>
          {clip ? (
            <div className="flex items-start gap-3">
              <video src={clip.video} poster={clip.poster} controls playsInline muted className="aspect-[9/16] w-36 rounded-[var(--radius-md)] bg-subtle object-cover" />
              <Button variant="ghost" size="sm" onClick={() => setClip(null)}>
                Chọn clip khác
              </Button>
            </div>
          ) : (
            <PickTile accept="video/mp4,video/quicktime,video/webm" large onPick={pickClip} label="Chọn clip" />
          )}
          <p className="mt-2 text-[13px] text-ink-soft">Vị trí quay (GPS) trong clip được xoá trước khi tải lên.</p>
        </div>
      )}

      <Field label="Tên tác phẩm" hint="Khách tìm kiếm bằng những chữ này.">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nail milky đính đá nhẹ" />
      </Field>
      <Field label="Thuộc dịch vụ">
        <select className={inputClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templateIds.map((id) => (
            <option key={id} value={id}>
              {getTemplate(id)?.name ?? id}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mô tả (tuỳ chọn)">
        <textarea
          rows={2}
          className={cn(inputClass, "resize-none")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kiểu dáng, hợp với ai, giữ được bao lâu…"
        />
      </Field>

      <div className="flex gap-2">
        <Button
          disabled={!valid || busy}
          onClick={async () => {
            setBusy(true)
            const result = await saveWork({
              templateId,
              title,
              description,
              images: media,
              kind: kind === "before_after" ? "before_after" : "work",
              video: kind === "clip" ? clip?.video : null,
            })
            setBusy(false)
            if (!result.ok) return onError(result.error)
            onDone()
          }}
        >
          {busy ? "Đang xử lý…" : "Đăng tác phẩm"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </Card>
  )
}

function Thumb({ src, onRemove, large }: { src: string; onRemove: () => void; large?: boolean }) {
  return (
    <span className={cn("relative block overflow-hidden rounded-[var(--radius-md)] bg-subtle", large ? "aspect-[4/5] w-full" : "aspect-[4/5] w-20")}>
      <Image src={src} alt="" fill sizes={large ? "240px" : "80px"} className="object-cover" />
      <button
        type="button"
        aria-label="Bỏ ảnh này"
        onClick={onRemove}
        className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
      >
        <X className="size-4" />
      </button>
    </span>
  )
}

function PickTile({
  accept,
  multiple,
  large,
  label,
  onPick,
}: {
  accept: string
  multiple?: boolean
  large?: boolean
  label: string
  onPick: (files: FileList | null) => void
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-line text-[13px] text-ink-soft hover:border-ink/40 hover:text-ink",
        large ? "aspect-[4/5] w-full" : "aspect-[4/5] w-20",
      )}
    >
      <ImagePlus className="size-5" />
      {large && label}
      <span className="sr-only">{label}</span>
      <input type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(e) => onPick(e.target.files)} />
    </label>
  )
}
