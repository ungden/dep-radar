"use client"

import * as React from "react"
import { Download, ImageIcon, Share2 } from "lucide-react"
import { Button, Card, Tabs } from "@/components/ui"
import { cn } from "@/lib/utils"

type Format = "story" | "post"

const FORMATS: { value: Format; label: string; ratio: string }[] = [
  { value: "story", label: "Story 9:16", ratio: "aspect-[9/16]" },
  { value: "post", label: "Bài đăng 4:5", ratio: "aspect-[4/5]" },
]

/**
 * A picture made from the freelancer's own page (app/pros/[id]/portfolio and
 * app/works/[id]/portfolio) to post on Facebook, Instagram, TikTok or Zalo:
 * previewed here, saved to the phone, or handed straight to the share sheet as
 * a file, so it lands in the story editor rather than as a bare link.
 */
export function ShareImages({ base, fileName, className }: { base: string; fileName: string; className?: string }) {
  const [format, setFormat] = React.useState<Format>("story")
  const [busy, setBusy] = React.useState<"save" | "share" | null>(null)
  const [note, setNote] = React.useState<string | null>(null)
  const [loaded, setLoaded] = React.useState<Record<string, boolean>>({})
  const src = `${base}/${format}`
  const file = `${fileName}-${format}.jpg`

  const blob = async () => {
    const res = await fetch(src)
    if (!res.ok) throw new Error("image")
    return res.blob()
  }

  const save = async () => {
    setBusy("save")
    setNote(null)
    try {
      const url = URL.createObjectURL(await blob())
      const a = document.createElement("a")
      a.href = url
      a.download = file
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setNote("Đã lưu ảnh. Mở Facebook, Instagram, TikTok hoặc Zalo và đăng từ thư viện ảnh.")
    } catch {
      setNote("Chưa tải được ảnh, thử lại sau ít phút.")
    } finally {
      setBusy(null)
    }
  }

  const share = async () => {
    setBusy("share")
    setNote(null)
    try {
      const shot = new File([await blob()], file, { type: "image/jpeg" })
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [shot] })) {
        await navigator.share({ files: [shot] })
      } else {
        setBusy(null)
        return save()
      }
    } catch (error) {
      // Closing the share sheet is not a failure worth a message.
      if (!(error instanceof DOMException && error.name === "AbortError")) setNote("Chưa chia sẻ được, thử “Lưu ảnh” nhé.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={className}>
      <Tabs value={format} onChange={setFormat} items={FORMATS} />
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className={cn("relative w-[220px] shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[#2A1B1E]", FORMATS.find((f) => f.value === format)!.ratio)}>
          {!loaded[src] && <div className="absolute inset-0 animate-pulse bg-[#3A2A2D]" />}
          {/* Drawn on the server as a JPEG to save; next/image would only re-encode it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={src}
            src={src}
            alt="Ảnh xem trước"
            className="absolute inset-0 size-full object-cover"
            onLoad={() => setLoaded((l) => ({ ...l, [src]: true }))}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[14px] text-ink-soft">
            {format === "story"
              ? "Đăng lên story Facebook, Instagram, Zalo hoặc làm ảnh bìa TikTok."
              : "Đăng lên trang cá nhân, fanpage hoặc bảng tin Instagram."}{" "}
            Khách quét mã QR trên ảnh là mở ngay trang đặt lịch của bạn.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void share()} disabled={busy !== null}>
              <Share2 className="size-4" /> {busy === "share" ? "Đang mở…" : "Chia sẻ"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void save()} disabled={busy !== null}>
              <Download className="size-4" /> {busy === "save" ? "Đang tải…" : "Lưu ảnh"}
            </Button>
          </div>
          {note && (
            <p role="status" className="text-[13px] text-ink-soft">
              {note}
            </p>
          )}
          <p className="text-[12px] text-muted">Ảnh tự cập nhật theo tác phẩm, đánh giá và bảng giá mới nhất của bạn.</p>
        </div>
      </div>
    </div>
  )
}

/** Studio card: the whole profile as a picture to post. */
export function PortfolioCard({ slug, published, className }: { slug: string; published: boolean; className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
        <ImageIcon className="size-5 text-accent" /> Ảnh portfolio để đăng mạng xã hội
      </p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        Tự làm từ tác phẩm đẹp nhất, đánh giá và giá của bạn, có mã QR để khách đặt lịch.
      </p>
      {published ? (
        <ShareImages base={`/pros/${slug}/portfolio`} fileName={`360dep-${slug}`} className="mt-3" />
      ) : (
        <p className="mt-3 rounded-[var(--radius-md)] bg-subtle px-3 py-2.5 text-[13px] text-ink-soft">
          Có ảnh portfolio khi hồ sơ của bạn đã mở với khách.
        </p>
      )}
    </Card>
  )
}
