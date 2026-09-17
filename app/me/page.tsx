"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Heart,
  Info,
  LogOut,
  MapPin,
  Megaphone,
  RotateCcw,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react"
import { Avatar, ButtonLink, Card, Skeleton, Toggle } from "@/components/ui"
import { DEMO_PRO_ID, getPro } from "@/lib/data"
import { DEMO_CUSTOMER, actions, useApp, useHydrated } from "@/lib/store"
import { formatPrice } from "@/lib/utils"

export default function MePage() {
  const hydrated = useHydrated()
  const router = useRouter()
  const state = useApp()
  const { session } = state

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 pt-16">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <h1 className="text-2xl font-semibold">Cá nhân</h1>
        <Card className="mt-4 p-5 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-blush text-rose">
            <UserRound className="size-7" />
          </span>
          <p className="mt-3 font-semibold">Bạn chưa đăng nhập</p>
          <p className="mt-1 text-sm text-muted">Đăng nhập để đặt lịch, lưu mẫu và nhận báo giá từ freelancer.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ButtonLink href="/login">Đăng nhập</ButtonLink>
            <ButtonLink href="/login?role=pro" variant="outline">
              Tôi là freelancer
            </ButtonLink>
          </div>
        </Card>
        <Menu items={commonItems} />
      </div>
    )
  }

  const isPro = session.role === "pro"
  const pro = isPro ? getPro(session.proId ?? DEMO_PRO_ID) : null
  const earnings = state.bookings
    .filter((b) => b.proId === DEMO_PRO_ID && b.status === "completed")
    .reduce((sum, b) => sum + b.total, 0)

  return (
    <div className="mx-auto max-w-2xl pt-4 md:pt-8">
      <div className="flex h-12 items-center justify-between">
        <h1 className="text-2xl font-semibold">Cá nhân</h1>
      </div>

      <Link href={isPro && pro ? `/pros/${pro.id}` : "/me"} className="mt-3 flex items-center gap-4">
        <Avatar name={session.name} tone={pro?.tone} size={64} />
        <div className="flex-1">
          <p className="text-lg font-semibold">{session.name}</p>
          <p className="text-sm text-muted">
            {isPro ? `${pro?.title} · Xem hồ sơ công khai` : session.phone}
          </p>
        </div>
        {isPro && <ChevronRight className="size-5 text-muted" />}
      </Link>

      <Card className="mt-5 flex items-center gap-3 p-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-blush text-rose">
          <ArrowLeftRight className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{isPro ? "Đang ở chế độ freelancer" : "Đang ở chế độ đặt lịch"}</p>
          <p className="text-xs text-muted">
            {isPro ? "Chuyển sang để đặt lịch làm đẹp cho bản thân" : "Chuyển sang để nhận job làm đẹp"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            actions.switchRole()
            router.push(isPro ? "/" : "/studio")
          }}
          className="rounded-full bg-rose px-4 py-2 text-[13px] font-medium text-white hover:bg-rose-dark"
        >
          Chuyển
        </button>
      </Card>

      {isPro ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted">Đã thu từ job hoàn thành</p>
              <p className="mt-1 text-lg font-semibold">{formatPrice(earnings)}</p>
            </Card>
            <Card className="flex items-center justify-between gap-2 p-4">
              <div>
                <p className="text-xs text-muted">Nhận job mới</p>
                <p className="mt-1 text-sm font-semibold">{state.acceptingJobs ? "Đang bật" : "Tạm nghỉ"}</p>
              </div>
              <Toggle label="Nhận job mới" checked={state.acceptingJobs} onChange={actions.setAcceptingJobs} />
            </Card>
          </div>
          <Menu
            items={[
              { href: "/studio/jobs", icon: BriefcaseBusiness, label: "Việc mới quanh bạn" },
              { href: "/studio/services", icon: Ticket, label: "Dịch vụ & bảng giá" },
              { href: `/pros/${DEMO_PRO_ID}`, icon: UserRound, label: "Hồ sơ & tác phẩm" },
              { href: "/me/policy", icon: CreditCard, label: "Thanh toán & rút tiền", sub: "Nhận cọc sau khi hoàn thành job" },
              ...commonItems,
            ]}
          />
        </>
      ) : (
        <Menu
          items={[
            { href: "/saved", icon: Heart, label: "Đã lưu", sub: `${state.savedWorks.length} mẫu · ${state.followedPros.length} chuyên viên` },
            { href: "/requests", icon: Megaphone, label: "Yêu cầu đã đăng", sub: `${state.jobs.filter((j) => j.mine).length} yêu cầu` },
            { href: "/me/policy", icon: MapPin, label: "Địa chỉ của tôi", sub: DEMO_CUSTOMER.address },
            { href: "/me/policy", icon: CreditCard, label: "Phương thức thanh toán" },
            { href: "/me/policy", icon: Ticket, label: "Ưu đãi của tôi" },
            ...commonItems,
          ]}
        />
      )}

      <Card className="mt-4 divide-y divide-line">
        <button
          type="button"
          onClick={() => {
            actions.resetDemo()
            router.push("/")
          }}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-ink-soft"
        >
          <RotateCcw className="size-5" /> Đặt lại dữ liệu demo
        </button>
        <button
          type="button"
          onClick={() => {
            actions.signOut()
            router.push("/")
          }}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-danger"
        >
          <LogOut className="size-5" /> Đăng xuất
        </button>
      </Card>
    </div>
  )
}

type MenuItem = { href: string; icon: React.ComponentType<{ className?: string }>; label: string; sub?: string }

const commonItems: MenuItem[] = [
  { href: "/me/policy", icon: Bell, label: "Cài đặt thông báo" },
  { href: "/me/policy", icon: ShieldCheck, label: "Chính sách đặt lịch & hủy" },
  { href: "/me/policy", icon: CircleHelp, label: "Trung tâm hỗ trợ" },
  { href: "/me/policy", icon: Info, label: "Về dep360" },
]

function Menu({ items }: { items: MenuItem[] }) {
  return (
    <Card className="mt-4 divide-y divide-line">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <Link key={it.label} href={it.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-blush/40">
            <Icon className="size-5 text-ink-soft" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{it.label}</span>
              {it.sub && <span className="block truncate text-xs text-muted">{it.sub}</span>}
            </span>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        )
      })}
    </Card>
  )
}
