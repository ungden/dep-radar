"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui"
import { listWorkingHours } from "@/lib/api/me"
import { proView, servicesOf, useApp, worksOf } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * Whether the signed-in freelancer's saved week has at least one window. Read
 * from the database, not from the editor's defaults: the publish guard checks
 * the same table. `null` while loading.
 */
export function useSavedHours(): [boolean | null, (value: boolean) => void] {
  const [saved, setSaved] = React.useState<boolean | null>(null)
  React.useEffect(() => {
    let live = true
    void listWorkingHours()
      .then((windows) => live && setSaved(windows.length > 0))
      .catch(() => live && setSaved(false))
    return () => {
      live = false
    }
  }, [])
  return [saved, setSaved]
}

/**
 * The four things a profile needs before customers can find it, in the order
 * the database checks them (pros_guard: an active service, working hours, one
 * work), then the switch itself, which sends the profile for review. Shown on
 * "Hôm nay" until the profile is live; while the review runs, or when it asked
 * for changes, the last step says so.
 */
export function PublishProgress() {
  const state = useApp()
  const proId = state.session!.proId!
  const pro = proView(state, proId)!
  const [hasHours] = useSavedHours()
  if (pro.published) return null

  const hasService = servicesOf(state, proId).length > 0
  // A post the review hid does not count, as in the database.
  const hasWork = worksOf(state, proId).some((w) => !w.hiddenReason)
  const firstReason = (pro.reviewNote ?? "").split("\n").find((line) => line.trim())
  const last =
    pro.reviewStatus === "pending"
      ? { label: "Chờ duyệt", text: "Đang chờ duyệt (thường vài phút)" }
      : pro.reviewStatus === "changes_requested" || pro.reviewStatus === "rejected"
        ? { label: "Gửi duyệt lại", text: firstReason ? `Cần sửa: ${firstReason}` : "Sửa theo góp ý rồi bấm “Gửi duyệt lại”" }
        : pro.reviewStatus === "approved"
          ? { label: "Mở hồ sơ", text: "Bật hiển thị để khách đặt được lịch" }
          : { label: "Mở hồ sơ", text: "Bấm “Mở hồ sơ cho khách” để gửi duyệt, thường xong trong vài phút" }
  const steps = [
    { label: "Dịch vụ", text: "Chọn ít nhất một dịch vụ và đặt giá", href: "/studio/services", done: hasService },
    { label: "Tác phẩm", text: "Đăng ít nhất một ảnh việc bạn đã làm", href: "/studio/works", done: hasWork },
    { label: "Giờ làm", text: "Lưu giờ bạn nhận khách trong tuần", href: "/studio/profile/edit#gio-lam", done: hasHours === true },
    { ...last, href: "/studio/profile/edit#mo-ho-so", done: false },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)

  return (
    <Card className="p-4 ring-1 ring-warning/40">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[17px] font-bold tracking-tight">Khách chưa thấy hồ sơ của bạn</p>
        <span className="shrink-0 text-[13px] font-semibold text-ink-soft">{doneCount}/4 bước</span>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {steps.map((s) => (
          <span key={s.label} className={cn("h-1.5 flex-1 rounded-full", s.done ? "bg-accent" : "bg-subtle-strong")} />
        ))}
      </div>
      <ol className="mt-3 space-y-1">
        {steps.map((s, i) => {
          const current = s === next
          return (
            <li key={s.label}>
              <Link
                href={s.href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 transition-colors hover:bg-subtle",
                  current && "bg-accent-soft",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                    s.done ? "bg-accent text-white" : current ? "border-2 border-accent text-accent" : "border border-line text-muted",
                  )}
                >
                  {s.done ? <Check className="size-4" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px]", s.done ? "text-ink-soft line-through decoration-ink/30" : "font-semibold")}>{s.label}</span>
                  {!s.done && <span className="block text-[13px] text-ink-soft">{s.text}</span>}
                </span>
                {!s.done && <ChevronRight className="size-4 text-muted" />}
              </Link>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
