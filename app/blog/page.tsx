"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Filter, Clock, Heart, MessageSquare, ArrowRight } from "lucide-react"
import { motion } from "motion/react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPosts } from "@/lib/data"
import { getPublishedEditorialPosts } from "@/lib/editorial"
import { catalogueSections, getCatalogueSection, normalizeCatalogueToken } from "@/lib/catalogue"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Post } from "@/lib/types"

const POSTS_PER_PAGE = 6

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedHub, setSelectedHub] = React.useState<string | null>(null)
  const [selectedIntent, setSelectedIntent] = React.useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = React.useState<string | null>(null)
  const [posts, setPosts] = React.useState<Post[]>(() => getPublishedEditorialPosts())
  const [loading, setLoading] = React.useState(false)
  const [visibleCount, setVisibleCount] = React.useState(POSTS_PER_PAGE)

  React.useEffect(() => {
    getPosts().then(setPosts).finally(() => setLoading(false))
  }, [])

  const availableHubs = React.useMemo(
    () => catalogueSections.filter((section) => posts.some((post) => post.hubSlug === section.slug)),
    [posts]
  )

  const filteredPosts = React.useMemo(() =>
    posts.filter((post) => {
      const query = normalizeCatalogueToken(searchQuery)
      const matchesSearch =
        normalizeCatalogueToken(post.title).includes(query) ||
        normalizeCatalogueToken(post.excerpt).includes(query) ||
        normalizeCatalogueToken(post.author_name).includes(query)
      const matchesHub = selectedHub ? post.hubSlug === selectedHub : true
      const matchesIntent = selectedIntent ? inferIntent(post) === selectedIntent : true
      const matchesFormat = selectedFormat ? (post.contentFormat ?? inferFormat(post)) === selectedFormat : true
      return matchesSearch && matchesHub && matchesIntent && matchesFormat
    }).sort((a, b) => editorialScore(b) - editorialScore(a)),
    [posts, searchQuery, selectedHub, selectedIntent, selectedFormat]
  )

  const featured = filteredPosts[0]
  const rest = filteredPosts.slice(1, visibleCount)
  const hasMore = visibleCount < filteredPosts.length

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4">
            Kiến thức làm đẹp
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Thư viện kiến thức được tổ chức theo 14 chủ đề, ưu tiên hướng dẫn có bối cảnh, ranh giới an toàn và nguồn tham khảo có thể kiểm tra lại.
          </p>
          {!loading && <p className="mt-3 text-sm font-bold text-rose-600 dark:text-rose-300">{posts.length} bài đã hoàn thiện</p>}
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="search"
              placeholder="Tìm kiếm bài viết..."
              className="w-full pl-10 bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-rose-500 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex w-full gap-2 overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={selectedHub === null ? "default" : "outline"}
              className={`min-h-11 rounded-xl whitespace-nowrap ${selectedHub === null ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"}`}
              onClick={() => setSelectedHub(null)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tất cả
            </Button>
            {availableHubs.map((hub) => (
              <Button
                key={hub.slug}
                variant={selectedHub === hub.slug ? "default" : "outline"}
                className={`min-h-11 rounded-xl whitespace-nowrap ${selectedHub === hub.slug ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"}`}
                onClick={() => setSelectedHub(hub.slug)}
              >
                {hub.shortTitle}
              </Button>
            ))}
          </div>
        </motion.div>

        <div className="mb-8 flex flex-wrap gap-2" aria-label="Lọc theo mục đích bài viết">
          {[{ value: null, label: "Mọi mục đích" }, { value: "learn", label: "Hiểu vấn đề" }, { value: "choose", label: "Chọn giải pháp" }, { value: "safety", label: "An toàn" }].map((intent) => (
            <button key={intent.label} type="button" aria-pressed={selectedIntent === intent.value} onClick={() => setSelectedIntent(intent.value)} className={`min-h-11 rounded-full border px-4 text-sm font-bold ${selectedIntent === intent.value ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}>{intent.label}</button>
          ))}
          <span className="mx-1 hidden w-px bg-slate-200 sm:block dark:bg-slate-800" />
          {[{ value: null, label: "Mọi định dạng" }, { value: "guide", label: "Hướng dẫn" }, { value: "explainer", label: "Giải thích" }, { value: "comparison", label: "So sánh" }, { value: "checklist", label: "Danh sách kiểm tra" }].map((format) => (
            <button key={format.label} type="button" aria-pressed={selectedFormat === format.value} onClick={() => setSelectedFormat(format.value)} className={`min-h-11 rounded-full border px-4 text-sm font-bold ${selectedFormat === format.value ? "border-cyan-600 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300" : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}>{format.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white py-24 text-center text-lg font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400" role="status">
            Đang tải thư viện kiến thức…
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            {/* Featured Post */}
            {featured && (
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <Link href={`/blog/${featured.id}`} className="group block">
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 rounded-3xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <div className="relative aspect-[16/10] lg:aspect-auto bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <Image
                          src={featured.image}
                          alt={featured.title}
                          fill
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          priority
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-rose-500 text-white hover:bg-rose-600 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full">
                            Nổi bật
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-8 lg:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                            {getCatalogueSection(featured.hubSlug ?? "")?.shortTitle ?? featured.category}
                          </Badge>
                          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(featured.created_at)}
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {featured.title}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed">
                          {featured.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                              <AvatarImage src={featured.author_avatar} />
                              <AvatarFallback>{featured.author_name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                              {featured.author_name}
                            </span>
                          </div>
                          <span className="text-rose-500 font-semibold flex items-center gap-2 text-sm group-hover:gap-3 transition-all">
                            Đọc tiếp <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )}

            {/* Posts Grid */}
            {rest.length > 0 && (
              <motion.div
                key={rest.length}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {rest.map((post, index) => (
                  <motion.div key={post.id} variants={itemVariants}>
                    <Link href={`/blog/${post.id}`} className="group block h-full">
                      <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl h-full flex flex-col">
                        <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            priority={index === 0}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-50 hover:bg-white dark:hover:bg-slate-950 backdrop-blur-sm font-bold shadow-sm">
                              {getCatalogueSection(post.hubSlug ?? "")?.shortTitle ?? post.category}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(post.created_at)}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3 leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={post.author_avatar} />
                                <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                                {post.author_name}
                              </span>
                            </div>
                            {(post.likes > 0 || post.comments > 0) && <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" /> {post.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" /> {post.comments}
                              </span>
                            </div>}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Load More */}
            {hasMore && (
              <motion.div
                className="mt-12 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-900"
                  onClick={() => setVisibleCount((c) => c + POSTS_PER_PAGE)}
                >
                  Tải thêm bài viết
                </Button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Không tìm thấy bài viết nào phù hợp.
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => {
                setSearchQuery("")
                setSelectedHub(null)
                setSelectedIntent(null)
                setSelectedFormat(null)
              }}
            >
              Xóa bộ lọc
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function inferIntent(post: Post) {
  if (post.intent === "safety") return "safety"
  if (post.intent === "decision") return "choose"
  if (!post.intent && post.medicalDisclaimerLevel === "medical") return "safety"
  return "learn"
}

function inferFormat(post: Post): NonNullable<Post["contentFormat"]> {
  const title = normalizeCatalogueToken(post.title)
  if (title.includes("checklist") || title.includes("dau-hieu")) return "checklist"
  if (title.includes("khac") || title.includes("so-sanh") || title.includes("vs")) return "comparison"
  if (title.includes("review")) return "review"
  if (post.intent === "pillar" || title.includes("huong-dan")) return "guide"
  return "explainer"
}

function editorialScore(post: Post) {
  const timestamp = Number.isFinite(Date.parse(post.created_at)) ? Date.parse(post.created_at) / 1_000_000_000 : 0
  const trust = (post.sourceNotes?.length ?? 0) * 8 + (post.takeaways?.length ?? 0) * 3 + (post.faq?.length ?? 0) * 2
  const completeness = post.hubSlug && post.researchStage && post.nextArticleSlugs?.length ? 20 : 0
  return timestamp + trust + completeness
}
