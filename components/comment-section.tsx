"use client"

import * as React from "react"
import Link from "next/link"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LikeButton } from "@/components/like-button"
import { Skeleton } from "@/components/ui/skeleton"

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  post_id: string | null
  product_id: string | null
  parent_id: string | null
  profile?: {
    full_name: string | null
  }
}

interface CommentSectionProps {
  postId?: string
  productId?: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "vừa xong"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} tháng trước`
  return `${Math.floor(months / 12)} năm trước`
}

export function CommentSection({ postId, productId }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = React.useState<Comment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [content, setContent] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const fetchComments = React.useCallback(async () => {
    if (!isSupabaseSchemaReady) {
      setComments([])
      setLoading(false)
      return
    }

    let query = supabase
      .from("comments")
      .select("*, profile:profiles(full_name)")
      .order("created_at", { ascending: false })

    if (postId) query = query.eq("post_id", postId)
    if (productId) query = query.eq("product_id", productId)

    const { data } = await query
    setComments((data as Comment[] | null) || [])
    setLoading(false)
  }, [postId, productId])

  React.useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim() || submitting) return

    setSubmitting(true)
    if (!isSupabaseSchemaReady) {
      const optimisticComment: Comment = {
        id: `local-${Date.now()}`,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        post_id: postId ?? null,
        product_id: productId ?? null,
        parent_id: null,
        profile: {
          full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Bạn",
        },
      }
      setComments((items) => [optimisticComment, ...items])
      setContent("")
      setSubmitting(false)
      return
    }

    const row: Record<string, string> = {
      user_id: user.id,
      content: content.trim(),
    }
    if (postId) row.post_id = postId
    if (productId) row.product_id = productId

    const { error } = await supabase.from("comments").insert(row)
    if (!error) {
      setContent("")
      await fetchComments()
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
        Bình luận ({comments.length})
      </h3>

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <Avatar className="h-9 w-9 shrink-0 border border-slate-200 dark:border-slate-700">
            <AvatarFallback className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-bold">
              {user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết bình luận..."
              className="min-h-[80px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none focus:ring-rose-400"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || submitting}
                className="rounded-xl gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Đang gửi..." : "Gửi"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 border-dashed">
          <p className="text-slate-500 dark:text-slate-400">
            <Link
              href="/auth/login"
              className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-medium underline underline-offset-4"
            >
              Đăng nhập
            </Link>{" "}
            để bình luận
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const name = comment.profile?.full_name || "Người dùng"
            const initial = name[0]?.toUpperCase() || "N"

            return (
              <div
                key={comment.id}
                className={cn(
                  "flex gap-3 p-4 rounded-2xl",
                  "bg-slate-50 dark:bg-slate-950",
                  "border border-slate-100 dark:border-slate-800"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 border border-slate-200 dark:border-slate-700">
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                      {name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <div className="mt-2">
                    <LikeButton
                      commentId={comment.id}
                      initialCount={0}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
