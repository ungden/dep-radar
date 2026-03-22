"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  }

  return (
    <section className="w-full bg-white dark:bg-slate-950 pt-8 pb-12">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Main Featured Article */}
          <motion.div className="lg:col-span-8" variants={itemVariants}>
            <Link href="#" className="group block">
              <div className="relative aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-2xl mb-6">
                <Image
                  src="https://picsum.photos/seed/skincare-routine/1200/600"
                  alt="Featured Article"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  priority
                />
                <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Tiêu Điểm
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <span className="text-rose-600 dark:text-rose-400 uppercase tracking-wider text-xs font-bold">Xu Hướng 2024</span>
                  <span>•</span>
                  <span>5 phút đọc</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.1] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Kỷ Nguyên Mới Của Retinol: Hiệu Quả Vượt Trội Mà Không Gây Kích Ứng
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl line-clamp-2">
                  Khám phá những công nghệ bọc Retinol tiên tiến nhất giúp tối ưu hóa khả năng chống lão hóa, mang lại làn da căng bóng mà vẫn an toàn cho cả làn da nhạy cảm nhất.
                </p>
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-50 font-semibold pt-2">
                  Đọc tiếp <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Secondary Articles */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Article 1 */}
            <motion.div variants={itemVariants}>
              <Link href="#" className="group flex flex-col sm:flex-row lg:flex-col gap-4">
                <div className="relative w-full sm:w-1/3 lg:w-full aspect-[16/9] overflow-hidden rounded-xl shrink-0">
                  <Image
                    src="https://picsum.photos/seed/sunscreen/600/400"
                    alt="Secondary Article 1"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <span className="text-rose-600 dark:text-rose-400 uppercase tracking-wider text-xs font-bold">Review Chân Thực</span>
                  <h3 className="font-display text-xl font-bold leading-tight text-slate-900 dark:text-slate-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                    Top 5 Kem Chống Nắng Quang Phổ Rộng Đáng Mua Nhất Mùa Hè Này
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    Đánh giá chi tiết từ các chuyên gia da liễu và beauty blogger hàng đầu về khả năng bảo vệ da.
                  </p>
                </div>
              </Link>
            </motion.div>

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 hidden lg:block" />

            {/* Article 2 */}
            <motion.div variants={itemVariants}>
              <Link href="#" className="group flex flex-col sm:flex-row lg:flex-col gap-4">
                <div className="relative w-full sm:w-1/3 lg:w-full aspect-[16/9] overflow-hidden rounded-xl shrink-0">
                  <Image
                    src="https://picsum.photos/seed/makeup-trend/600/400"
                    alt="Secondary Article 2"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <span className="text-rose-600 dark:text-rose-400 uppercase tracking-wider text-xs font-bold">Makeup Tips</span>
                  <h3 className="font-display text-xl font-bold leading-tight text-slate-900 dark:text-slate-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                    Xu Hướng Trang Điểm &quot;Clean Girl&quot; Đã Lỗi Thời? Đây Là Điều Tiếp Theo
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    Sự trỗi dậy của phong cách trang điểm &quot;Mob Wife&quot; và cách áp dụng vào cuộc sống hàng ngày.
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
