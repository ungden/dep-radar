"use client"

import * as React from "react"
import Link from "next/link"
import { ImagePlus, QrCode, X } from "lucide-react"
import { Button, Card, Field, inputClass } from "@/components/ui"
import { supabaseBrowser } from "@/lib/supabase/client"
import { uploadImage } from "@/lib/uploads"
import { cn, formatPrice } from "@/lib/utils"

/**
 * Where a partner is paid (20261008100000): bank, account, holder and their own
 * QR code. Private to the partner and the staff (row level security, a private
 * bucket). The customer sees it only on the partner's screen, when the partner
 * shows the QR at the end of a job.
 */

export interface Payout {
  bankName: string
  accountNumber: string
  accountHolder: string
  qrPath: string | null
}

export async function loadPayout(proId: string): Promise<{ payout: Payout | null; qrUrl: string | null }> {
  const supabase = supabaseBrowser()
  const { data } = await supabase.from("pro_payout").select("bank_name, account_number, account_holder, qr_path").eq("pro_id", proId).maybeSingle()
  if (!data) return { payout: null, qrUrl: null }
  const payout = { bankName: data.bank_name, accountNumber: data.account_number, accountHolder: data.account_holder, qrPath: data.qr_path }
  const signed = data.qr_path ? await supabase.storage.from("payout").createSignedUrl(data.qr_path, 60 * 60) : null
  return { payout, qrUrl: signed?.data?.signedUrl ?? null }
}

/** The form on /studio/thanh-toan. */
export function PayoutForm({ proId }: { proId: string }) {
  const [loaded, setLoaded] = React.useState(false)
  const [bankName, setBankName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [accountHolder, setAccountHolder] = React.useState("")
  const [qrPath, setQrPath] = React.useState<string | null>(null)
  const [qrUrl, setQrUrl] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null)

  React.useEffect(() => {
    void loadPayout(proId).then(({ payout, qrUrl: url }) => {
      if (payout) {
        setBankName(payout.bankName)
        setAccountNumber(payout.accountNumber)
        setAccountHolder(payout.accountHolder)
        setQrPath(payout.qrPath)
      }
      setQrUrl(url)
      setLoaded(true)
    })
  }, [proId])

  const digits = accountNumber.replace(/\D/g, "")
  const valid = bankName.trim().length >= 2 && digits.length >= 6 && digits.length <= 20 && accountHolder.trim().length >= 2

  const pickQr = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const path = await uploadImage("payout", file)
      setQrPath(path)
      setQrUrl(URL.createObjectURL(file))
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Tải ảnh lên không thành công." })
    }
    setBusy(false)
  }

  const save = async () => {
    if (!valid) return
    setBusy(true)
    setMessage(null)
    const { error } = await supabaseBrowser()
      .from("pro_payout")
      .upsert({
        pro_id: proId,
        bank_name: bankName.trim(),
        account_number: digits,
        account_holder: accountHolder.trim().toUpperCase(),
        qr_path: qrPath,
        updated_at: new Date().toISOString(),
      })
    setBusy(false)
    setMessage(error ? { ok: false, text: "Chưa lưu được, kiểm tra lại số tài khoản (chỉ chữ số)." } : { ok: true, text: "Đã lưu thông tin nhận tiền." })
  }

  if (!loaded) return <p className="text-sm text-muted">Đang tải…</p>

  return (
    <Card className="space-y-4 p-5">
      <p className="text-[13px] text-ink-soft">
        Khách trả tiền thẳng cho bạn sau buổi làm. Lưu tài khoản và mã QR ở đây để mở nhanh trên màn hình lịch hẹn cho khách quét. Chỉ bạn và
        đội ngũ 360dep xem được; 360dep không thu hộ tiền dịch vụ.
      </p>
      <Field label="Ngân hàng">
        <input className={inputClass} value={bankName} maxLength={80} onChange={(e) => setBankName(e.target.value)} placeholder="VD: Vietcombank, MB Bank, Techcombank" />
      </Field>
      <Field label="Số tài khoản">
        <input className={inputClass} inputMode="numeric" value={accountNumber} maxLength={24} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Chỉ chữ số" />
      </Field>
      <Field label="Tên chủ tài khoản" hint="Đúng như trên ứng dụng ngân hàng, để khách đối chiếu khi chuyển.">
        <input className={inputClass} value={accountHolder} maxLength={80} onChange={(e) => setAccountHolder(e.target.value)} placeholder="NGUYEN THI HA" />
      </Field>
      <div>
        <p className="mb-2 text-[13px] font-semibold">Mã QR nhận tiền (ảnh từ ứng dụng ngân hàng)</p>
        <div className="flex items-center gap-3">
          {qrUrl ? (
            // A private file shown through a short-lived link.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="Mã QR nhận tiền" className="size-28 rounded-lg border border-line bg-white object-contain" />
          ) : (
            <span className="flex size-28 items-center justify-center rounded-lg border border-dashed border-line text-muted">
              <QrCode className="size-8" />
            </span>
          )}
          <label className={cn("inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-line px-4 text-[14px] font-semibold", busy && "opacity-50")}>
            <ImagePlus className="size-4" /> {qrUrl ? "Đổi ảnh QR" : "Tải ảnh QR"}
            <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => void pickQr(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      {message && <p className={cn("rounded-xl px-3.5 py-2.5 text-sm", message.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{message.text}</p>}
      <Button size="lg" className="w-full" disabled={!valid || busy} onClick={() => void save()}>
        {busy ? "Đang lưu…" : "Lưu thông tin nhận tiền"}
      </Button>
    </Card>
  )
}

/** "Hiện mã QR": the partner turns the phone to the customer at the end of a job. */
export function ShowPaymentQr({ proId, amount }: { proId: string; amount: number }) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<{ payout: Payout | null; qrUrl: string | null } | null>(null)
  React.useEffect(() => {
    if (open && !data) void loadPayout(proId).then(setData)
  }, [open, data, proId])
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <QrCode className="size-4" /> Hiện mã QR nhận tiền
      </Button>
      {open && (
        <div role="dialog" aria-label="Mã QR nhận tiền" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center text-ink" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-subtle">
                <X className="size-5" />
              </button>
            </div>
            {data === null ? (
              <p className="py-10 text-sm text-muted">Đang tải…</p>
            ) : !data.payout ? (
              <p className="py-6 text-sm text-ink-soft">
                Bạn chưa lưu tài khoản nhận tiền.{" "}
                <Link href="/studio/thanh-toan" className="font-semibold text-accent underline underline-offset-2">
                  Thêm ngay
                </Link>
              </p>
            ) : (
              <>
                <p className="text-[13px] text-muted">Số tiền cần trả</p>
                <p className="text-[28px] font-bold">{formatPrice(amount)}</p>
                {data.qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.qrUrl} alt="Mã QR nhận tiền" className="mx-auto mt-3 aspect-square w-full max-w-[260px] object-contain" />
                ) : (
                  <p className="mt-3 text-[13px] text-muted">Chưa có ảnh mã QR: khách chuyển theo thông tin bên dưới.</p>
                )}
                <p className="mt-3 font-semibold">{data.payout.accountHolder}</p>
                <p className="text-[15px]">
                  {data.payout.bankName} · <span className="font-mono">{data.payout.accountNumber}</span>
                </p>
                <p className="mt-3 text-[12px] text-muted">Nhận đủ tiền rồi bấm “Đã nhận tiền” trong lịch hẹn.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
