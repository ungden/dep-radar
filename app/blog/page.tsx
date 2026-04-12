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
import { supabase } from "@/lib/supabase"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Post } from "@/lib/types"

const POSTS_PER_PAGE = 6

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [posts, setPosts] = React.useState<Post[]>([])
  const [visibleCount, setVisibleCount] = React.useState(POSTS_PER_PAGE)

  React.useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPosts(data || []))
  }, [])

  const categories = React.useMemo(
    () => Array.from(new Set(posts.map((p) => p.category))),
    [posts]
  )

  const filteredPosts = React.useMemo(() =>
    posts.filter((post) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.author_name.toLowerCase().includes(query)
      const matchesCategory = selectedCategory ? post.category === selectedCategory : true
      return matchesSearch && matchesCategory
    }),
    [posts, searchQuery, selectedCategory]
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
            Blog Làm Đẹp
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Cập nhật xu hướng mới nhất, chia sẻ kinh nghiệm chăm sóc da, trang điểm và mọi bí quyết làm đẹp từ các chuyên gia hàng đầu.
          </p>
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
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              className={`rounded-xl whitespace-nowrap ${selectedCategory === null ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"}`}
              onClick={() => setSelectedCategory(null)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tất cả
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-xl whitespace-nowrap ${selectedCategory === cat ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </motion.div>

        {filteredPosts.length > 0 ? (
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
                            {featured.category}
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
                {rest.map((post) => (
                  <motion.div key={post.id} variants={itemVariants}>
                    <Link href={`/blog/${post.id}`} className="group block h-full">
                      <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl h-full flex flex-col">
                        <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-50 hover:bg-white dark:hover:bg-slate-950 backdrop-blur-sm font-bold shadow-sm">
                              {post.category}
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
                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" /> {post.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" /> {post.comments}
                              </span>
                            </div>
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
                setSelectedCategory(null)
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
