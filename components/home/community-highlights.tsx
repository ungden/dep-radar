"use client"

import Link from "next/link"
import { MessageSquare, ThumbsUp } from "lucide-react"
import { motion } from "motion/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const DISCUSSIONS = [
  {
    id: "1",
    author: {
      name: "Nguyễn Mai",
      avatar: "https://picsum.photos/seed/mai/100/100",
    },
    title: "Da mụn ẩn có nên dùng BHA Obagi không mọi người?",
    content: "Mình bị mụn ẩn vùng trán và cằm khá nhiều, da hỗn hợp thiên dầu. Nghe review BHA Obagi đẩy mụn tốt nhưng sợ break out. Ai dùng rồi cho mình xin review với ạ!",
    tags: ["Trị mụn", "BHA", "Obagi"],
    likes: 45,
    comments: 28,
    timeAgo: "3 giờ trước",
  },
  {
    id: "2",
    author: {
      name: "Trần Linh",
      avatar: "https://picsum.photos/seed/linh/100/100",
    },
    title: "Review chân thực kem chống nắng Skin1004 sau 1 tháng",
    content: "Chất kem mỏng nhẹ, thấm nhanh, không nâng tone lố. Kiềm dầu ở mức khá, cuối ngày vùng chữ T vẫn hơi bóng nhẹ. Phù hợp da dầu mụn, nhạy cảm.",
    tags: ["Review", "Kem chống nắng", "Skin1004"],
    likes: 120,
    comments: 56,
    timeAgo: "Hôm qua",
  },
  {
    id: "3",
    author: {
      name: "Lê Hân",
      avatar: "https://picsum.photos/seed/han/100/100",
    },
    title: "Xin routine phục hồi da sau nặn mụn",
    content: "Da mình vừa đi nặn mụn về đang sưng đỏ và nhạy cảm. Mọi người gợi ý giúp mình vài sản phẩm phục hồi lành tính với ạ. Cảm ơn cả nhà!",
    tags: ["Phục hồi", "Hỏi đáp", "Skincare"],
    likes: 32,
    comments: 15,
    timeAgo: "2 ngày trước",
  },
]

export function CommunityHighlights() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  }

  return (
    <section className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            Cộng đồng làm đẹp
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Nơi chia sẻ kinh nghiệm, hỏi đáp và thảo luận về mọi vấn đề làm đẹp.
            Cùng nhau xây dựng cộng đồng văn minh, hữu ích.
          </p>
        </div>
        <Link href="/community" className="shrink-0">
          <span className="text-rose-500 font-semibold hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2">
            Tham gia ngay <span aria-hidden="true">&rarr;</span>
          </span>
        </Link>
      </div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        {DISCUSSIONS.map((post) => (
          <motion.div key={post.id} variants={itemVariants}>
            <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full">
              <CardHeader className="flex flex-row items-center gap-4 p-5 pb-3">
                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{post.author.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{post.timeAgo}</div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                <Link href={`/community/${post.id}`} className="block group mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-2 mb-2 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </Link>
                <div className="flex flex-wrap gap-2 mt-auto mb-4">
                  {post.tags.map((tag) => (
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
