"use client"

import type { ReactNode } from "react"

import { trackEvent } from "@/lib/analytics"

export function TrackedEvidenceLink({ href, creatorId, productId, className, children }: {
  href: string
  creatorId: string
  productId: string
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent("evidence_opened", { source_url: href, creator_id: creatorId, product_id: productId })}
    >
      {children}
    </a>
  )
}
