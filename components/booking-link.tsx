"use client"

import * as React from "react"
import { Check, Copy, Download, Share2 } from "lucide-react"
import { Button, Card } from "@/components/ui"
import { proBookingUrl } from "@/lib/working-hours"
import { cn } from "@/lib/utils"

/**
 * The freelancer's own booking link, to put in a Zalo chat, a Facebook bio or
 * on the mirror as a QR code. The QR is drawn in the browser by the `qrcode`
 * package: no third-party QR service ever sees the link.
 *
 * Zalo has no share URL that works without a registered app id, so "Chia sẻ
 * Zalo" opens the phone's share sheet (Zalo is in it on any phone that has it)
 * and falls back to copying the link where there is no share sheet.
 */
export function BookingLink({ slug, published, className }: { slug: string; published: boolean; className?: string }) {
  return (
    <ShareLinkCard
      url={proBookingUrl(slug)}
      title="Link đặt lịch của bạn"
      text={
        published
          ? "Gửi cho khách quen: họ xem tác phẩm, bảng giá và đặt giờ trống của bạn."
          : "Link chạy khi bạn đã mở hồ sơ. Trước đó, khách mở link sẽ không thấy trang của bạn."
      }
      shareTitle="Đặt lịch với mình trên 360dep"
      qrFile={`360dep-${slug}-qr.png`}
      className={className}
    />
  )
}

/** A link to hand out: shown, copied, shared, and as a QR code drawn in the browser. */
export function ShareLinkCard({
  url,
  title,
  text,
  shareTitle,
  qrFile,
  className,
}: {
  url: string
  title: string
  text: string
  /** What the share sheet says with the link. */
  shareTitle: string
  /** File name for "Tải mã QR". */
  qrFile: string
  className?: string
}) {
  const [qr, setQr] = React.useState<string | null>(null)
  const [note, setNote] = React.useState<string | null>(null)

  React.useEffect(() => {
    let live = true
    void import("qrcode")
      .then((QR) =>
        QR.toDataURL(url, { margin: 1, width: 480, errorCorrectionLevel: "M", color: { dark: "#3A2A2C", light: "#FFFFFF" } }),
      )
      .then((data) => live && setQr(data))
      .catch(() => live && setQr(null))
    return () => {
      live = false
    }
  }, [url])

  const copy = async (message = "Đã chép link") => {
    try {
      await navigator.clipboard.writeText(url)
      setNote(message)
    } catch {
      setNote("Không chép được. Giữ tay lên link để chép.")
    }
  }

  const share = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, url })
        return
      } catch (error) {
        // Closing the share sheet is not a failure worth a message.
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }
    await copy("Đã chép link. Mở Zalo và dán vào tin nhắn.")
  }

  return (
    <Card className={cn("p-4", className)}>
      <p className="text-[17px] font-bold tracking-tight">{title}</p>
      <p className="mt-0.5 text-[13px] text-ink-soft">{text}</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="select-all break-all rounded-[var(--radius-md)] bg-subtle px-3 py-2.5 text-[14px] font-medium">{url}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void copy()}>
              {note === "Đã chép link" ? <Check className="size-4" /> : <Copy className="size-4" />} Chép link
            </Button>
            <Button size="sm" onClick={() => void share()}>
              <Share2 className="size-4" /> Chia sẻ Zalo
            </Button>
          </div>
          {note && (
            <p role="status" className="mt-2 text-[13px] text-ink-soft">
              {note}
            </p>
          )}
        </div>
        {qr && (
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {/* A data: URL made in this browser; next/image has nothing to optimise. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`Mã QR mở ${url}`} width={128} height={128} className="size-32 rounded-[var(--radius-md)] border border-line" />
            <a href={qr} download={qrFile} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
              <Download className="size-3.5" /> Tải mã QR
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}
