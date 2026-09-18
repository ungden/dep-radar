"use client"

import { usePathname } from "next/navigation"
import { LogIn } from "lucide-react"
import { Button, ButtonLink, EmptyState, Skeleton } from "@/components/ui"
import { actions, useApp, useHydrated } from "@/lib/store"
import type { Role } from "@/lib/types"

/** Renders children only once the client store is loaded and a session with the right role exists. */
export function RequireSession({ role, children }: { role?: Role; children: React.ReactNode }) {
  const hydrated = useHydrated()
  const { session } = useApp()
  const pathname = usePathname()

  if (!hydrated) {
    return (
      <div className="space-y-3 pt-16">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    )
  }
  if (session && role && session.role !== role) {
    return (
      <EmptyState
        icon={<LogIn className="size-6" />}
        title={role === "pro" ? "Trang dành cho freelancer" : "Trang dành cho khách đặt lịch"}
        text="Bạn đang ở chế độ khác. Chuyển chế độ để xem trang này."
        action={
          <Button onClick={() => actions.switchRole()}>
            {role === "pro" ? "Chuyển sang chế độ freelancer" : "Chuyển sang chế độ đặt lịch"}
          </Button>
        }
      />
    )
  }
  if (!session) {
    return (
      <EmptyState
        icon={<LogIn className="size-6" />}
        title={role === "pro" ? "Dành cho freelancer" : "Đăng nhập để tiếp tục"}
        text={
          role === "pro"
            ? "Đăng nhập với vai trò freelancer để nhận job và quản lý lịch làm."
            : "Đăng nhập để xem lịch hẹn, yêu cầu và mẫu đã lưu của bạn."
        }
        action={
          <ButtonLink href={`/login?next=${encodeURIComponent(pathname)}${role === "pro" ? "&role=pro" : ""}`}>Đăng nhập</ButtonLink>
        }
      />
    )
  }
  return <>{children}</>
}
