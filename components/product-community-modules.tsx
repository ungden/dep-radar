"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { MessageSquareMore } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CommunityReview, Kol } from "@/lib/types"

const RealReviewPanel = dynamic(() => import("@/components/real-review-panel").then((module) => module.RealReviewPanel), { ssr: false })
const CommentSection = dynamic(() => import("@/components/comment-section").then((module) => module.CommentSection), { ssr: false })
const RelatedProducts = dynamic(() => import("@/components/related-products").then((module) => module.RelatedProducts), { ssr: false })

export function ProductCommunityModules({
  productId,
  productName,
  category,
  initialReviews,
  kols,
}: {
  productId: string
  productName: string
  category: string
  initialReviews: CommunityReview[]
  kols: Kol[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">Đánh giá cộng đồng, thảo luận và sản phẩm liên quan được tải khi bạn cần để trang mở nhanh hơn.</p>
        <Button type="button" variant="outline" className="mt-4 min-h-11 rounded-xl" onClick={() => setIsOpen(true)}>
          <MessageSquareMore className="mr-2 h-4 w-4" /> Mở cộng đồng và sản phẩm liên quan
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-8">
      <RealReviewPanel productId={productId} productName={productName} initialReviews={initialReviews} kols={kols} />
      <CommentSection productId={productId} />
      <RelatedProducts category={category} currentProductId={productId} />
    </div>
  )
}
