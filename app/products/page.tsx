"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Filter, Star } from "lucide-react"
import { motion } from "motion/react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [products, setProducts] = React.useState<Product[]>([])

  React.useEffect(() => {
    supabase.from('radar_products').select('*').then(({ data }) => setProducts(data || []))
  }, [])

  const categories = React.useMemo(
    () => Array.from(new Set(products.map(p => p.category))),
    [products]
  )

  const filteredProducts = React.useMemo(() =>
    products.filter(product => {
      const query = searchQuery.toLowerCase()
      const matchesSearch = product.name.toLowerCase().includes(query) ||
                            product.brand.toLowerCase().includes(query)
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true
      return matchesSearch && matchesCategory
    }),
    [products, searchQuery, selectedCategory]
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4">
            Khám phá Sản phẩm
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Tìm kiếm, so sánh và đọc hàng ngàn đánh giá chân thực từ cộng đồng về các sản phẩm làm đẹp, từ Skincare, Makeup đến Nước hoa.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="search"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full pl-10 bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-rose-500 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              className={`rounded-xl whitespace-nowrap ${selectedCategory === null ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
              onClick={() => setSelectedCategory(null)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tất cả danh mục
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`rounded-xl whitespace-nowrap ${selectedCategory === category ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {filteredProducts.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <Link href={`/products/${product.id}`} className="block h-full">
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-white dark:bg-slate-900 rounded-2xl h-full flex flex-col">
                    <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-50 hover:bg-white dark:hover:bg-slate-950 backdrop-blur-sm font-bold shadow-sm">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">{product.brand}</div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md text-amber-700 dark:text-amber-500 font-bold text-sm">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">({product.reviews} đánh giá)</span>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="font-extrabold text-lg text-slate-900 dark:text-slate-50">{product.price}</div>
                        <div className="flex gap-1">
                          {product.tags?.slice(0, 1).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-wider">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-slate-500 dark:text-slate-400 text-lg">Không tìm thấy sản phẩm nào phù hợp.</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => { setSearchQuery(""); setSelectedCategory(null) }}
            >
              Xóa bộ lọc
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
