"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ChevronDown, MapPin, Megaphone, Search } from "lucide-react"
import { CategoryRow, ProCard, WorkFeedCard } from "@/components/beauty"
import { Logo, Tabs } from "@/components/ui"
import { CITIES, PROS, WORKS, getPro } from "@/lib/data"
import { actions, useApp } from "@/lib/store"

type Feed = "for-you" | "following" | "trending"

export default function ExplorePage() {
  const router = useRouter()
  const { city, followedPros, session } = useApp()
  const [feed, setFeed] = React.useState<Feed>("for-you")
  const [q, setQ] = React.useState("")

  const works = React.useMemo(() => {
    let list = WORKS.filter((w) => !city || getPro(w.proId)?.city === city)
    if (feed === "following") list = list.filter((w) => followedPros.includes(w.proId))
    if (feed === "trending") list = [...list].sort((a, b) => b.likes - a.likes)
    return list
  }, [city, feed, followedPros])

  const pros = React.useMemo(
    () => PROS.filter((p) => !city || p.city === city).sort((a, b) => b.rating - a.rating),
    [city],
  )

  return (
    <div className="pt-2 md:pt-8">
      {/* Mobile top bar */}
      <div className="flex h-12 items-center justify-between md:hidden">
        <CityPicker value={city} />
        <Logo />
        <Link href={session ? "/bookings" : "/login"} aria-label="Thông báo" className="relative inline-flex size-10 items-center justify-center">
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose" />
        </Link>
      </div>

      <div className="md:flex md:items-end md:justify-between md:gap-8">
        <div className="hidden md:block">
          <h1 className="font-display text-4xl leading-tight">Đẹp hơn mỗi ngày, theo cách của bạn</h1>
          <p className="mt-2 text-ink-soft">Xem tác phẩm thật của freelancer gần bạn và đặt lịch làm tại nhà.</p>
        </div>
        <div className="hidden md:block">
          <CityPicker value={city} />
        </div>
      </div>

      <form
        className="relative mt-3 md:mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          router.push(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
        }}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Tìm mẫu nail, makeup, chăm sóc da..."
          aria-label="Tìm kiếm"
          className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[15px] placeholder:text-muted focus:border-rose focus:outline-none md:h-14"
        />
      </form>

      <CategoryRow className="mt-5" />

      <Link
        href={session?.role === "pro" ? "/studio/jobs" : "/requests/new"}
        className="mt-6 flex items-center gap-3 rounded-[var(--radius-card)] bg-blush p-4 transition-colors hover:bg-blush-strong"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-rose">
          <Megaphone className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Chưa tìm được mẫu ưng ý?</span>
          <span className="block text-[13px] text-ink-soft">Đăng yêu cầu, freelancer gần bạn sẽ gửi báo giá trong ít phút.</span>
        </span>
        <span className="hidden rounded-full bg-rose px-4 py-2 text-[13px] font-medium text-white sm:inline">Đăng yêu cầu</span>
      </Link>

      <Tabs
        className="mt-6"
        value={feed}
        onChange={setFeed}
        items={[
          { value: "for-you", label: "Dành cho bạn" },
          { value: "following", label: "Đang theo dõi" },
          { value: "trending", label: "Xu hướng" },
        ]}
      />

      {works.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          {feed === "following" ? "Bạn chưa theo dõi chuyên viên nào ở khu vực này." : "Chưa có tác phẩm ở khu vực này."}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 md:gap-x-5">
          {works.map((w, i) => (
            <WorkFeedCard key={w.id} work={w} priority={i < 4} />
          ))}
        </div>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Chuyên viên nổi bật</h2>
          <Link href="/pros" className="text-sm text-rose">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {pros.slice(0, 4).map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </div>
      </section>

      {session?.role !== "pro" && (
        <section className="mt-10 rounded-[var(--radius-card)] bg-ink p-6 text-white md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-display text-2xl">Bạn là thợ làm đẹp tự do?</p>
            <p className="mt-1 text-sm text-white/70">Nhận job gần nhà, tự chọn giờ làm, không mất phí mặt bằng.</p>
          </div>
          <Link
            href={session ? "/studio" : "/login?role=pro"}
            onClick={() => session && actions.switchRole()}
            className="mt-4 inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-medium text-ink md:mt-0"
          >
            Bắt đầu nhận job
          </Link>
        </section>
      )}
    </div>
  )
}

function CityPicker({ value }: { value: string | null }) {
  return (
    <label className="relative inline-flex items-center gap-1 text-[13px] font-medium text-ink-soft">
      <MapPin className="size-4" />
      <span>{value ?? "Toàn quốc"}</span>
      <ChevronDown className="size-3.5" />
      <select
        aria-label="Chọn khu vực"
        value={value ?? ""}
        onChange={(e) => actions.setCity(e.target.value || null)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Toàn quốc</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  )
}
