"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageSquare, ThumbsUp, Clock } from "lucide-react"
import { motion } from "motion/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { containerVariants, itemVariants } from "@/lib/animations"
import { getHomeRecencyLabel, type HomeBriefingItem } from "@/lib/home-briefing"
import type { Post } from "@/lib/types"

export function CommunityHighlights({ posts, dailyUpdates = [] }: { posts: Post[]; dailyUpdates?: HomeBriefingItem[] }) {
  const latestPosts = posts.slice(0, 6)
  const mixedUpdates = dailyUpdates.slice(0, 5)
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
    })
  }

  return (
    <section className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            Mới cập nhật từ Beauty Desk
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Nhiều bài hơn trên trang chủ: routine, ingredient, clinic, makeup, bodycare và beauty tech.
          </p>
        </div>
        <Link href="/blog" className="shrink-0">
          <span className="text-rose-500 font-semibold hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2">
            Xem tất cả bài viết <span aria-hidden="true">&rarr;</span>
          </span>
        </Link>
      </div>

      {mixedUpdates.length > 0 && (
        <div className="mb-8 flex gap-3 overflow-x-auto pb-1">
          {mixedUpdates.map((item) => (
            <Link
              key={`${item.kind}-${item.href}-${item.title}`}
              href={item.href}
              className="min-w-[250px] max-w-[280px] rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-rose-100 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:text-rose-300"
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>{getHomeRecencyLabel(item.date)}</span>
                <span>{item.kind === "article" ? "Tin" : item.kind === "creator" ? "KOL/KOC" : "Sản phẩm"}</span>
              </div>
              <h3 className="text-sm font-bold leading-tight text-slate-900 line-clamp-2 dark:text-slate-50">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">{item.excerpt}</p>
            </Link>
          ))}
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        {latestPosts.map((post) => (
          <motion.div key={post.id} variants={itemVariants}>
            <Card className="flex h-full flex-col overflow-hidden border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <Link href={`/blog/${post.id}`} className="group relative block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  src={post.image || "/brand/social-share.jpg"}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                <Badge className="absolute bottom-4 left-4 border-none bg-white/92 text-slate-900 shadow-sm backdrop-blur hover:bg-white">
                  {post.category}
                </Badge>
              </Link>
              <CardHeader className="flex flex-row items-center gap-4 p-5 pb-3">
                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarImage src={post.author_avatar} alt={post.author_name} />
                  <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{post.author_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(post.created_at)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                <Link href={`/blog/${post.id}`} className="block group mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-2 mb-2 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </Link>
                <div className="flex flex-wrap gap-2 mt-auto mb-4">
                  {post.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-normal text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-colors">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
