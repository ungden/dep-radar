"use client"

import * as React from "react"
import Link from "next/link"
import { Check, MessageCircle, X } from "lucide-react"
import { compensationLabel } from "@/components/casting"
import { RequireSession } from "@/components/require-session"
import { Avatar, Button, Field, PageHeader, inputClass } from "@/components/ui"
import { CATEGORIES, categoryLabel } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import { districtsOf } from "@/lib/geo"
import { getPro, useApp } from "@/lib/store"
import type { Casting, CastingCompensation, CategoryId } from "@/lib/types"
import { addDays, cn, formatDateLong, timeAgo, todayISO } from "@/lib/utils"

export default function StudioCastingsPage() {
  return (
    <div className="mx-auto max-w-3xl md:pt-4">
      <PageHeader title="Tuyển mẫu" back="/studio" />
      <RequireSession role="pro">
        <Castings />
      </RequireSession>
    </div>
  )
}

function Castings() {
  const state = useApp()
  const proId = state.session!.proId!
  const mine = state.castings
    .filter((c) => c.proId === proId)
    .sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === "open" ? -1 : 1))
  const [creating, setCreating] = React.useState(mine.length === 0)

  return (
    <div className="space-y-8">
      <p className="text-[15px] text-ink-soft">
        Cần mẫu để luyện tay, thử kiểu mới hay chụp portfolio? Đăng tin, khách quanh bạn ứng tuyển, bạn chọn người phù hợp
        rồi nhắn tin trao đổi. Ảnh chụp được dùng làm tác phẩm khi mẫu đồng ý.
      </p>

      {creating ? (
        <CastingForm onDone={() => setCreating(false)} />
      ) : (
        <Button onClick={() => setCreating(true)}>Đăng tin mới</Button>
      )}

      {mine.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[20px] font-extrabold tracking-tight">Tin của bạn</h2>
          {mine.map((c) => (
            <CastingManager key={c.id} casting={c} />
          ))}
        </section>
      )}
    </div>
  )
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

function CastingForm({ onDone }: { onDone: () => void }) {
  const state = useApp()
  const act = useAct()
  const pro = getPro(state, state.session!.proId!)!
  const verified = pro.identity === "verified"
  const ownCategories = CATEGORIES.filter((c) => pro.categories.includes(c.id))
  const [category, setCategory] = React.useState<CategoryId>(ownCategories[0]?.id ?? "nail")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [date, setDate] = React.useState(addDays(todayISO(), 3))
  const [time, setTime] = React.useState("10:00")
  const [district, setDistrict] = React.useState(pro.district)
  const [slots, setSlots] = React.useState(1)
  const [compensation, setCompensation] = React.useState<CastingCompensation>("free")
  const [discount, setDiscount] = React.useState(50)
  const [fee, setFee] = React.useState(200000)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await act(
      () =>
        actions.createCasting({
          category,
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          city: pro.city,
          district,
          slots,
          compensation,
          discountPercent: compensation === "discount" ? discount : undefined,
          fee: compensation === "paid" ? fee : undefined,
        }),
      "Đã đăng tin tuyển mẫu",
    )
    setBusy(false)
    setError(err)
    if (!err) onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
      <h2 className="text-[20px] font-extrabold tracking-tight">Tin tuyển mẫu mới</h2>

      <Field label="Dịch vụ">
        <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className={inputClass}>
          {(ownCategories.length ? ownCategories : CATEGORIES).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tiêu đề" hint="Nói rõ cần mẫu gì, làm gì. VD: Cần 2 mẫu tay làm nail thạch, chụp portfolio.">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} required className={inputClass} />
      </Field>

      <Field label="Mô tả" hint="Yêu cầu với mẫu, thời lượng, mẫu được gì. Không ghi địa chỉ cụ thể: bạn gửi qua tin nhắn khi đã chọn.">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} className={cn(inputClass, "resize-none")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Ngày">
          <input type="date" value={date} min={addDays(todayISO(), 1)} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Giờ">
          <select value={time} onChange={(e) => setTime(e.target.value)} className={inputClass}>
            {TIME_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Số mẫu cần">
          <select value={slots} onChange={(e) => setSlots(Number(e.target.value))} className={inputClass}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={`Khu vực (${pro.city})`}>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass}>
          {districtsOf(pro.city).map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Mẫu được gì</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["free", "Làm miễn phí", true],
              ["discount", "Giảm giá", true],
              ["paid", "Trả thù lao", verified],
            ] as const
          ).map(([value, label, allowed]) => (
            <button
              key={value}
              type="button"
              disabled={!allowed}
              aria-pressed={compensation === value}
              onClick={() => setCompensation(value)}
              className={cn(
                "h-11 rounded-full border px-4 text-[14px] font-semibold transition-colors disabled:opacity-40",
                compensation === value ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink/30",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {!verified && <p className="mt-2 text-[13px] text-ink-soft">Tin có thù lao chỉ mở khi bạn đã xác minh danh tính.</p>}
      </fieldset>

      {compensation === "discount" && (
        <Field label={`Giảm ${discount}% giá của bạn`}>
          <input type="range" min={10} max={90} step={10} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full accent-[var(--color-ink)]" />
        </Field>
      )}
      {compensation === "paid" && (
        <Field label="Thù lao cho mỗi mẫu (đồng)" hint="Làm tròn tới 5.000đ.">
          <input
            type="number"
            min={50000}
            step={5000}
            value={fee}
            onChange={(e) => setFee(Math.round(Number(e.target.value) / 5000) * 5000)}
            className={inputClass}
          />
        </Field>
      )}

      <p className="rounded-[var(--radius-md)] bg-subtle p-3 text-[13px] text-ink-soft">
        Không nhận tin chụp nội y, khoả thân, nội dung nhạy cảm, và không được thu bất kỳ khoản tiền nào của mẫu. Tin vi phạm bị gỡ và hồ sơ có thể bị khoá.
      </p>

      {error && (
        <p role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy || title.trim().length < 8}>
          Đăng tin
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </form>
  )
}

function CastingManager({ casting }: { casting: Casting }) {
  const act = useAct()
  const [error, setError] = React.useState<string | null>(null)
  const pending = casting.applications.filter((a) => a.status === "pending")
  const accepted = casting.applications.filter((a) => a.status === "accepted")
  const full = accepted.length >= casting.slots

  return (
    <article className={cn("rounded-[var(--radius-lg)] border border-line bg-surface p-4", casting.status !== "open" && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">
            {categoryLabel(casting.category)} · {compensationLabel(casting)}
          </p>
          <Link href={`/tuyen-mau/${casting.id}`} className="mt-0.5 block text-[16px] font-bold hover:underline">
            {casting.title}
          </Link>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {formatDateLong(casting.date)}, {casting.time} · {casting.district} · đã chọn {accepted.length}/{casting.slots}
          </p>
        </div>
        {casting.status === "open" ? (
          <Button variant="outline" size="sm" onClick={() => void act(() => actions.closeCasting(casting.id), "Đã đóng tin").then(setError)}>
            Đóng tin
          </Button>
        ) : (
          <span className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold">Đã đóng</span>
        )}
      </div>

      {casting.applications.length === 0 ? (
        <p className="mt-4 rounded-[var(--radius-md)] bg-subtle px-3 py-4 text-center text-[14px] text-ink-soft">Chưa có ai ứng tuyển.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {[...accepted, ...pending, ...casting.applications.filter((a) => a.status === "rejected")].map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3">
              <Avatar name={a.applicantName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">
                  {a.applicantName} <span className="text-[13px] font-normal text-muted">· {timeAgo(a.createdAt)}</span>
                </p>
                {a.message && <p className="mt-0.5 text-[14px] text-ink-soft">{a.message}</p>}
                {a.status === "accepted" && (
                  <Link href="/tin-nhan" className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-success">
                    <MessageCircle className="size-4" /> Đã chọn · nhắn tin
                  </Link>
                )}
                {a.status === "rejected" && <p className="mt-1 text-[13px] text-muted">Không chọn</p>}
              </div>
              {a.status === "pending" && casting.status === "open" && (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    aria-label={`Không chọn ${a.applicantName}`}
                    onClick={() => void act(() => actions.decideApplication(a.id, false), "Đã từ chối").then(setError)}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-line hover:border-ink/30"
                  >
                    <X className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={full}
                    aria-label={`Chọn ${a.applicantName}`}
                    onClick={() => void act(() => actions.decideApplication(a.id, true), "Đã chọn mẫu").then(setError)}
                    className="inline-flex h-10 items-center gap-1 rounded-full bg-ink px-4 text-[13px] font-semibold text-white disabled:opacity-40"
                  >
                    <Check className="size-4" /> Chọn
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[14px] text-danger">
          {error}
        </p>
      )}
      {full && casting.status === "open" && <p className="mt-2 text-[13px] text-ink-soft">Đã đủ người. Đóng tin để không nhận thêm ứng tuyển.</p>}
    </article>
  )
}

