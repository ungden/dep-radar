"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Heart, Share2, TrendingUp, Search, Image as ImageIcon } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { containerVariants, itemVariants } from "@/lib/animations"

export default function CommunityPage() {
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
                      <AvatarImage src="https://picsum.photos/seed/user/100/100" />
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input 
                        placeholder="Bạn muốn chia sẻ điều gì về làm đẹp hôm nay?" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-rose-500 rounded-xl h-12 mb-4"
                      />
                      <div className="flex justify-between items-center">
                        <Button variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                          <ImageIcon className="h-5 w-5 mr-2" /> Thêm ảnh
                        </Button>
                        <Button className="bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl px-6 font-bold">
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
              {[1, 2, 3, 4].map((post) => (
                <motion.div key={post} variants={itemVariants}>
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://picsum.photos/seed/user${post}/100/100`} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-50">Người dùng {post}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">2 giờ trước &bull; Skincare Routine</div>
                        </div>
                      </div>
                      
                      <Link href={`/community/${post}`} className="block group">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-rose-500 transition-colors">
                          Xin review kem chống nắng cho da dầu mụn mùa hè!
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                          Chào mọi người, da mình thuộc tuýp dầu mụn, mùa hè đổ dầu rất nhiều. Mình đang phân vân giữa La Roche-Posay và Eucerin. Ai dùng qua cả 2 loại này rồi cho mình xin ít review với ạ. Cảm ơn cả nhà!
                        </p>
                        
                        {post % 2 === 0 && (
                          <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
                            <Image src={`https://picsum.photos/seed/post${post}/800/400`} alt="Post image" fill className="object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </Link>

                      <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                        <button className="flex items-center gap-2 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                          <Heart className="h-5 w-5" /> 124
                        </button>
                        <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <MessageSquare className="h-5 w-5" /> 32 Bình luận
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
                className="w-full pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-rose-500 rounded-xl h-12"
              />
            </div>

            <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-rose-500" /> Chủ đề nổi bật
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["#SkincareRoutine", "#ReviewMyPham", "#DaDauMun", "#GocLamDep", "#SaleHunting"].map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-4">Thành viên tích cực</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((user) => (
                    <div key={user} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/top${user}/100/100`} />
                        <AvatarFallback>T</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-50 text-sm truncate">Chuyên gia {user}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">120 bài viết</div>
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
