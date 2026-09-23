"use client"

import { usePathname } from "next/navigation"
import { LogIn } from "lucide-react"
import { Button, ButtonLink, EmptyState } from "@/components/ui"
import { actions, useAct } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import type { Role } from "@/lib/types"

/**
 * Renders children only for a session with the right role. The middleware already
 * turned anonymous visitors away at the server; this covers the role, and the
 * case where a customer follows a link into the studio.
 */
export function RequireSession({ role, children }: { role?: Role; children: React.ReactNode }) {
  const { session } = useApp()
  const act = useAct()
  const pathname = usePathname()

  // Signed in, but as the other side of the marketplace.
  if (session && role && session.role !== role) {
    // A customer with no freelancer profile cannot simply switch into one.
    if (role === "pro" && !session.proId) {
      return (
        <EmptyState
          icon={<LogIn className="size-6" />}
          title="Bạn chưa là đối tác 360dep"
          text="Mở hồ sơ đối tác để nhận lịch và nhận việc quanh bạn: làm đẹp, chụp ảnh, quay clip hoặc làm mẫu."
          action={<ButtonLink href="/studio/onboarding">Mở hồ sơ đối tác</ButtonLink>}
        />
      )
    }
    return (
      <EmptyState
        icon={<LogIn className="size-6" />}
        title={role === "pro" ? "Trang dành cho đối tác" : "Trang dành cho khách đặt lịch"}
        text="Bạn đang ở chế độ khác. Chuyển chế độ để xem trang này."
        action={
          <Button
            onClick={() =>
              void act(async () => {
                await actions.switchRole(role)
                return {}
              })
            }
          >
            {role === "pro" ? "Chuyển sang chế độ đối tác" : "Chuyển sang chế độ đặt lịch"}
          </Button>
        }
      />
    )
  }
  if (!session) {
    return (
      <EmptyState
        icon={<LogIn className="size-6" />}
        title={role === "pro" ? "Dành cho đối tác 360dep" : "Đăng nhập để tiếp tục"}
        text={
          role === "pro"
            ? "Đăng nhập để nhận lịch, nhận việc và quản lý lịch làm."
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
