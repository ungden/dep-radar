export const dynamic = "force-dynamic"

import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MessageSquare } from "lucide-react"
import * as motion from "motion/react-client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { LikeButton } from "@/components/like-button"
import { SocialShare } from "@/components/social-share"
import { CommentSection } from "@/components/comment-section"

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: post } = await supabase.from("posts").select("*").eq("id", id).single()
  if (!post) return notFound()

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/community" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-6 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" /> Quay lại cộng đồng
          </Link>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 mb-8">
            <CardContent className="p-6 md:p-8">
              {/* Author Info */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarImage src={post.author_avatar} alt={post.author_name} />
                  <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-50 text-lg">{post.author_name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{formatDate(post.created_at)}</span>
                    <span>&bull;</span>
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal text-xs">
                      {post.category}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 leading-tight">
                {post.title}
              </h1>

              <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                {post.content.split("\n\n").map((paragraph: string, index: number) => (
                  <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Image */}
              {post.image && (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800">
                  <Image src={post.image} alt={post.title} fill className="object-cover" />
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-normal">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <LikeButton postId={post.id} initialCount={post.likes} />
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> {post.comments} Bình luận
                </span>
                <div className="ml-auto">
                  <SocialShare
                    url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://360dep.vn'}/community/${post.id}`}
                    title={post.title}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <CommentSection postId={post.id} />
        </motion.div>
      </div>
    </div>
  )
}
