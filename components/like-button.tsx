"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface LikeButtonProps {
  postId?: string
  productId?: string
  initialCount: number
}

export function LikeButton({ postId, productId, initialCount }: LikeButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [liked, setLiked] = React.useState(false)
  const [count, setCount] = React.useState(initialCount)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!user) {
      setLiked(false)
      return
    }

    const checkLiked = async () => {
      let query = supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)

      if (postId) query = query.eq("post_id", postId)
      if (productId) query = query.eq("product_id", productId)

      const { data } = await query.maybeSingle()
      setLiked(!!data)
    }

    checkLiked()
  }, [user, postId, productId])

  const handleClick = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (loading) return
    setLoading(true)

    // Optimistic update
    const wasLiked = liked
    const prevCount = count
    setLiked(!wasLiked)
    setCount(wasLiked ? prevCount - 1 : prevCount + 1)

    try {
      if (wasLiked) {
        let query = supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)

        if (postId) query = query.eq("post_id", postId)
        if (productId) query = query.eq("product_id", productId)

        const { error } = await query
        if (error) throw error
      } else {
        const row: Record<string, string> = { user_id: user.id }
        if (postId) row.post_id = postId
        if (productId) row.product_id = productId

        const { error } = await supabase.from("likes").insert(row)
        if (error) throw error
      }
    } catch {
      // Revert on error
      setLiked(wasLiked)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
        "border border-slate-200 dark:border-slate-700",
        "hover:scale-105 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        liked
          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors duration-200",
          liked ? "fill-rose-500 text-rose-500" : "fill-none"
        )}
      />
      <span>{count}</span>
    </button>
  )
}
