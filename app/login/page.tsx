"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Briefcase, Sparkles } from "lucide-react"
import { Button, Field, Logo, PageHeader, inputClass, PageSkeleton } from "@/components/ui"
import { DEMO_CUSTOMER, DEMO_PRO_ID, getPro } from "@/lib/data"
import { actions } from "@/lib/store"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")
  const [role, setRole] = React.useState<Role>(params.get("role") === "pro" ? "pro" : "customer")
  const demoPro = getPro(DEMO_PRO_ID)!
  const [name, setName] = React.useState(role === "pro" ? demoPro.name : DEMO_CUSTOMER.name)
  const [phone, setPhone] = React.useState(role === "pro" ? "0968 000 111" : DEMO_CUSTOMER.phone)

  const pickRole = (r: Role) => {
    setRole(r)
    setName(r === "pro" ? demoPro.name : DEMO_CUSTOMER.name)
    setPhone(r === "pro" ? "0968 000 111" : DEMO_CUSTOMER.phone)
  }

  const valid = name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 9

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <PageHeader back />
      <Logo size="lg" />
      <h1 className="mt-4 text-2xl font-semibold">Đăng nhập</h1>
      <p className="mt-1 text-sm text-ink-soft">Chọn cách bạn muốn dùng dep360. Bạn có thể đổi chế độ bất cứ lúc nào.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <RoleCard
          active={role === "customer"}
          onClick={() => pickRole("customer")}
          icon={<Sparkles className="size-5" />}
          title="Tôi cần làm đẹp"
          text="Tìm mẫu, đặt lịch, đăng yêu cầu"
        />
        <RoleCard
          active={role === "pro"}
          onClick={() => pickRole("pro")}
          icon={<Briefcase className="size-5" />}
          title="Tôi là freelancer"
          text="Nhận job, quản lý lịch & dịch vụ"
        />
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          actions.signIn(
            role === "pro"
              ? { role, name: name.trim(), phone: phone.trim(), proId: DEMO_PRO_ID }
              : { role, name: name.trim(), phone: phone.trim() },
          )
          router.replace(next ?? (role === "pro" ? "/studio" : "/"))
        }}
      >
        <Field label="Họ và tên">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Số điện thoại" hint="Bản demo: không gửi OTP, dữ liệu chỉ lưu trên trình duyệt này.">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
        </Field>
        {role === "pro" && (
          <p className="rounded-xl bg-blush px-3.5 py-3 text-[13px] text-rose-dark">
            Chế độ freelancer demo sẽ dùng hồ sơ mẫu của <b>{demoPro.name}</b> ({demoPro.title}).
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={!valid}>
          Tiếp tục
        </Button>
      </form>

      <button type="button" onClick={() => router.push("/")} className="mx-auto mt-4 py-2 text-sm text-muted hover:text-ink">
        Xem trước, đăng nhập sau
      </button>
    </div>
  )
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        active ? "border-rose bg-blush" : "border-line bg-surface hover:border-blush-strong",
      )}
    >
      <span className={cn("flex size-9 items-center justify-center rounded-full", active ? "bg-rose text-white" : "bg-blush text-rose")}>
        {icon}
      </span>
      <span className="mt-3 block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs text-muted">{text}</span>
    </button>
  )
}
