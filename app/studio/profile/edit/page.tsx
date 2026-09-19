"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, CheckCircle2, Circle } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Avatar, Button, Card, Field, PageHeader, Toggle, inputClass } from "@/components/ui"
import { saveProProfile, saveWorkingHours } from "@/lib/api/actions"
import { addDayOff, listDaysOff, removeDayOff, type DayOff } from "@/lib/api/me"
import { proView, servicesOf, useApp, useRefresh, worksOf } from "@/lib/store"
import { uploadImage } from "@/lib/uploads"
import { cn, todayISO } from "@/lib/utils"

const DAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
const HOURS = Array.from({ length: 25 }, (_, i) => i * 60)
const label = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:00`

export default function EditProfilePage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Hồ sơ của bạn" back="/studio/profile" />
      <RequireSession role="pro">
        <ProfileEditor />
      </RequireSession>
    </div>
  )
}

function ProfileEditor() {
  const state = useApp()
  const refresh = useRefresh()
  const proId = state.session!.proId!
  const pro = proView(state, proId)!

  const [displayName, setDisplayName] = React.useState(pro.name)
  const [title, setTitle] = React.useState(pro.title)
  const [bio, setBio] = React.useState(pro.bio)
  const [studio, setStudio] = React.useState(pro.studioAddress ?? "")
  const [homeService, setHomeService] = React.useState(pro.homeService)
  const [maxTravelKm, setMaxTravelKm] = React.useState(pro.maxTravelKm)
  const [avatar, setAvatar] = React.useState(pro.avatar ?? null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  // A verified freelancer is shown under the name on their ID card.
  const nameLocked = pro.identity === "verified"

  const hasService = servicesOf(state, proId, true).length > 0
  const hasWork = worksOf(state, proId).length > 0

  const save = async () => {
    setBusy(true)
    setError(null)
    const result = await saveProProfile({
      displayName,
      title,
      bio,
      avatarPath: avatar,
      studioAddress: studio,
      homeService,
      maxTravelKm,
    })
    setBusy(false)
    if (!result.ok) return setError(result.error)
    setSaved(true)
    refresh()
  }

  return (
    <div className="space-y-5">
      <Card className="flex items-center gap-4 p-4">
        <span className="relative">
          {avatar ? (
            <Image src={avatar} alt="" width={64} height={64} className="size-16 rounded-full object-cover" />
          ) : (
            <Avatar name={displayName} tone={pro.tone} size={64} />
          )}
          <label className="absolute -bottom-1 -right-1 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-rose text-white">
            <Camera className="size-3.5" />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setBusy(true)
                try {
                  setAvatar(await uploadImage("avatars", file))
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Tải ảnh không thành công.")
                }
                setBusy(false)
              }}
            />
          </label>
        </span>
        <div className="min-w-0 flex-1 text-sm text-ink-soft">
          Ảnh đại diện rõ mặt giúp khách yên tâm hơn khi mở cửa cho người lạ.
        </div>
      </Card>

      <Field label="Tên hiển thị" hint={nameLocked ? "Đã xác minh: tên hiển thị theo CCCD." : undefined}>
        <input
          className={inputClass}
          value={displayName}
          disabled={nameLocked}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Field>

      <Field label="Bạn làm nghề gì?">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field label="Giới thiệu" hint="Bạn làm mạnh kiểu gì, dùng sản phẩm gì, khách thường khen điều gì.">
        <textarea
          rows={4}
          className={cn(inputClass, "resize-none")}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </Field>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold">Nhận làm tại nhà khách</p>
            <p className="text-xs text-muted">Tắt nếu bạn chỉ làm tại studio.</p>
          </div>
          <Toggle label="Nhận làm tại nhà khách" checked={homeService} onChange={setHomeService} />
        </div>
        <Field label={`Bán kính di chuyển: ${maxTravelKm} km`}>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={maxTravelKm}
            onChange={(e) => setMaxTravelKm(Number(e.target.value))}
            className="w-full accent-[var(--color-rose)]"
          />
        </Field>
        <Field label="Địa chỉ studio (nếu có)" hint="Có studio thì bạn nhận được cả dịch vụ chỉ làm tại chỗ.">
          <input className={inputClass} value={studio} onChange={(e) => setStudio(e.target.value)} />
        </Field>
      </Card>

      <WorkingHoursEditor onError={setError} />

      <DaysOffEditor onError={setError} />

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      {saved && !error && <p className="text-sm text-success">Đã lưu.</p>}

      <Button size="lg" className="w-full" disabled={busy} onClick={() => void save()}>
        {busy ? "Đang lưu…" : "Lưu hồ sơ"}
      </Button>

      <PublishBox hasService={hasService} hasWork={hasWork} />
    </div>
  )
}

/** A profile only goes public when it can actually take a booking. */
function PublishBox({ hasService, hasWork }: { hasService: boolean; hasWork: boolean }) {
  const state = useApp()
  const refresh = useRefresh()
  const pro = proView(state, state.session!.proId!)!
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const ready = hasService && hasWork
  const items: [boolean, string, string][] = [
    [hasService, "Ít nhất một dịch vụ có giá", "/studio/services"],
    [hasWork, "Ít nhất một ảnh tác phẩm", "/studio/works"],
  ]

  return (
    <Card className="p-4">
      <p className="font-semibold">{pro.published ? "Hồ sơ đang hiển thị với khách" : "Hồ sơ chưa hiển thị với khách"}</p>
      <ul className="mt-2 space-y-1.5 text-[13px]">
        {items.map(([done, text, href]) => (
          <li key={text} className="flex items-center gap-2">
            {done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted" />}
            {done ? (
              <span className="text-ink-soft">{text}</span>
            ) : (
              <Link href={href} className="text-rose underline underline-offset-2">
                {text}
              </Link>
            )}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-success" />
          <span className="text-ink-soft">Giờ làm việc (đặt ở trên)</span>
        </li>
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
      <Button
        className="mt-3"
        variant={pro.published ? "ghost" : "primary"}
        disabled={busy || (!pro.published && !ready)}
        onClick={async () => {
          setBusy(true)
          const result = await saveProProfile({ published: !pro.published })
          setBusy(false)
          if (!result.ok) return setError(result.error)
          setError(null)
          refresh()
        }}
      >
        {pro.published ? "Ẩn hồ sơ" : "Mở hồ sơ cho khách"}
      </Button>
    </Card>
  )
}

function WorkingHoursEditor({ onError }: { onError: (message: string | null) => void }) {
  const refresh = useRefresh()
  // Six days, nine to seven, is where most freelancers start; they edit from here.
  const [days, setDays] = React.useState<Record<number, { on: boolean; start: number; end: number }>>(() =>
    Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, { on: d !== 0, start: 540, end: 1140 }])),
  )
  const [busy, setBusy] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  return (
    <Card className="p-4">
      <p className="font-semibold">Giờ làm việc</p>
      <p className="mt-0.5 text-xs text-muted">
        Khách chỉ thấy khung giờ nằm trong đây, đã trừ thời lượng dịch vụ và thời gian di chuyển.
      </p>
      <ul className="mt-3 space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
          const day = days[weekday]
          return (
            <li key={weekday} className="flex flex-wrap items-center gap-2">
              <span className="w-20 text-[13px]">{DAYS[weekday]}</span>
              <Toggle
                label={`Làm việc ${DAYS[weekday]}`}
                checked={day.on}
                onChange={(on) => setDays((d) => ({ ...d, [weekday]: { ...d[weekday], on } }))}
              />
              {day.on && (
                <>
                  <select
                    aria-label={`Bắt đầu ${DAYS[weekday]}`}
                    className={cn(inputClass, "h-9 w-24 text-sm")}
                    value={day.start}
                    onChange={(e) => setDays((d) => ({ ...d, [weekday]: { ...d[weekday], start: Number(e.target.value) } }))}
                  >
                    {HOURS.slice(0, 24).map((m) => (
                      <option key={m} value={m}>
                        {label(m)}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted">–</span>
                  <select
                    aria-label={`Kết thúc ${DAYS[weekday]}`}
                    className={cn(inputClass, "h-9 w-24 text-sm")}
                    value={day.end}
                    onChange={(e) => setDays((d) => ({ ...d, [weekday]: { ...d[weekday], end: Number(e.target.value) } }))}
                  >
                    {HOURS.filter((m) => m > day.start).map((m) => (
                      <option key={m} value={m}>
                        {label(m)}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </li>
          )
        })}
      </ul>
      <Button
        size="sm"
        className="mt-3"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          onError(null)
          const windows = Object.entries(days)
            .filter(([, d]) => d.on)
            .map(([weekday, d]) => ({ weekday: Number(weekday), startMin: d.start, endMin: d.end }))
          const result = await saveWorkingHours(windows)
          setBusy(false)
          if (!result.ok) return onError(result.error)
          setSaved(true)
          refresh()
        }}
      >
        {busy ? "Đang lưu…" : "Lưu giờ làm việc"}
      </Button>
      {saved && <span className="ml-2 text-sm text-success">Đã lưu.</span>}
    </Card>
  )
}

/**
 * Time off. A day off does not cancel a booking somebody already made -- the
 * server refuses and says how many are in the way, because those are appointments
 * a person is expecting, not calendar entries.
 */
function DaysOffEditor({ onError }: { onError: (message: string | null) => void }) {
  const refresh = useRefresh()
  const [rows, setRows] = React.useState<DayOff[] | null>(null)
  const [from, setFrom] = React.useState(todayISO())
  const [to, setTo] = React.useState(todayISO())
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let live = true
    void listDaysOff().then((list) => live && setRows(list))
    return () => {
      live = false
    }
  }, [])

  return (
    <Card className="p-4">
      <p className="font-semibold">Ngày nghỉ</p>
      <p className="mt-0.5 text-xs text-muted">Khách sẽ không thấy khung giờ nào trong những ngày này.</p>

      {rows && rows.length > 0 && (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1">
                {row.startsOn === row.endsOn ? row.startsOn : `${row.startsOn} → ${row.endsOn}`}
                {row.reason && <span className="ml-2 text-muted">{row.reason}</span>}
              </span>
              <button
                type="button"
                className="text-muted hover:text-danger"
                onClick={async () => {
                  const result = await removeDayOff(row.id)
                  if (!result.ok) return onError(result.error)
                  setRows((current) => (current ?? []).filter((r) => r.id !== row.id))
                  refresh()
                }}
              >
                Xoá
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="Từ ngày">
          <input
            type="date"
            className={cn(inputClass, "text-sm")}
            value={from}
            min={todayISO()}
            onChange={(e) => {
              setFrom(e.target.value)
              if (to < e.target.value) setTo(e.target.value)
            }}
          />
        </Field>
        <Field label="Đến ngày">
          <input
            type="date"
            className={cn(inputClass, "text-sm")}
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-2">
        <Field label="Lý do (tuỳ chọn)">
          <input
            className={cn(inputClass, "text-sm")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Về quê, đi học, nghỉ phép…"
          />
        </Field>
      </div>
      <Button
        size="sm"
        className="mt-3"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          onError(null)
          const result = await addDayOff(from, to, reason)
          setBusy(false)
          if (!result.ok) return onError(result.error)
          setRows(await listDaysOff())
          setReason("")
          refresh()
        }}
      >
        {busy ? "Đang lưu…" : "Thêm ngày nghỉ"}
      </Button>
    </Card>
  )
}
