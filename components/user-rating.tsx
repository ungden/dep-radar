"use client"

import * as React from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface UserRatingProps {
  productId: string
}

export function UserRating({ productId }: UserRatingProps) {
  const { user } = useAuth()
  const [rating, setRating] = React.useState(0)
  const [hovered, setHovered] = React.useState(0)
  const [review, setReview] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (!isSupabaseSchemaReady) {
      setLoading(false)
      return
    }

    const fetchExisting = async () => {
      const { data } = await supabase
        .from("user_ratings")
        .select("rating, review")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle()

      if (data) {
        setRating(data.rating)
        setReview(data.review || "")
        setSubmitted(true)
      }
      setLoading(false)
    }

    fetchExisting()
  }, [user, productId])

  const handleSubmit = async () => {
    if (!user || rating === 0 || submitting) return

    setSubmitting(true)
    if (!isSupabaseSchemaReady) {
      setError("Hệ thống đánh giá chưa sẵn sàng. Không có dữ liệu nào được lưu.")
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from("user_ratings")
      .upsert(
        {
          user_id: user.id,
          product_id: productId,
          rating,
          review: review.trim() || null,
        },
        { onConflict: "user_id,product_id" }
      )

    if (!error) {
      setSubmitted(true)
    } else {
      setError("Không thể lưu đánh giá. Vui lòng thử lại sau.")
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 border-dashed text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/auth/login"
            className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-medium underline underline-offset-4"
          >
            Đăng nhập
          </Link>{" "}
          để đánh giá sản phẩm
        </p>
      </div>
    )
  }

  if (!isSupabaseSchemaReady) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">Hệ thống đánh giá chưa được bật trên môi trường này.</div>
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-3">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        {submitted ? "Đánh giá của bạn" : "Đánh giá sản phẩm này"}
      </p>

      {/* Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1
          const filled = starValue <= (hovered || rating)
          return (
            <button
              key={i}
              type="button"
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHovered(starValue)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`${starValue} sao`}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors duration-150",
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"
                )}
              />
            </button>
          )
        })}
        {rating > 0 && (
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-2">
            {rating}/5
          </span>
        )}
      </div>

      {/* Review textarea */}
      <Textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)..."
        className="min-h-[70px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none text-sm focus:ring-rose-400"
      />

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        size="sm"
        className="rounded-xl"
      >
        {submitting
          ? "Đang lưu..."
          : submitted
            ? "Cập nhật đánh giá"
            : "Gửi đánh giá"}
      </Button>

      {submitted && !submitting && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          Đã lưu đánh giá của bạn
        </p>
      )}
      {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
    </div>
  )
}
