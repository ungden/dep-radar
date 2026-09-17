"use client"

import * as React from "react"
import { Camera, CheckCircle2, Clock, IdCard, Loader2, RotateCcw, ScanFace, ShieldCheck, TrendingUp, UserRound, X } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { BottomBar, Button, ButtonLink, Card, PageHeader } from "@/components/ui"
import { type IdentityImage, type IdentityImageKind, checkImage, loadImage, verifyIdentity } from "@/lib/identity-check"
import { actions, proView, useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Xác minh danh tính" back="/studio/profile" />
      <RequireSession role="pro">
        <VerifyFlow />
      </RequireSession>
    </div>
  )
}

const SLOTS: { kind: IdentityImageKind; title: string; hint: string; capture: "environment" | "user"; icon: typeof IdCard }[] = [
  { kind: "front", title: "Mặt trước CCCD", hint: "Chụp ngang, đủ 4 góc thẻ, không loá sáng", capture: "environment", icon: IdCard },
  { kind: "back", title: "Mặt sau CCCD", hint: "Thấy rõ chip và mã QR", capture: "environment", icon: IdCard },
  { kind: "selfie", title: "Ảnh selfie", hint: "Nhìn thẳng, đủ sáng, không đeo kính râm hay khẩu trang", capture: "user", icon: UserRound },
]

type Phase = "form" | "checking" | "done" | "review" | "failed"

function VerifyFlow() {
  const state = useApp()
  const pro = proView(state, state.session!.proId!)!
  const [consent, setConsent] = React.useState(false)
  const [images, setImages] = React.useState<Partial<Record<IdentityImageKind, IdentityImage>>>({})
  const [issues, setIssues] = React.useState<Partial<Record<IdentityImageKind, string>>>({})
  const [phase, setPhase] = React.useState<Phase>("form")
  const [reason, setReason] = React.useState("")
  const [nameOnCard, setNameOnCard] = React.useState("")

  // Images live only in memory; release preview URLs when leaving the page.
  const imagesRef = React.useRef(images)
  React.useEffect(() => {
    imagesRef.current = images
  }, [images])
  React.useEffect(() => () => Object.values(imagesRef.current).forEach((img) => img && URL.revokeObjectURL(img.url)), [])

  if (pro.identity === "verified" && phase !== "done") return <Result nameOnCard="" />

  const pick = async (kind: IdentityImageKind, file: File | undefined) => {
    if (!file) return
    try {
      const img = await loadImage(file)
      setImages((x) => {
        if (x[kind]) URL.revokeObjectURL(x[kind]!.url)
        return { ...x, [kind]: img }
      })
      setIssues((x) => ({ ...x, [kind]: checkImage(kind, img) ?? undefined }))
    } catch {
      setIssues((x) => ({ ...x, [kind]: "Không đọc được ảnh, hãy chụp lại." }))
    }
  }

  const ready = consent && SLOTS.every((s) => images[s.kind] && !issues[s.kind])

  const submit = async () => {
    if (!ready) return
    setPhase("checking")
    actions.setMyIdentity("pending")
    try {
      const result = await verifyIdentity(images as Record<IdentityImageKind, IdentityImage>, pro.name)
      if (result.status === "verified") {
        actions.setMyIdentity("verified")
        setNameOnCard(result.nameOnCard)
        setPhase("done")
      } else if (result.status === "review") {
        setReason(result.reason)
        setPhase("review")
      } else {
        actions.setMyIdentity("rejected")
        setReason(result.reason)
        setPhase("failed")
      }
    } catch (err) {
      actions.setMyIdentity("none")
      setReason(err instanceof Error ? err.message : "Không kết nối được dịch vụ xác minh.")
      setPhase("failed")
    }
    Object.values(images).forEach((img) => img && URL.revokeObjectURL(img.url))
    setImages({})
  }

  if (phase === "checking") {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <Loader2 className="size-10 animate-spin text-rose" />
        <p className="mt-4 font-semibold">AI đang đối chiếu CCCD với ảnh selfie</p>
        <p className="mt-1 text-sm text-muted">Đọc thẻ và so khuôn mặt, thường mất 10–20 giây.</p>
      </div>
    )
  }
  if (phase === "done") return <Result nameOnCard={nameOnCard} />
  if (phase === "review") {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Clock className="size-8" />
        </span>
        <p className="mt-4 font-semibold">Đang chờ kiểm tra thêm</p>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">{reason}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => setPhase("form")}>
            <RotateCcw className="size-4" /> Chụp lại
          </Button>
          <ButtonLink href="/studio">Về Studio</ButtonLink>
        </div>
      </div>
    )
  }
  if (phase === "failed") {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
          <X className="size-8" />
        </span>
        <p className="mt-4 font-semibold">Chưa xác minh được</p>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">{reason}</p>
        <Button className="mt-6" onClick={() => setPhase("form")}>
          <RotateCcw className="size-4" /> Chụp lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <p className="font-semibold">Vì sao nên xác minh?</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
          <li className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-rose" /> Dấu tick cạnh tên và huy hiệu “Đã xác minh danh tính”.
          </li>
          <li className="flex gap-2">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-rose" /> Được xếp trước hồ sơ chưa xác minh khi khách tìm kiếm.
          </li>
        </ul>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <ScanFace className="mt-px size-3.5 shrink-0" />
          Không bắt buộc, khoảng 2 phút. AI đọc CCCD và so ảnh chân dung trên thẻ với ảnh selfie của bạn.
        </p>
      </Card>

      <ul className="space-y-3">
        {SLOTS.map((slot) => {
          const img = images[slot.kind]
          const issue = issues[slot.kind]
          const Icon = slot.icon
          return (
            <li key={slot.kind}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-3 transition-colors",
                  issue ? "border-danger/50" : img ? "border-success/50" : "border-dashed border-line hover:border-rose",
                )}
              >
                <span
                  className={cn(
                    "relative flex shrink-0 items-center justify-center overflow-hidden bg-canvas",
                    slot.kind === "selfie" ? "size-16 rounded-full" : "h-16 w-24 rounded-xl",
                  )}
                >
                  {img ? (
                    // Object URL preview of a local file: next/image cannot optimise it.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" className="size-full object-cover" />
                  ) : (
                    <Icon className="size-6 text-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{slot.title}</span>
                  <span className={cn("block text-xs", issue ? "text-danger" : "text-muted")}>{issue ?? slot.hint}</span>
                </span>
                {img && !issue ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blush px-3 py-1.5 text-xs font-medium text-rose-dark">
                    <Camera className="size-3.5" /> {img ? "Chụp lại" : "Chụp"}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture={slot.capture}
                  className="sr-only"
                  onChange={(e) => {
                    pick(slot.kind, e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </label>
            </li>
          )
        })}
      </ul>

      <label className="flex items-start gap-2.5 rounded-2xl bg-canvas p-3.5 text-[13px] text-ink-soft">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--color-rose)]" />
        <span>
          Tôi đồng ý cho dep360 gửi ảnh CCCD và ảnh chân dung của tôi tới dịch vụ AI (Google Gemini) chỉ để xác minh danh tính, theo Nghị định 13/2023/NĐ-CP. dep360 không
          lưu ảnh; khách hàng chỉ thấy dấu xác minh, không thấy thông tin CCCD.
        </span>
      </label>

      <BottomBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={submit}>
          Gửi xác minh
        </Button>
      </BottomBar>
    </div>
  )
}

function Result({ nameOnCard }: { nameOnCard: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-8" />
      </span>
      <p className="mt-4 font-semibold">Đã xác minh danh tính</p>
      {nameOnCard && <p className="mt-1 text-sm text-success">AI xác nhận ảnh CCCD của {nameOnCard} và selfie là cùng một người</p>}
      <p className="mt-1 max-w-sm text-sm text-ink-soft">Hồ sơ của bạn đã có dấu tick và được ưu tiên hiển thị khi khách tìm kiếm.</p>
      <div className="mt-6 flex gap-2">
        <ButtonLink href="/studio" variant="outline">
          Về Studio
        </ButtonLink>
        <ButtonLink href="/studio/profile">Xem hồ sơ</ButtonLink>
      </div>
    </div>
  )
}
