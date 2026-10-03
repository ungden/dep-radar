"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, CheckCircle2, Circle } from "lucide-react"
import { PartnerProgress } from "@/components/partner-progress"
import { RequireSession } from "@/components/require-session"
import { Avatar, Button, Card, Field, PageHeader, Toggle, inputClass } from "@/components/ui"
import { saveProProfile, saveWorkingHours, submitPartnerProfile, fetchPartnerSetup } from "@/lib/api/actions"
import { addDayOff, listDaysOff, removeDayOff, type DayOff } from "@/lib/api/me"
import { verticalOf } from "@/lib/catalog"
import { actions, useAct } from "@/lib/client-actions"
import { proView, servicesOf, useApp, useRefresh, worksOf } from "@/lib/store"
import { uploadImage } from "@/lib/uploads"
import { cn, todayISO } from "@/lib/utils"
import { DEFAULT_WORKING_WINDOWS } from "@/lib/working-hours"

const DAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
const HOURS = Array.from({ length: 49 }, (_, i) => i * 30)
const label = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

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
  const [equipment, setEquipment] = React.useState(pro.equipment ?? "")
  const shoots = pro.categories.some((c) => verticalOf(c) === "photo")
  const models = pro.categories.some((c) => verticalOf(c) === "model")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  // A verified freelancer is shown under the name on their ID card.
  const nameLocked = pro.identity === "verified"

  // Readiness uses persisted services, work and confirmed hours.
  const hasService = servicesOf(state, proId).length > 0
  // A post the review hid does not count, as in the database.
  const hasWork = worksOf(state, proId).some((w) => !w.hiddenReason)
  const hours = useWorkingWeek()

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
      ...(shoots ? { equipment } : {}),
    })
    setBusy(false)
    if (!result.ok) return setError(result.error)
    setSaved(true)
    refresh()
  }

  return (
    <div className="space-y-5">
      <PartnerProgress />
      <Link href="/studio/onboarding" className="text-sm text-accent underline">Sửa nghề và khu vực phục vụ</Link>
      <Card className="flex items-center gap-4 p-4">
        <span className="relative">
          {avatar ? (
            <Image src={avatar} alt="" width={64} height={64} className="size-16 rounded-full object-cover" />
          ) : (
            <Avatar name={displayName} tone={pro.tone} size={64} />
          )}
          <label className="absolute -bottom-1 -right-1 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-accent text-white">
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

      <Field label="Dòng giới thiệu dưới tên" hint="VD: Thợ nail tại nhà · Chụp ảnh sự kiện · Mẫu ảnh thời trang">
        <input className={inputClass} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field label="Giới thiệu" hint="Bạn làm mạnh kiểu gì, dùng sản phẩm gì, khách thường khen điều gì.">
        <textarea
          rows={4}
          className={cn(inputClass, "resize-none")}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </Field>

      {shoots && (
        <Field label="Bạn chụp, quay bằng gì?" hint="Khách chụp ảnh hay hỏi điều này đầu tiên. VD: iPhone 16 Pro Max, Sony A7 IV + lens 35mm.">
          <input className={inputClass} value={equipment} maxLength={120} onChange={(e) => setEquipment(e.target.value)} />
        </Field>
      )}

      <Card id="noi-phuc-vu" className="space-y-3 p-4">
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
            className="w-full accent-[var(--color-accent)]"
          />
        </Field>
        <Field label="Địa chỉ studio (nếu có)" hint="Có studio thì bạn nhận được cả dịch vụ chỉ làm tại chỗ.">
          <input className={inputClass} value={studio} onChange={(e) => setStudio(e.target.value)} />
        </Field>
      </Card>

      {models && <ModelCardEditor />}

      <WorkingHoursEditor hours={hours} onError={setError} />

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

      <PublishBox hasService={hasService} hasWork={hasWork} hours={hours} />
    </div>
  )
}

type Week = Record<number, { on: boolean; start: number; end: number }>

/** The editor's starting point: the default windows, as toggles. */
const defaultWeek = (): Week =>
  Object.fromEntries(
    [0, 1, 2, 3, 4, 5, 6].map((d) => {
      const window = DEFAULT_WORKING_WINDOWS.find((w) => w.weekday === d)
      return [d, window ? { on: true, start: window.startMin, end: window.endMin } : { on: false, start: 540, end: 1140 }]
    }),
  )

const windowsOf = (week: Week) =>
  Object.entries(week)
    .filter(([, d]) => d.on)
    .map(([weekday, d]) => ({ weekday: Number(weekday), startMin: d.start, endMin: d.end }))

/**
 * The week as saved in the database, plus the editor's unsaved copy. `saved`
 * is what the publish check reads: the defaults on screen are not hours until
 * they are stored.
 */
function useWorkingWeek() {
  const refresh = useRefresh()
  const [week, setWeek] = React.useState<Week>(defaultWeek)
  const [loaded, setLoaded] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const [extra, setExtra] = React.useState<{ weekday: number; startMin: number; endMin: number }[]>([])
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [attempt, setAttempt] = React.useState(0)
  React.useEffect(() => {
    let live = true
    void fetchPartnerSetup().then((setup) => {
      if (!live) return
      const windows = [...setup.hours].sort((a, b) => a.weekday - b.weekday || a.startMin - b.startMin)
      if (windows.length) {
        const next = defaultWeek()
        const additional: typeof extra = []
        for (const day of [0, 1, 2, 3, 4, 5, 6]) next[day] = { ...next[day], on: false }
        for (const window of windows) {
          if (next[window.weekday].on) additional.push(window)
          else next[window.weekday] = { on: true, start: window.startMin, end: window.endMin }
        }
        setWeek(next); setExtra(additional)
      }
      setSaved(Boolean(setup.profile?.hours_confirmed && windows.length))
      setLoadError(null); setLoaded(true)
    }).catch(() => { if (live) setLoadError("Không tải được giờ đã lưu. Thử lại trước khi chỉnh sửa.") })
    return () => { live = false }
  }, [attempt])

  /** Store the week as shown. Returns an error sentence, or null. */
  const save = async (): Promise<string | null> => {
    const windows = [...windowsOf(week), ...extra.filter((w) => week[w.weekday].on)]
    const result = await saveWorkingHours(windows)
    if (!result.ok) return result.error
    setSaved(windows.length > 0)
    refresh()
    return null
  }

  return { week, setWeek, extra, setExtra, loaded, saved, loadError, retry: () => setAttempt((n) => n + 1), save, anyDay: windowsOf(week).length > 0 }
}

type WorkingWeek = ReturnType<typeof useWorkingWeek>

/**
 * A profile only goes public when it can actually take a booking, and once the
 * review has approved it. "Mở hồ sơ" on a profile never approved asks for the
 * review (the database makes it 'pending'); the answer usually comes in a
 * minute or two, so the box looks again on its own while it waits.
 */
function PublishBox({ hasService, hasWork, hours }: { hasService: boolean; hasWork: boolean; hours: WorkingWeek }) {
  const state = useApp()
  const refresh = useRefresh()
  const pro = proView(state, state.session!.proId!)!
  const [error, setError] = React.useState<string | null>(null)
  const [agreed, setAgreed] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const status = pro.reviewStatus
  const pending = !pro.published && status === "pending"
  const refused = !pro.published && (status === "changes_requested" || status === "rejected")
  const reasons = (pro.reviewNote ?? "").split("\n").map((s) => s.trim()).filter(Boolean)

  const refreshRef = React.useRef(refresh)
  React.useEffect(() => {
    refreshRef.current = refresh
  })
  React.useEffect(() => {
    if (!pending) return
    let rounds = 0
    const timer = setInterval(() => {
      rounds++
      refreshRef.current()
      if (rounds >= 15) clearInterval(timer)
    }, 20_000)
    return () => clearInterval(timer)
  }, [pending])

  // Publishing requires hours explicitly confirmed in the database.
  const hoursReady = hours.saved
  const locationReady = Boolean(pro.homeService || pro.studioAddress?.trim())
  const ready = hasService && hasWork && hoursReady && locationReady
  const items: [boolean, string, string][] = [
    [locationReady, "Nơi phục vụ đã lưu: tại nhà khách hoặc studio", "#noi-phuc-vu"],
    [hasService, "Ít nhất một dịch vụ đang bật, có giá", "/studio/services"],
    [hasWork, "Ít nhất một ảnh tác phẩm", "/studio/works"],
    [
      hours.saved,
      hours.saved
        ? "Giờ làm việc đã lưu"
        : hours.anyDay
          ? "Giờ làm việc chưa lưu: bấm Lưu giờ làm việc trước"
          : "Giờ làm việc: bật ít nhất một ngày ở trên",
      "#gio-lam",
    ],
  ]

  const heading = pro.published
    ? "Hồ sơ đang hiển thị với khách"
    : pending
      ? "Đang chờ duyệt (thường vài phút)"
      : status === "changes_requested"
        ? "Hồ sơ cần chỉnh trước khi hiện với khách"
        : status === "rejected"
          ? "Hồ sơ chưa được duyệt"
          : "Hồ sơ chưa hiển thị với khách"

  return (
    <Card id="mo-ho-so" className="scroll-mt-20 p-4">
      <p className="font-semibold">{heading}</p>
      {pro.published && !pro.acceptingJobs && <p className="mt-2 text-sm text-warning">Bạn đang tạm nghỉ nhận khách. <Link href="/studio" className="underline">Bật nhận khách mới</Link> khi sẵn sàng.</p>}
      {pending && (
        <p className="mt-1 text-[13px] text-ink-soft">
          360dep đang xem ảnh, dịch vụ và phần giới thiệu của bạn. Duyệt xong bạn nhận thông báo, và khách thấy hồ sơ ngay.
        </p>
      )}
      {refused && reasons.length > 0 && (
        <div className="mt-2 rounded-xl bg-warning-soft px-3 py-2.5 text-[13px]">
          <p className="font-semibold text-warning">Cần sửa:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-ink">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-ink-soft">Sửa xong bấm “Gửi duyệt lại”.</p>
        </div>
      )}
      {!pending && (
        <ul className="mt-2 space-y-1.5 text-[13px]">
          {items.map(([done, text, href]) => (
            <li key={href} className="flex items-center gap-2">
              {done ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0 text-muted" />}
              {done ? (
                <span className="text-ink-soft">{text}</span>
              ) : (
                <Link href={href} className="text-accent underline underline-offset-2">
                  {text}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
      {!pro.published && !pending && <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> <span>Tôi đồng ý <Link href="/chinh-sach" className="underline">chính sách phí, nhận việc và hủy lịch</Link>.</span></label>}
      {!pending && (
        <Button
          className="mt-3"
          variant={pro.published ? "ghost" : "primary"}
          disabled={busy || (!pro.published && (!ready || !agreed))}
          onClick={async () => {
            setBusy(true)
            setError(null)
            const result = pro.published ? await saveProProfile({ published: false }) : await submitPartnerProfile(agreed)
            setBusy(false)
            if (!result.ok) return setError(result.error)
            refresh()
          }}
        >
          {busy ? "Đang lưu…" : pro.published ? "Ẩn hồ sơ" : refused ? "Gửi duyệt lại" : "Gửi hồ sơ để duyệt"}
        </Button>
      )}
      {!pro.published && !pending && status !== "approved" && (
        <p className="mt-2 text-xs text-muted">Hồ sơ mới được 360dep duyệt trước khi hiện với khách, thường trong vài phút.</p>
      )}
    </Card>
  )
}

function WorkingHoursEditor({ hours, onError }: { hours: WorkingWeek; onError: (message: string | null) => void }) {
  const { week: days, setWeek: setDays, loaded, saved: stored } = hours
  const [busy, setBusy] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  return (
    <Card id="gio-lam" className="scroll-mt-20 p-4">
      <p className="font-semibold">Giờ làm việc</p>
      <p className="mt-0.5 text-xs text-muted">
        Khách thấy giờ đã lưu, đã trừ thời lượng dịch vụ và thời gian di chuyển. Thay đổi bên dưới chỉ có hiệu lực sau khi bấm Lưu.
      </p>
      {loaded && !stored && (
        <p className="mt-2 rounded-[var(--radius-md)] bg-warning-soft px-3 py-2 text-[13px] text-warning">
          Chưa lưu. Giờ bên dưới là gợi ý (Thứ 2 – Thứ 7, 9:00 – 19:00); khách chưa đặt được cho tới khi bạn lưu.
        </p>
      )}
      {hours.loadError && <p role="alert" className="mt-2 text-sm text-danger">{hours.loadError} <button type="button" className="underline" onClick={hours.retry}>Thử lại</button></p>}
      <ul className="mt-3 space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
          const day = days[weekday]
          return (
            <li key={weekday} className="flex flex-wrap items-center gap-2">
              <span className="w-20 text-[13px]">{DAYS[weekday]}</span>
              <Toggle
                label={`Làm việc ${DAYS[weekday]}`}
                checked={day.on}
                disabled={!loaded || busy}
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
                    {[...new Set([...HOURS.filter((m) => m < 1440), day.start])].sort((a, b) => a - b).map((m) => (
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
                    {[...new Set([...HOURS.filter((m) => m > day.start), day.end])].sort((a, b) => a - b).map((m) => (
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
      {hours.extra.map((window, i) => days[window.weekday].on && <div key={i} className="mt-2 flex flex-wrap items-center gap-2">
        <span className="w-20 text-[13px]">{DAYS[window.weekday]}</span>
        <input aria-label={`Bắt đầu khoảng thêm ${i + 1}`} type="time" className={cn(inputClass, "h-9 w-28")} value={label(window.startMin)} onChange={(e) => { const [h, m] = e.target.value.split(":").map(Number); if (Number.isFinite(h + m)) hours.setExtra((xs) => xs.map((x, j) => j === i ? { ...x, startMin: h * 60 + m } : x)) }} />
        <span>–</span><input aria-label={`Kết thúc khoảng thêm ${i + 1}`} type="time" className={cn(inputClass, "h-9 w-28")} value={label(window.endMin)} onChange={(e) => { const [h, m] = e.target.value.split(":").map(Number); if (Number.isFinite(h + m)) hours.setExtra((xs) => xs.map((x, j) => j === i ? { ...x, endMin: h * 60 + m } : x)) }} />
        <Button size="sm" variant="ghost" onClick={() => hours.setExtra((xs) => xs.filter((_, j) => j !== i))}>Bỏ khoảng</Button>
      </div>)}
      <div className="mt-3 flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6, 0].filter((d) => days[d].on).map((d) => <Button key={d} size="sm" variant="ghost" disabled={!loaded || busy} onClick={() => hours.setExtra((xs) => [...xs, { weekday: d, startMin: days[d].end, endMin: Math.min(1440, days[d].end + 60) }])}>+ Khoảng giờ {DAYS[d]}</Button>)}</div>
      <Button
        size="sm"
        className="mt-3"
        disabled={busy || !loaded}
        onClick={async () => {
          setBusy(true)
          onError(null)
          const problem = await hours.save()
          setBusy(false)
          if (problem) return onError(problem)
          setSaved(true)
        }}
      >
        {busy ? "Đang lưu…" : loaded ? "Lưu giờ làm việc" : "Đang tải giờ làm việc…"}
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

/**
 * A model's card: what a client needs before booking. No body measurements:
 * they are not needed to book, and they are what casting scams collect.
 */
function ModelCardEditor() {
  const state = useApp()
  const act = useAct()
  const pro = proView(state, state.session!.proId!)!
  const m = pro.model
  const [height, setHeight] = React.useState(m?.heightCm ? String(m.heightCm) : "")
  const [topSize, setTopSize] = React.useState(m?.topSize ?? "")
  const [bottomSize, setBottomSize] = React.useState(m?.bottomSize ?? "")
  const [shoeSize, setShoeSize] = React.useState(m?.shoeSize ?? "")
  const [styles, setStyles] = React.useState((m?.styles ?? []).join(", "))
  const [accepts, setAccepts] = React.useState((m?.accepts ?? []).join(", "))
  const [refuses, setRefuses] = React.useState((m?.refuses ?? []).join(", "))
  const [error, setError] = React.useState<string | null>(null)
  const list = (v: string) =>
    v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10)

  return (
    <Card className="space-y-4 p-4">
      <div>
        <p className="text-[17px] font-bold tracking-tight">Thẻ người mẫu</p>
        <p className="text-[13px] text-ink-soft">Hiện trên hồ sơ để bên thuê biết bạn có hợp không. Không cần số đo ba vòng.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Chiều cao (cm)">
          <input inputMode="numeric" className={inputClass} value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))} />
        </Field>
        <Field label="Size áo">
          <input className={inputClass} value={topSize} maxLength={10} onChange={(e) => setTopSize(e.target.value)} placeholder="S, M…" />
        </Field>
        <Field label="Size quần">
          <input className={inputClass} value={bottomSize} maxLength={10} onChange={(e) => setBottomSize(e.target.value)} placeholder="26, M…" />
        </Field>
        <Field label="Size giày">
          <input className={inputClass} value={shoeSize} maxLength={10} onChange={(e) => setShoeSize(e.target.value)} placeholder="37" />
        </Field>
      </div>
      <Field label="Phong cách" hint="Cách nhau bằng dấu phẩy. VD: thanh lịch, năng động, Hàn Quốc">
        <input className={inputClass} value={styles} onChange={(e) => setStyles(e.target.value)} />
      </Field>
      <Field label="Nhận làm" hint="VD: lookbook, mẫu tay, livestream, clip TikTok">
        <input className={inputClass} value={accepts} onChange={(e) => setAccepts(e.target.value)} />
      </Field>
      <Field label="Không nhận" hint="Hiện rõ trên hồ sơ để không ai phải hỏi. VD: đồ bơi, chụp đêm">
        <input className={inputClass} value={refuses} onChange={(e) => setRefuses(e.target.value)} />
      </Field>
      {error && <p className="text-[14px] text-danger">{error}</p>}
      <Button
        variant="outline"
        onClick={() =>
          void act(
            () =>
              actions.saveModelProfile({
                heightCm: height ? Number(height) : null,
                topSize: topSize.trim(),
                bottomSize: bottomSize.trim(),
                shoeSize: shoeSize.trim(),
                styles: list(styles),
                accepts: list(accepts),
                refuses: list(refuses),
              }),
            "Đã lưu thẻ người mẫu",
          ).then(setError)
        }
      >
        Lưu thẻ người mẫu
      </Button>
    </Card>
  )
}
