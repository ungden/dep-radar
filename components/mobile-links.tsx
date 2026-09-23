import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * The footer is desktop-only. On a phone these are the links it would have
 * given: the rules, help, and the way in for people who want to take bookings.
 */
export function MobileLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Thông tin" className={cn("flex flex-wrap justify-center gap-x-5 text-[13px] text-ink-soft md:hidden", className)}>
      <Link href="/chinh-sach" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
        Chính sách
      </Link>
      <Link href="/tro-giup" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
        Trợ giúp
      </Link>
      <Link href="/gioi-thieu" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
        Giới thiệu bạn bè
      </Link>
      <Link href="/login?role=pro" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
        Nhận khách trên 360dep
      </Link>
    </nav>
  )
}
