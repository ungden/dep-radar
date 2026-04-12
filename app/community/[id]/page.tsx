export const dynamic = "force-dynamic"

import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MessageSquare, Heart, Share2, Flag } from "lucide-react"
import * as motion from "motion/react-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

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
                <button className="flex items-center gap-2 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  <Heart className="h-5 w-5" /> {post.likes} Thích
                </button>
                <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <MessageSquare className="h-5 w-5" /> {post.comments} Bình luận
                </button>
                <button className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ml-auto">
                  <Share2 className="h-5 w-5" /> Chia sẻ
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Bình luận ({post.comments})</h3>

            {/* Add Comment */}
            <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      placeholder="Viết bình luận của bạn..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-rose-500 rounded-xl h-12 mb-4"
                    />
                    <div className="flex justify-end">
                      <Button className="bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl px-6 font-bold">
                        Gửi bình luận
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Static Comment Placeholders */}
            <div className="space-y-4">
              {[
                { name: "Skincare Lover", text: "Bài viết rất hữu ích! Mình đã thử theo và thấy hiệu quả rõ rệt sau 2 tuần. Cảm ơn tác giả nhiều!" },
                { name: "Beauty Newbie", text: "Cảm ơn bạn đã chia sẻ chi tiết. Mình là người mới bắt đầu nên những thông tin này rất quý giá." },
                { name: "Makeup Daily", text: "Hay quá! Mong tác giả viết thêm nhiều bài review như thế này. Follow ngay!" },
              ].map((comment) => (
                <Card key={comment.name} className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback>{comment.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">{comment.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">1 giờ trước</div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
                          {comment.text}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <button className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                            <Heart className="h-3.5 w-3.5" /> Thích
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <MessageSquare className="h-3.5 w-3.5" /> Phản hồi
                          </button>
                          <button className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-auto">
                            <Flag className="h-3.5 w-3.5" /> Báo cáo
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
