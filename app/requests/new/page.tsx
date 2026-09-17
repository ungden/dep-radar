"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CATEGORY_ICON } from "@/components/beauty"
import { RequireSession } from "@/components/require-session"
import { BottomBar, Button, Field, PageHeader, inputClass } from "@/components/ui"
import { CATEGORIES, CITIES, DISTRICTS } from "@/lib/data"
import { TIME_SLOTS, actions, useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"
import { addDays, cn, todayISO } from "@/lib/utils"

const BUDGETS = [
  { label: "Dưới 300k", min: 100000, max: 300000 },
  { label: "300k - 500k", min: 300000, max: 500000 },
  { label: "500k - 1 triệu", min: 500000, max: 1000000 },
  { label: "1 - 3 triệu", min: 1000000, max: 3000000 },
]

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Đăng yêu cầu" back />
      <RequireSession role="customer">
        <NewRequestForm />
      </RequireSession>
    </div>
  )
}

function NewRequestForm() {
  const router = useRouter()
  const { city: preferredCity } = useApp()
  const [category, setCategory] = React.useState<CategoryId>("nail")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [date, setDate] = React.useState(addDays(todayISO(), 2))
  const [time, setTime] = React.useState("16:00")
  const [city, setCity] = React.useState(preferredCity ?? "Hà Nội")
  const [district, setDistrict] = React.useState(DISTRICTS[preferredCity ?? "Hà Nội"][0])
  const [atHome, setAtHome] = React.useState(true)
  const [budget, setBudget] = React.useState(1)

  const valid = title.trim().length >= 6 && date >= todayISO()

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        const id = actions.createJob({
          category,
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          city,
          district,
          atHome,
          budgetMin: BUDGETS[budget].min,
          budgetMax: BUDGETS[budget].max,
        })
        router.replace(`/requests/${id}`)
      }}
    >
      <p className="rounded-2xl bg-blush px-4 py-3 text-[13px] text-rose-dark">
        Freelancer phù hợp ở khu vực của bạn sẽ gửi báo giá. Bạn so sánh hồ sơ, giá và chọn người ưng ý nhất.
      </p>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Bạn cần làm gì?</legend>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.id]
            const active = c.id === category
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-[11px] transition-colors",
                  active ? "border-rose bg-blush font-semibold text-rose-dark" : "border-line bg-surface text-ink-soft",
                )}
              >
                <Icon className="size-5" />
                {c.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <Field label="Tiêu đề">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Makeup + làm tóc đi đám cưới"
          maxLength={80}
        />
      </Field>

      <Field label="Mô tả chi tiết" hint="Tình trạng da/móng/tóc, phong cách mong muốn, số người...">
        <textarea
          className={cn(inputClass, "resize-none")}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="VD: Da mình hơi dầu, muốn makeup trong trẻo, bền đến tối..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ngày">
          <input type="date" className={inputClass} value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Giờ bắt đầu">
          <select className={inputClass} value={time} onChange={(e) => setTime(e.target.value)}>
            {["06:00", "07:00", "08:00", ...TIME_SLOTS].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Tỉnh/thành">
          <select
            className={inputClass}
            value={city}
            onChange={(e) => {
              setCity(e.target.value)
              setDistrict(DISTRICTS[e.target.value][0])
            }}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Quận/huyện">
          <select className={inputClass} value={district} onChange={(e) => setDistrict(e.target.value)}>
            {DISTRICTS[city].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Địa điểm</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, l: "Làm tại nhà tôi" },
            { v: false, l: "Tôi đến studio" },
          ].map((o) => (
            <button
              key={o.l}
              type="button"
              aria-pressed={atHome === o.v}
              onClick={() => setAtHome(o.v)}
              className={cn(
                "h-11 rounded-xl border text-sm",
                atHome === o.v ? "border-rose bg-blush font-medium text-rose-dark" : "border-line bg-surface text-ink-soft",
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Ngân sách</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BUDGETS.map((b, i) => (
            <button
              key={b.label}
              type="button"
              aria-pressed={budget === i}
              onClick={() => setBudget(i)}
              className={cn(
                "h-11 rounded-xl border text-sm",
                budget === i ? "border-rose bg-blush font-medium text-rose-dark" : "border-line bg-surface text-ink-soft",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </fieldset>

      <BottomBar>
        <Button type="submit" size="lg" className="w-full" disabled={!valid}>
          Đăng yêu cầu
        </Button>
      </BottomBar>
    </form>
  )
}
