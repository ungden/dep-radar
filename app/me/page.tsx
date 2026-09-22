"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  ChevronRight,
  Bell,
  CircleHelp,
  Heart,
  ImagePlus,
  LogOut,
  MessageSquare,
  Settings,
  Wallet,
  MapPin,
  Megaphone,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react"
import { Avatar, ButtonLink, Card, Toggle } from "@/components/ui"
import { formatPhone } from "@/lib/auth/phone"
import { actions, useAct } from "@/lib/client-actions"
import { getPro, useApp } from "@/lib/store"
import { formatPrice } from "@/lib/utils"

export default function MePage() {
  const router = useRouter()
  const state = useApp()
  const act = useAct()
  const { session } = state

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <h1 className="text-[28px] font-extrabold tracking-tight">Cá nhân</h1>
        <Card className="mt-4 p-5 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-subtle text-accent">
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
  const pro = session.proId ? getPro(state, session.proId) : null
  // Only jobs this freelancer actually completed, from their own bookings.
  const earnings = state.bookings
    .filter((b) => !b.mine && b.proId === session.proId && b.status === "completed")
    .reduce((sum, b) => sum + b.quote.payout, 0)

  return (
    <div className="mx-auto max-w-2xl pt-4 md:pt-8">
      <div className="flex h-12 items-center justify-between">
        <h1 className="text-[28px] font-extrabold tracking-tight">Cá nhân</h1>
      </div>

      <Link href={isPro && pro ? `/pros/${pro.id}` : "/me"} className="mt-3 flex items-center gap-4">
        <Avatar name={session.name} tone={pro?.tone} src={pro?.avatar} size={64} />
        <div className="flex-1">
          <p className="text-lg font-semibold">{session.name}</p>
          <p className="text-sm text-muted">
            {isPro ? `${pro?.title} · Xem hồ sơ công khai` : formatPhone(session.phone)}
          </p>
        </div>
        {isPro && <ChevronRight className="size-5 text-muted" />}
      </Link>

      <Card className="mt-5 flex items-center gap-3 p-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-subtle text-accent">
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
          onClick={async () => {
            if (!isPro && !session.proId) return router.push("/studio/onboarding")
            await actions.switchRole(isPro ? "customer" : "pro")
            router.push(isPro ? "/" : "/studio")
          }}
          className="h-10 rounded-full bg-ink px-4 text-[13px] font-semibold text-white hover:bg-ink/85"
        >
          {!isPro && !session.proId ? "Mở hồ sơ" : "Chuyển"}
        </button>
      </Card>

      {isPro ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted">Thực nhận (sau hoa hồng)</p>
              <p className="mt-1 text-lg font-semibold">{formatPrice(earnings)}</p>
            </Card>
            <Card className="flex items-center justify-between gap-2 p-4">
              <div>
                <p className="text-xs text-muted">Nhận job mới</p>
                <p className="mt-1 text-sm font-semibold">{state.acceptingJobs ? "Đang bật" : "Tạm nghỉ"}</p>
              </div>
              <Toggle
                label="Nhận job mới"
                checked={state.acceptingJobs}
                onChange={(value) => void act(() => actions.setAcceptingJobs(value), value ? "Đang nhận job mới" : "Đã tạm nghỉ nhận job")}
              />
            </Card>
          </div>
          <Menu
            items={[
              { href: "/studio/jobs", icon: BriefcaseBusiness, label: "Việc mới quanh bạn" },
              { href: "/studio/services", icon: Ticket, label: "Dịch vụ & bảng giá" },
              { href: "/studio/works", icon: ImagePlus, label: "Tác phẩm" },
              { href: "/studio/wallet", icon: Wallet, label: "Ví & thu nhập" },
              { href: "/studio/profile/edit", icon: UserRound, label: "Hồ sơ, giờ làm & khu vực" },
              { href: "/studio/profile", icon: ShieldCheck, label: "Xác minh & đánh giá" },
              ...(pro ? [{ href: `/pros/${pro.id}`, icon: UserRound, label: "Hồ sơ công khai & tác phẩm" }] : []),
              ...commonItems,
            ]}
          />
        </>
      ) : (
        <Menu
          items={[
            { href: "/saved", icon: Heart, label: "Đã lưu", sub: `${state.savedWorks.length} mẫu · ${state.followedPros.length} chuyên viên` },
            { href: "/requests", icon: Megaphone, label: "Yêu cầu đã đăng", sub: `${state.jobs.filter((j) => j.mine).length} yêu cầu` },
            {
              href: "/me/dia-chi",
              icon: MapPin,
              label: "Địa chỉ của tôi",
              sub: state.addresses.length ? `${state.addresses.length} địa chỉ đã lưu` : "Chưa có địa chỉ nào",
            },
            ...commonItems,
          ]}
        />
      )}

      <Card className="mt-4 divide-y divide-line">
        <button
          type="button"
          onClick={async () => {
            await actions.signOut()
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
  { href: "/tin-nhan", icon: MessageSquare, label: "Tin nhắn" },
  { href: "/thong-bao", icon: Bell, label: "Thông báo" },
  { href: "/me/cai-dat", icon: Settings, label: "Cài đặt tài khoản" },
  { href: "/tro-giup", icon: CircleHelp, label: "Trợ giúp & an toàn" },
  { href: "/chinh-sach", icon: ShieldCheck, label: "Chính sách phí, đặt lịch & huỷ" },
]

function Menu({ items }: { items: MenuItem[] }) {
  return (
    <Card className="mt-4 divide-y divide-line">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <Link key={it.label} href={it.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-subtle/40">
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
