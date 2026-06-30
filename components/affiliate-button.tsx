"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackAffiliateClick } from "@/lib/track-click"
import { cn } from "@/lib/utils"

interface AffiliateButtonProps {
  href: string
  productId: string
  offerId?: string
  children?: React.ReactNode
  className?: string
}

export function AffiliateButton({ href, productId, offerId, children, className }: AffiliateButtonProps) {
  async function handleClick() {
    await trackAffiliateClick(productId, offerId)
    window.open(href, "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "w-full h-14 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg shadow-lg shadow-rose-200 dark:shadow-rose-900/20",
        className
      )}
    >
      {children || (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" /> Mua ngay trên Shopee
        </>
      )}
    </Button>
  )
}
