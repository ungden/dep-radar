"use client"

import * as React from "react"
import { Ban, Trash2 } from "lucide-react"
import { Button, Card, Field, inputClass } from "@/components/ui"
import { actions, useAct, type Result } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import { cn, formatDateLong, localDate, localTime, todayISO } from "@/lib/utils"

/**
 * "Chặn giờ": a few hours off inside a working day (a school run, another
 * client booked by phone). Whole days off live in the profile editor.
 *
 * TODO(db-merge): the database side is being added in parallel. This expects
 *   state.myTimeBlocks: { id, date: "yyyy-mm-dd", from: "HH:mm", to: "HH:mm", note }[]
 *     (startsAt/endsAt timestamps are accepted too, see normalise())
 *   actions.addTimeBlock({ date, from, to, note }): Promise<Result>
 *   actions.removeTimeBlock(id): Promise<Result>
 * Until all three exist the section renders nothing, so nobody is shown a form
 * that cannot save. Align the names/shape here when the DB branch lands.
 */
type RawBlock = {
  id: string
  date?: string
  from?: string
  to?: string
  startsAt?: string
  endsAt?: string
  note?: string | null
}
type Block = { id: string; date: string; from: string; to: string; note: string }

type TimeBlockActions = {
  addTimeBlock?: (input: { date: string; from: string; to: string; note: string }) => Promise<Result>
  removeTimeBlock?: (id: string) => Promise<Result>
}

function normalise(raw: RawBlock): Block | null {
  if (raw.startsAt && raw.endsAt) {
    return { id: raw.id, date: localDate(raw.startsAt), from: localTime(raw.startsAt), to: localTime(raw.endsAt), note: raw.note ?? "" }
  }
  if (raw.date && raw.from && raw.to) return { id: raw.id, date: raw.date, from: raw.from.slice(0, 5), to: raw.to.slice(0, 5), note: raw.note ?? "" }
  return null
}

export function TimeBlocks() {
  const state = useApp()
  const act = useAct()
  const api = actions as typeof actions & TimeBlockActions
  const raw = (state as typeof state & { myTimeBlocks?: RawBlock[] }).myTimeBlocks
  const today = todayISO()
  const [date, setDate] = React.useState(today)
  const [from, setFrom] = React.useState("12:00")
  const [to, setTo] = React.useState("14:00")
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (!Array.isArray(raw) || typeof api.addTimeBlock !== "function" || typeof api.removeTimeBlock !== "function") return null
  const add = api.addTimeBlock
  const remove = api.removeTimeBlock

  const blocks = raw
    .map(normalise)
    .filter((b): b is Block => b !== null && b.date >= today)
    .sort((a, b) => `${a.date}${a.from}`.localeCompare(`${b.date}${b.from}`))

  return (
    <Card className="mt-6 p-4">
      <p className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
        <Ban className="size-4 text-accent" /> Chặn giờ
      </p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        Bận vài tiếng trong ngày? Chặn lại để khách không đặt vào đó. Nghỉ cả ngày thì thêm ở trang Hồ sơ.
      </p>

      {blocks.length > 0 && (
        <ul className="mt-3 space-y-2">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-canvas px-3 py-2 text-[14px]">
              <span className="min-w-0 flex-1">
                <span className="font-medium">
                  {formatDateLong(b.date)} · {b.from}–{b.to}
                </span>
                {b.note && <span className="block truncate text-[13px] text-muted">{b.note}</span>}
              </span>
              <button
                type="button"
                aria-label={`Bỏ chặn ${b.from}–${b.to} ${formatDateLong(b.date)}`}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-subtle hover:text-danger"
                onClick={() => void act(() => remove(b.id), "Đã bỏ chặn giờ").then(setError)}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-3"
        onSubmit={async (e) => {
          e.preventDefault()
          if (to <= from) return setError("Giờ kết thúc phải sau giờ bắt đầu.")
          setBusy(true)
          const problem = await act(() => add({ date, from, to, note: note.trim() }), "Đã chặn giờ")
          setBusy(false)
          setError(problem)
          if (!problem) setNote("")
        }}
      >
        <div className="grid grid-cols-3 gap-2">
          <Field label="Ngày">
            <input type="date" required className={cn(inputClass, "text-sm")} value={date} min={today} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Từ">
            <input type="time" required step={1800} className={cn(inputClass, "text-sm")} value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Đến">
            <input type="time" required step={1800} className={cn(inputClass, "text-sm")} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <Field label="Ghi chú (tuỳ chọn)" className="mt-2">
          <input className={cn(inputClass, "text-sm")} value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="Đón con, khách quen hẹn riêng…" />
        </Field>
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="sm" className="mt-3" disabled={busy}>
          {busy ? "Đang lưu…" : "Chặn giờ này"}
        </Button>
      </form>
    </Card>
  )
}
