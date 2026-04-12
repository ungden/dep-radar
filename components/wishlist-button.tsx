"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface WishlistButtonProps {
  productId: string
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!user) {
      setSaved(false)
      return
    }

    const checkWishlist = async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle()

      setSaved(!!data)
    }

    checkWishlist()
  }, [user, productId])

  const handleClick = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (loading) return
    setLoading(true)

    const wasSaved = saved
    setSaved(!wasSaved)

    try {
      if (wasSaved) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert({ user_id: user.id, product_id: productId })

        if (error) throw error
      }
    } catch {
      setSaved(wasSaved)
    } finally {
      setLoading(false)
    }
  }

  const Icon = saved ? BookmarkCheck : Bookmark

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={saved ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
        "border",
        "hover:scale-105 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        saved
          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-rose-500 dark:hover:text-rose-400"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-colors duration-200",
          saved && "fill-rose-500 text-rose-500"
        )}
      />
    </button>
  )
}
