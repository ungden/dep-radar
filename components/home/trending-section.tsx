"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { motion } from "motion/react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function TrendingSection() {
  const [PRODUCTS, setPRODUCTS] = React.useState<any[]>([])

  React.useEffect(() => {
    supabase.from('radar_products').select('*').limit(6).then(({ data }) => setPRODUCTS(data || []))
  }, [])

  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  ])

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
    <section className="container mx-auto px-4 md:px-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Top Sản Phẩm Thịnh Hành
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Những sản phẩm được tìm kiếm và đánh giá nhiều nhất tuần qua.
          </p>
        </div>
        <Link href="/products">
          <Button variant="outline" className="hidden sm:flex rounded-full">
            Xem tất cả
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <motion.div 
          className="flex -ml-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {PRODUCTS.map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 pl-4"
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <Badge className="absolute top-3 left-3 bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-50 hover:bg-white dark:hover:bg-slate-950 backdrop-blur-sm border-none shadow-sm">
                    {product.category}
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-2 flex-1">
                  <div className="text-xs font-medium text-rose-500 uppercase tracking-wider mb-1">
                    {product.brand}
                  </div>
                  <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                    <Link href={`/products/${product.id}`} className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors text-slate-900 dark:text-slate-50">
                      {product.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{product.rating}</span>
                    <span className="text-xs text-slate-400">({product.reviews} đánh giá)</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-50">{product.price}</div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full rounded-xl gap-2 font-semibold shadow-sm" variant="default">
                    <ShoppingCart className="w-4 h-4" />
                    So sánh giá
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}