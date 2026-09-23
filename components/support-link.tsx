"use client"

import Link from "next/link"
import { buttonClass } from "@/components/ui"
import { useApp } from "@/lib/store"
import type { PlatformSettings } from "@/lib/api/types"

/**
 * Where "Liên hệ hỗ trợ" goes: the Zalo or e-mail the owner filled in on the
 * platform settings, or -- until then -- the help page, which explains how to
 * report a problem from a booking. Never a number that is not there.
 */
export function supportHref(platform: PlatformSettings): { href: string; external: boolean } {
  const zalo = platform.supportZalo?.replace(/\D/g, "")
  if (zalo) return { href: `https://zalo.me/${zalo}`, external: true }
  if (platform.supportEmail) return { href: `mailto:${platform.supportEmail}`, external: true }
  return { href: "/tro-giup", external: false }
}

export function SupportLink({
  variant = "outline",
  size = "md",
  className,
  children = "Liên hệ hỗ trợ",
}: {
  variant?: Parameters<typeof buttonClass>[0]
  size?: Parameters<typeof buttonClass>[1]
  className?: string
  children?: React.ReactNode
}) {
  const { platform } = useApp()
  const { href, external } = supportHref(platform)
  const cls = buttonClass(variant, size, className)
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  )
}
