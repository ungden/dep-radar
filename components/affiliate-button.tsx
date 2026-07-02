"use client"

import { ShoppingCart } from "lucide-react"
import type { ReactNode } from "react"
import { trackAffiliateClick } from "@/lib/track-click"
import { cn } from "@/lib/utils"

interface AffiliateButtonProps {
  href: string
  productId: string
  offerId?: string
  children?: ReactNode
  className?: string
}

export function AffiliateButton({ href, productId, offerId, children, className }: AffiliateButtonProps) {
  function handleClick() {
    void trackAffiliateClick(productId, offerId)
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "inline-flex w-full h-14 items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg shadow-lg shadow-rose-200 transition-colors dark:shadow-rose-900/20",
        className
      )}
    >
      {children || (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" /> Mua ngay trên Shopee
        </>
      )}
    </a>
  )
}
