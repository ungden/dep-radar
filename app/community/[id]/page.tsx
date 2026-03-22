"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MessageSquare, Heart, Share2, MoreHorizontal, Flag } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CommunityPostPage() {
  const params = useParams()
  const id = params.id as string

  // Mock data for the post
  const post = {
    id: id,
    author: {
      name: "Nguyễn Mai",
      avatar: "https://picsum.photos/seed/mai/100/100",
      role: "Member",
    },
    title: "Da mụn ẩn có nên dùng BHA Obagi không mọi người?",
    content: `Mình bị mụn ẩn vùng trán và cằm khá nhiều, da hỗn hợp thiên dầu. Nghe review BHA Obagi đẩy mụn tốt nhưng sợ break out. Ai dùng rồi cho mình xin review với ạ!
    
Mình đã thử dùng một số loại tẩy da chết hóa học nhẹ nhàng hơn như Mandelic Acid nhưng thấy hiệu quả khá chậm. Mụn ẩn vẫn còn sần sùi dưới da, đặc biệt là khi sờ vào. Thấy nhiều người khen BHA Obagi là "thần dược" trị mụn ẩn nhưng cũng có nhiều trường hợp bị đẩy mụn viêm nặng nề nên mình hơi rén.

Routine hiện tại của mình:
- Tẩy trang Bioderma hồng
- Sữa rửa mặt SVR Sebiaclear
- Toner hoa cúc Kiehl's
- Serum B5 GoodnDoc
- Kem dưỡng Neutrogena Hydro Boost Water Gel
- Kem chống nắng La Roche-Posay Anthelios

Mọi người xem routine của mình đã ổn chưa và nếu thêm BHA Obagi thì nên dùng ở bước nào, tần suất ra sao ạ? Cảm ơn cả nhà nhiều!`,
    tags: ["Trị mụn", "BHA", "Obagi", "Skincare Routine"],
    likes: 45,
    comments: 28,
    timeAgo: "3 giờ trước",
    images: [
      "https://picsum.photos/seed/post1/800/600",
      "https://picsum.photos/seed/post2/800/600"
    ]
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarImage src={post.author.avatar} alt={post.author.name} />
                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-50 text-lg">{post.author.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{post.timeAgo}</span>
                      <span>&bull;</span>
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal text-xs">
                        {post.author.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              {/* Post Content */}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4 leading-tight">
                {post.title}
              </h1>
              
              <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                {post.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {post.images.map((img, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image src={img} alt={`Post image ${index + 1}`} fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>

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
                    <AvatarImage src="https://picsum.photos/seed/user/100/100" />
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

            {/* Comment List */}
            <div className="space-y-4">
              {[1, 2, 3].map((comment) => (
                <Card key={comment} className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={`https://picsum.photos/seed/commenter${comment}/100/100`} />
                        <AvatarFallback>C</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">Người dùng {comment}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">1 giờ trước</div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
                          Mình da dầu mụn dùng BHA Obagi thấy đẩy mụn khá tốt, nhưng bạn nhớ cấp ẩm kỹ nha. Routine của bạn có B5 GoodnDoc là ổn rồi đó, nhưng có thể thêm một loại kem dưỡng phục hồi tốt hơn như B5 La Roche-Posay hoặc Bioderma Cicabio.
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
            
            <div className="flex justify-center pt-4">
              <Button variant="outline" className="rounded-full px-8 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Xem thêm bình luận
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
