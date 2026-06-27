"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Heart, Share2, TrendingUp, Search, Image as ImageIcon } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPosts } from "@/lib/data"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Post } from "@/lib/types"

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Vừa xong"
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "numeric", month: "long" })
}

export default function CommunityPage() {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [composerText, setComposerText] = React.useState("")
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null)

  React.useEffect(() => {
    getPosts().then(setPosts)
  }, [])

  const topics = ["SkincareRoutine", "ReviewMyPham", "DaDauMun", "GocLamDep", "SaleHunting"]

  const filteredPosts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesQuery =
        !query ||
        [post.title, post.excerpt, post.author_name, post.category, ...post.tags].some((field) =>
          field.toLowerCase().includes(query)
        )
      const matchesTopic = selectedTopic
        ? post.tags.some((tag) =>
            tag.toLowerCase().replace(/\s/g, "").includes(selectedTopic.toLowerCase())
          )
        : true

      return matchesQuery && matchesTopic
    })
  }, [posts, searchQuery, selectedTopic])

  function handleCreatePost() {
    const content = composerText.trim()
    if (!content) return

    const createdAt = new Date().toISOString()
    const optimisticPost: Post = {
      id: `local-${Date.now()}`,
      title: content.length > 72 ? `${content.slice(0, 69)}...` : content,
      slug: `local-${Date.now()}`,
      excerpt: content,
      content,
      author_name: "Bạn",
      author_avatar: "",
      category: "Cộng đồng",
      tags: selectedTopic ? [selectedTopic] : ["Góc làm đẹp"],
      image: "",
      likes: 0,
      comments: 0,
      created_at: createdAt,
      product_ids: [],
    }

    setPosts((items) => [optimisticPost, ...items])
    setComposerText("")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Main Feed */}
          <div className="flex-1">
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-2">
                Cộng đồng 360 độ đẹp
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Nơi chia sẻ kinh nghiệm, hỏi đáp và thảo luận về mọi thứ liên quan đến làm đẹp.
              </p>
            </motion.div>

            {/* Create Post */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-none shadow-sm mb-8 rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        placeholder="Bạn muốn chia sẻ điều gì về làm đẹp hôm nay?"
                        value={composerText}
                        onChange={(event) => setComposerText(event.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-rose-500 rounded-xl h-12 mb-4"
                      />
                      <div className="flex justify-between items-center">
                        <Button variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                          <ImageIcon className="h-5 w-5 mr-2" /> Thêm ảnh
                        </Button>
                        <Button
                          onClick={handleCreatePost}
                          disabled={!composerText.trim()}
                          className="bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl px-6 font-bold"
                        >
                          Đăng bài
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Posts */}
            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {filteredPosts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author_avatar} />
                          <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-50">{post.author_name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{formatRelative(post.created_at)} &bull; {post.category}</div>
                        </div>
                      </div>

                      <Link href={`/community/${post.id}`} className="block group">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-rose-500 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>

                        {post.image && (
                          <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
                            <Image src={post.image} alt={post.title} fill sizes="(min-width: 768px) calc(100vw - 24rem), 100vw" className="object-cover" />
                          </div>
                        )}
                      </Link>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                        <button className="flex items-center gap-2 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                          <Heart className="h-5 w-5" /> {post.likes}
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
                </motion.div>
              ))}
            </motion.div>

            {filteredPosts.length === 0 && (
              <motion.div
                className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  {posts.length === 0 ? "Chưa có bài viết nào trong cộng đồng." : "Không tìm thấy bài viết phù hợp."}
                </p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div
            className="w-full md:w-80 shrink-0 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                type="search"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-rose-500 rounded-xl h-12"
              />
            </div>

            <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-rose-500" /> Chủ đề nổi bật
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topics.map((tag) => (
                    <button key={tag} type="button" onClick={() => setSelectedTopic(selectedTopic === tag ? null : tag)}>
                      <Badge
                        variant="secondary"
                        className={
                          selectedTopic === tag
                            ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 cursor-pointer px-3 py-1"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer px-3 py-1"
                        }
                      >
                        #{tag}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-4">Thành viên tích cực</h3>
                <div className="space-y-4">
                  {[
                    { name: "Hà Linh Official", avatar: "/images/kol-halinh.png", posts: 142 },
                    { name: "Trinh Phạm", avatar: "/images/kol-trinh.png", posts: 98 },
                    { name: "Call Me Duy", avatar: "/images/kol-duy.png", posts: 76 },
                  ].map((user) => (
                    <div key={user.name} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-50 text-sm truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{user.posts} bài viết</div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full text-xs h-8 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                        Theo dõi
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
