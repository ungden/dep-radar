"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Logo } from "@/components/ui"
import { actions } from "@/lib/store"

export default function WelcomePage() {
  const router = useRouter()
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas md:flex-row">
      <div className="relative h-[46dvh] md:h-auto md:flex-1">
        <Image src="/images/works/nail-1.webp" alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/10 via-transparent to-canvas md:bg-gradient-to-r md:from-transparent md:to-canvas/30" />
      </div>
      <div className="relative -mt-10 flex flex-1 flex-col px-6 pb-8 md:mt-0 md:max-w-lg md:justify-center md:px-14">
        <Logo className="text-6xl md:text-7xl" />
        <p className="mt-3 text-lg text-ink-soft">
          Đẹp hơn mỗi ngày,
          <br />
          theo cách của bạn
        </p>

        <div className="mt-auto space-y-3 pt-10 md:mt-12">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              actions.finishOnboarding()
              router.push("/")
            }}
          >
            Bắt đầu khám phá
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => {
              actions.finishOnboarding()
              router.push("/login?role=pro")
            }}
          >
            Tôi là freelancer làm đẹp
          </Button>
          <p className="pt-2 text-center text-sm text-ink-soft">
            Đã có tài khoản?{" "}
            <Link href="/login" onClick={() => actions.finishOnboarding()} className="font-medium text-rose underline underline-offset-2">
              Đăng nhập
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-[11px] tracking-[0.2em] text-muted md:text-left">
          NAIL · MAKEUP · CHĂM SÓC DA · TÓC · MI & MÀY
        </p>
      </div>
    </div>
  )
}
