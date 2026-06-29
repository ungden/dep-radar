export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, Clock, MessageSquare, Tag } from "lucide-react"
import * as motion from "motion/react-client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPost, getPostProductRecommendations, getRelatedPosts } from "@/lib/data"
import { LikeButton } from "@/components/like-button"
import { SocialShare } from "@/components/social-share"
import { CommentSection } from "@/components/comment-section"
import { ArticleProductRecommendations } from "@/components/article-product-recommendations"

function renderPostContent(content: string) {
  return content.split("\n\n").map((block, index) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={index} className="mt-10 text-2xl font-display font-black tracking-tight text-slate-900 dark:text-slate-50">
          {block.replace(/^##\s+/, "")}
        </h2>
      )
    }

    if (block.startsWith("- ")) {
      return (
        <ul key={index} className="my-5 space-y-2 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
          {block.split("\n").map((item) => (
            <li key={item} className="flex gap-3 text-slate-700 dark:text-slate-300">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              <span>{item.replace(/^-\s+/, "")}</span>
            </li>
          ))}
        </ul>
      )
    }

    return (
      <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {block}
      </p>
    )
  })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    return { title: 'Bài viết không tồn tại | Blog' }
  }

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | Blog 360dep.vn`,
      description: post.excerpt,
      images: post.image
        ? [
            {
              url: post.image,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Blog 360dep.vn`,
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

  const [relatedPosts, recommendedProducts] = await Promise.all([
    getRelatedPosts(post.category, post.id, 2),
    getPostProductRecommendations(post, 3),
  ])

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
                {renderPostContent(post.content)}
                <ArticleProductRecommendations products={recommendedProducts} />
              </div>
            </div>

            {(post.takeaways?.length || post.faq?.length || post.sourceNotes?.length || post.medicalDisclaimerLevel === "medical") && (
              <div className="px-6 md:px-10 lg:px-12 pb-10">
                <div className="mx-auto grid max-w-3xl gap-5">
                  {post.takeaways && post.takeaways.length > 0 && (
                    <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                      <div className="mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Điểm cần nhớ</h2>
                      </div>
                      <ul className="space-y-3 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                        {post.takeaways.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {post.medicalDisclaimerLevel === "medical" && (
                    <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 text-sm font-semibold leading-relaxed text-slate-700 dark:border-amber-950 dark:bg-amber-950/20 dark:text-slate-300">
                      <div className="mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="font-display text-base font-bold">Lưu ý an toàn</span>
                      </div>
                      Nội dung này dùng để giáo dục và chuẩn bị câu hỏi trước khi mua sản phẩm hoặc làm dịch vụ. Nó không thay thế chẩn đoán, kê đơn hoặc điều trị cá nhân từ bác sĩ da liễu.
                    </section>
                  )}

                  {post.faq && post.faq.length > 0 && (
                    <section className="rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-rose-500" />
                        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">FAQ nhanh</h2>
                      </div>
                      <div className="space-y-4">
                        {post.faq.map((item) => (
                          <div key={item.question}>
                            <h3 className="font-bold text-slate-900 dark:text-slate-50">{item.question}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {post.sourceNotes && post.sourceNotes.length > 0 && (
                    <section className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-rose-500" />
                        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">Nguồn tham khảo</h2>
                      </div>
                      <div className="grid gap-2">
                        {post.sourceNotes.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 transition-colors hover:text-rose-600 dark:bg-slate-950 dark:text-slate-300"
                          >
                            {source.label}
                          </a>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

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
