"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, Field, PageHeader, inputClass } from "@/components/ui"
import { IDENTITY_VERIFICATION_OPEN } from "@/lib/launch"
import { CATEGORIES, VERTICALS } from "@/lib/catalog"
import { fetchPartnerSetup, saveProProfile } from "@/lib/api/actions"
import { becomePro } from "@/lib/auth/actions"
import { CITIES, districtsOf } from "@/lib/geo"
import { useApp } from "@/lib/store"
import type { CategoryId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { RequireSession } from "@/components/require-session"
import { PartnerProgress } from "@/components/partner-progress"

/**
 * Opening a freelancer profile. Deliberately short: a profile stays unlisted
 * until it has a service with a price, working hours and a photo of real work,
 * so asking for all of that up front would only lose people at step one.
 * The hours are saved here with defaults; the rest is the studio checklist.
 */
export default function OnboardingPage() { return <RequireSession><OnboardingForm /></RequireSession> }

function OnboardingForm() {
  const router = useRouter()
  const { session } = useApp()
  const [title, setTitle] = React.useState("")
  const [city, setCity] = React.useState(CITIES[0])
  const [district, setDistrict] = React.useState(districtsOf(CITIES[0])[0])
  const [categories, setCategories] = React.useState<CategoryId[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!session?.proId) return
    let live = true
    void fetchPartnerSetup().then(({ profile: p }) => { if (live && p) { setTitle(p.title); setCity(p.city); setDistrict(p.district); setCategories(p.categories) } }).catch((e: Error) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [session?.proId])

  const toggle = (id: CategoryId) =>
    setCategories((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  const valid = title.trim().length >= 3 && categories.length > 0

  return (
    <div className="mx-auto max-w-md px-5 pb-24">
      {session?.proId && <PartnerProgress />}
      <PageHeader title="Mở hồ sơ đối tác" back />
      <p className="text-sm text-ink-soft">
        Chọn nghề và khu vực để tạo bản nháp. Sau đó chọn gói và mức giá, nơi phục vụ, xác nhận giờ làm và đăng tác phẩm trước khi gửi duyệt.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!valid) return
          setBusy(true)
          setError(null)
          const result = session?.proId
            ? await saveProProfile({ title: title.trim(), city, district, categories })
            : await becomePro({ title: title.trim(), city, district, categories })
          if (!result.ok) { setBusy(false); return setError(result.error) }
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
                  {CATEGORIES.filter((c) => c.vertical === v.id).map((c) => {
                    // Model services need a verified identity, which opens later (lib/launch.ts).
                    const later = !IDENTITY_VERIFICATION_OPEN && c.vertical === "model"
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={later}
                        aria-pressed={categories.includes(c.id)}
                        onClick={() => toggle(c.id)}
                        className={cn(
                          "h-10 rounded-full border px-4 text-[14px] font-medium transition-colors disabled:opacity-50",
                          categories.includes(c.id) ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:border-ink/30",
                        )}
                      >
                        {c.label}
                        {later && " · sắp mở"}
                      </button>
                    )
                  })}
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
          {busy ? "Đang tạo hồ sơ…" : session?.proId ? "Lưu nghề & khu vực" : "Tạo bản nháp"}
        </Button>
      </form>
    </div>
  )
}
