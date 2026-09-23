"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, Field, PageHeader, inputClass } from "@/components/ui"
import { CATEGORIES, VERTICALS } from "@/lib/catalog"
import { becomePro } from "@/lib/auth/actions"
import { CITIES, districtsOf } from "@/lib/geo"
import { useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Opening a freelancer profile. Deliberately short: a profile stays unlisted
 * until it has a service with a price, working hours and a photo of real work,
 * so asking for all of that up front would only lose people at step one.
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
      <PageHeader title="Mở hồ sơ chuyên viên" back />
      <p className="text-sm text-ink-soft">
        Ba thông tin để bắt đầu. Hồ sơ chỉ hiện với khách khi bạn đã thêm dịch vụ, giờ làm việc và ít nhất một ảnh tác
        phẩm.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!valid) return
          setBusy(true)
          setError(null)
          const result = await becomePro({ title: title.trim(), city, district, categories })
          setBusy(false)
          if (!result.ok) return setError(result.error)
          router.replace("/studio/services")
        }}
      >
        <Field label="Bạn làm nghề gì?" hint="Khách thấy dòng này dưới tên bạn.">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chuyên viên nail"
          />
        </Field>

        <div>
          <p className="mb-2 text-[13px] font-semibold">Bạn làm gì?</p>
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
                        categories.includes(c.id) ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink/30",
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
          <p className="mt-1.5 text-xs text-muted">Bạn chỉ đăng được dịch vụ thuộc chuyên môn đã chọn.</p>
        </div>

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
