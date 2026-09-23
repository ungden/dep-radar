"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, Field, PageHeader, inputClass } from "@/components/ui"
import { CATEGORIES, VERTICALS } from "@/lib/catalog"
import { saveWorkingHours } from "@/lib/api/actions"
import { listWorkingHours } from "@/lib/api/me"
import { becomePro } from "@/lib/auth/actions"
import { CITIES, districtsOf } from "@/lib/geo"
import { useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DEFAULT_WORKING_WINDOWS } from "@/lib/working-hours"

/**
 * Opening a freelancer profile. Deliberately short: a profile stays unlisted
 * until it has a service with a price, working hours and a photo of real work,
 * so asking for all of that up front would only lose people at step one.
 * The hours are saved here with defaults; the rest is the studio checklist.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { session } = useApp()
  const [title, setTitle] = React.useState("")
  const [city, setCity] = React.useState(CITIES[0])
  const [district, setDistrict] = React.useState(districtsOf(CITIES[0])[0])
  const [categories, setCategories] = React.useState<CategoryId[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (session?.proId) {
    router.replace("/studio")
    return null
  }

  const toggle = (id: CategoryId) =>
    setCategories((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  const valid = title.trim().length >= 3 && categories.length > 0

  return (
    <div className="mx-auto max-w-md px-5 pb-24">
      <PageHeader title="Mở hồ sơ đối tác" back />
      <p className="text-sm text-ink-soft">
        Ba thông tin để bắt đầu. Giờ làm được đặt sẵn Thứ 2 – Thứ 7, 9:00 – 19:00 (sửa được sau). Hồ sơ hiện với khách
        khi bạn đã thêm dịch vụ, một ảnh tác phẩm và bấm mở hồ sơ.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!valid) return
          setBusy(true)
          setError(null)
          const result = await becomePro({ title: title.trim(), city, district, categories })
          if (!result.ok) {
            setBusy(false)
            return setError(result.error)
          }
          // Store a starting week now, so the hours the studio shows are real
          // rows and opening the profile later cannot fail on them. Best effort:
          // if it does not go through, the studio checklist says so. Never over
          // a week that is already there (becomePro also answers ok for an
          // existing profile).
          try {
            if (!(await listWorkingHours()).length) await saveWorkingHours(DEFAULT_WORKING_WINDOWS)
          } catch {
            // The checklist on the studio page shows the step as not done.
          }
          setBusy(false)
          router.replace("/studio/services")
        }}
      >
        <div>
          <p className="mb-2 text-[15px] font-semibold">Bạn nhận làm việc gì?</p>
          <p className="-mt-1 mb-3 text-[13px] text-muted">Chọn một hoặc nhiều. Bạn chỉ đăng được dịch vụ thuộc những mục đã chọn.</p>
          <div className="space-y-3">
            {VERTICALS.map((v) => (
              <div key={v.id}>
                <p className="mb-1.5 text-[13px] text-muted">{v.label}</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.vertical === v.id).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={categories.includes(c.id)}
                      onClick={() => toggle(c.id)}
                      className={cn(
                        "h-10 rounded-full border px-4 text-[14px] font-medium transition-colors",
                        categories.includes(c.id) ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:border-ink/30",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {categories.some((c) => c.startsWith("model-")) && (
            <p className="mt-2 rounded-[var(--radius-md)] bg-subtle px-3 py-2 text-[13px] text-ink-soft">
              Dịch vụ người mẫu chỉ mở sau khi bạn xác minh danh tính (CCCD + ảnh chân dung), để bên thuê và bạn đều an toàn.
            </p>
          )}
        </div>

        <Field label="Dòng giới thiệu dưới tên" hint="Khách thấy dòng này ngay dưới tên bạn. Sửa được sau.">
          <input
            className={inputClass}
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Thợ nail tại nhà · Chụp ảnh sự kiện · Mẫu ảnh"
          />
        </Field>

        <Field label="Bạn nhận khách ở đâu?" hint="Dùng để tính khoảng cách và phí di chuyển.">
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Tỉnh/thành"
              className={cn(inputClass, "text-sm")}
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setDistrict(districtsOf(e.target.value)[0])
              }}
            >
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Quận/huyện"
              className={cn(inputClass, "text-sm")}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              {districtsOf(city).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-3 text-[13px] text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy || !valid}>
          {busy ? "Đang tạo hồ sơ…" : "Tạo hồ sơ"}
        </Button>
      </form>
    </div>
  )
}
