"use client"

import { useEffect } from "react"

import { trackEvent } from "@/lib/analytics"

export function TrackProductView({
  productId,
  brand,
  category,
}: {
  productId: string
  brand: string
  category?: string | null
}) {
  useEffect(() => {
    trackEvent("view_product", { product_id: productId, brand, category })
  }, [brand, category, productId])

  return null
}

export function TrackArticleRead({
  postId,
  slug,
  category,
}: {
  postId: string
  slug: string
  category?: string | null
}) {
  useEffect(() => {
    trackEvent("read_article", { post_id: postId, slug, category })
  }, [category, postId, slug])

  return null
}

export function TrackKolProfileView({
  creatorId,
  platform,
}: {
  creatorId: string
  platform?: string | null
}) {
  useEffect(() => {
    trackEvent("view_kol_profile", { creator_id: creatorId, platform })
  }, [creatorId, platform])

  return null
}
