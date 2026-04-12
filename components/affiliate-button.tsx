"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackAffiliateClick } from "@/lib/track-click"

interface AffiliateButtonProps {
  href: string
  productId: string
  children?: React.ReactNode
}

export function AffiliateButton({ href, productId, children }: AffiliateButtonProps) {
  async function handleClick() {
    await trackAffiliateClick(productId)
    window.open(href, "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      onClick={handleClick}
      className="w-full h-14 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
    >
      {children || (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" /> Mua ngay trên Shopee
        </>
      )}
    </Button>
  )
}
