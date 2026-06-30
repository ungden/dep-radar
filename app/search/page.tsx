"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Search, Package, FileText, Users } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { searchAll } from "@/lib/data"
import { trackEvent } from "@/lib/analytics"
import type { Product, Post, Kol } from "@/lib/types"

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [products, setProducts] = useState<Product[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [kols, setKols] = useState<Kol[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      return
    }

    let active = true

    async function search() {
      setLoading(true)
      const results = await searchAll(query)
      if (!active) return
      setProducts(results.products)
      setPosts(results.posts)
      setKols(results.kols)
      trackEvent("search", {
        search_term: query,
        result_count: results.products.length + results.posts.length + results.kols.length,
      })
      setLoading(false)
    }

    search()
    return () => {
      active = false
    }
  }, [query])

  const totalResults = products.length + posts.length + kols.length
  const hasQuery = query.trim().length > 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-2">
            Tìm kiếm
          </h1>
          {hasQuery && !loading && (
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {totalResults} kết quả cho &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {hasQuery && loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-rose-200 dark:border-rose-800 border-t-rose-600 dark:border-t-rose-400 rounded-full animate-spin" />
          </div>
        )}

        {!loading && hasQuery && totalResults === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Search className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Thử tìm kiếm với từ khóa khác
            </p>
          </div>
        )}

        {!loading && !hasQuery && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Search className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              Nhập từ khóa để bắt đầu tìm kiếm
            </p>
          </div>
        )}

        {/* Products Section */}
        {!loading && products.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Package className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50">
                Sản phẩm
              </h2>
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {products.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl h-full group">
                    <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        priority={index === 0}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">
                        {product.brand}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-50">
                        {product.price}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Posts Section */}
        {!loading && posts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50">
                Bài viết
              </h2>
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {posts.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <Link key={post.id} href={`/blog/${post.id}`}>
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl h-full group">
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        priority={products.length === 0 && index === 0}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs mb-2">
                        {post.category}
                      </Badge>
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {post.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* KOLs Section */}
        {!loading && kols.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50">
                KOL/KOC
              </h2>
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {kols.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {kols.map((kol) => (
                <Link key={kol.id} href={`/koc-tracker/${kol.id}`}>
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl h-full group">
                    <CardContent className="p-6 flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-sm">
                        <AvatarImage src={kol.avatar} />
                        <AvatarFallback>{kol.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                          {kol.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {kol.handle}
                        </p>
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs mt-1">
                          {kol.platform}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-rose-200 dark:border-rose-800 border-t-rose-600 dark:border-t-rose-400 rounded-full animate-spin" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  )
}
