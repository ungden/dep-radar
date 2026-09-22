"use client"

import * as React from "react"
import Image from "next/image"
import { ImagePlus, Trash2 } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Button, Card, EmptyState, Field, PageHeader, inputClass } from "@/components/ui"
import { deleteWork, saveWork } from "@/lib/api/actions"
import { getTemplate } from "@/lib/catalog"
import { useApp, useRefresh, worksOf } from "@/lib/store"
import { servicesOf } from "@/lib/store"
import { uploadImage } from "@/lib/uploads"
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
      <p className="mb-4 rounded-2xl bg-subtle px-4 py-3 text-[13px] text-accent-dark">
        Ảnh tác phẩm là thứ khách xem đầu tiên. Chỉ đăng ảnh do chính bạn làm — ảnh lấy trên mạng sẽ bị gỡ và có thể bị
        khoá hồ sơ. Ảnh được nén và xoá toàn bộ thông tin vị trí trước khi tải lên.
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
                <div className="relative aspect-square bg-subtle">
                  <Image src={work.images[0]} alt={work.title} fill sizes="200px" className="object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[13px] font-medium">{work.title}</p>
                  <p className="truncate text-[11px] text-muted">{getTemplate(work.templateId)?.name}</p>
                  <button
                    type="button"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted hover:text-danger"
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

function WorkForm({
  templateIds,
  onDone,
  onError,
}: {
  templateIds: string[]
  onDone: () => void
  onError: (message: string | null) => void
}) {
  const [templateId, setTemplateId] = React.useState(templateIds[0])
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [images, setImages] = React.useState<string[]>([])
  const [busy, setBusy] = React.useState(false)

  const pick = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    onError(null)
    try {
      const uploaded = await Promise.all([...files].slice(0, 5).map((file) => uploadImage("works", file)))
      setImages((current) => [...current, ...uploaded].slice(0, 5))
    } catch (err) {
      onError(err instanceof Error ? err.message : "Tải ảnh không thành công.")
    }
    setBusy(false)
  }

  const valid = title.trim().length >= 3 && images.length > 0

  return (
    <Card className="mb-4 p-4">
      <Field label="Tên tác phẩm" hint="Khách tìm kiếm bằng những chữ này.">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nail milky đính đá nhẹ"
        />
      </Field>
      <div className="mt-3">
        <Field label="Thuộc dịch vụ">
          <select className={inputClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templateIds.map((id) => (
              <option key={id} value={id}>
                {getTemplate(id)?.name ?? id}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Mô tả (tuỳ chọn)">
          <textarea
            rows={2}
            className={cn(inputClass, "resize-none")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kiểu dáng, hợp với ai, giữ được bao lâu…"
          />
        </Field>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[13px] font-medium">Ảnh ({images.length}/5)</p>
        <div className="flex flex-wrap gap-2">
          {images.map((src) => (
            <span key={src} className="relative size-20 overflow-hidden rounded-xl bg-subtle">
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </span>
          ))}
          {images.length < 5 && (
            <label className="flex size-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-muted hover:border-accent hover:text-accent">
              <ImagePlus className="size-5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => void pick(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          disabled={!valid || busy}
          onClick={async () => {
            setBusy(true)
            const result = await saveWork({ templateId, title, description, images })
            setBusy(false)
            if (!result.ok) return onError(result.error)
            onDone()
          }}
        >
          {busy ? "Đang lưu…" : "Đăng tác phẩm"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </Card>
  )
}
