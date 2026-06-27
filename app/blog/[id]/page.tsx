export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, MessageSquare, Tag } from "lucide-react"
import * as motion from "motion/react-client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPost, getRelatedPosts } from "@/lib/data"
import { LikeButton } from "@/components/like-button"
import { SocialShare } from "@/components/social-share"
import { CommentSection } from "@/components/comment-section"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    return { title: 'Bài viết không tồn tại | Blog 360 độ đẹp' }
  }

  return {
    title: `${post.title} | Blog 360 độ đẹp`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | Blog 360 độ đẹp`,
      description: post.excerpt,
      images: post.image ? [post.image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const post = await getPost(id)
  if (!post) return notFound()

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Fetch related posts in the same category
  const relatedPosts = await getRelatedPosts(post.category, post.id, 2)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 w-full bg-slate-200 dark:bg-slate-800">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-6 transition-colors drop-shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại Blog
          </Link>

          {/* Article Card */}
          <article className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Article Header */}
            <div className="p-6 md:p-10 lg:p-12">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 rounded-full font-bold">
                    {post.category}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(post.created_at)}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-slate-50 leading-[1.15] mb-8">
                  {post.title}
                </h1>

                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 border-l-4 border-rose-500 pl-6 italic">
                  {post.excerpt}
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pb-8 border-b border-slate-100 dark:border-slate-800">
                  <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-800 shadow-md">
                    <AvatarImage src={post.author_avatar} />
                    <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                      {post.author_name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Tác giả</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="px-6 md:px-10 lg:px-12 pb-10">
              <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-lg prose-headings:font-display prose-a:text-rose-600 dark:prose-a:text-rose-400">
                {post.content.split("\n\n").map((paragraph: string, index: number) => (
                  <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Tags & Actions */}
            <div className="px-6 md:px-10 lg:px-12 pb-10">
              <div className="max-w-3xl mx-auto">
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <Tag className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {post.tags?.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <LikeButton postId={post.id} initialCount={post.likes} />
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" /> {post.comments} Bình luận
                  </span>
                  <div className="ml-auto">
                    <SocialShare
                      url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://360dep.vn'}/blog/${post.id}`}
                      title={post.title}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Comment Section */}
          <div className="mt-8">
            <CommentSection postId={post.id} />
          </div>

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50 mb-6">
                Bài viết liên quan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((related) => (
                  <Link key={related.id} href={`/blog/${related.id}`} className="group">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 flex">
                      <div className="relative w-32 md:w-40 shrink-0 bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={related.image}
                          alt={related.title}
                          fill
                          sizes="(min-width: 768px) 10rem, 8rem"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 flex flex-col justify-center">
                        <Badge variant="secondary" className="w-fit bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs mb-2">
                          {related.category}
                        </Badge>
                        <h4 className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-tight">
                          {related.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
