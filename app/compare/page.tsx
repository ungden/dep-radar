"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Star, ExternalLink } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getProducts } from "@/lib/data"
import type { Product } from "@/lib/types"

function CompareContent() {
  const searchParams = useSearchParams()
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) || []
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (ids.length === 0) {
      setLoading(false)
      return
    }
    getProducts()
      .then((data) => {
        const selected = ids
          .map((id) => data.find((product) => product.id === id))
          .filter((product): product is Product => Boolean(product))
        setProducts(selected)
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const parsePrice = (price: string): number => {
    const num = parseFloat(price.replace(/[^\d.]/g, ""))
    return isNaN(num) ? Infinity : num
  }

  const bestValue = React.useMemo(() => {
    if (products.length < 2) return {}
    const ratings = products.map((p) => p.rating)
    const maxRating = Math.max(...ratings)
    const prices = products.map((p) => parsePrice(p.price))
    const minPrice = Math.min(...prices)
    const reviews = products.map((p) => p.reviews)
    const maxReviews = Math.max(...reviews)

    const result: Record<string, Set<string>> = {
      rating: new Set<string>(),
      price: new Set<string>(),
      reviews: new Set<string>(),
    }

    products.forEach((p) => {
      if (p.rating === maxRating) result.rating.add(p.id)
      if (parsePrice(p.price) === minPrice) result.price.add(p.id)
      if (p.reviews === maxReviews) result.reviews.add(p.id)
    })

    return result
  }, [products])

  const highlightClass = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold"

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 dark:text-slate-400 text-lg">
          Đang tải dữ liệu...
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Không có sản phẩm nào để so sánh.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>
      </div>
    )
  }

  const rows: {
    label: string
    key: string
    render: (product: Product) => React.ReactNode
  }[] = [
    {
      label: "Hình ảnh",
      key: "image",
      render: (p) => (
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="200px"
            priority
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ),
    },
    {
      label: "Tên sản phẩm",
      key: "name",
      render: (p) => (
        <Link
          href={`/products/${p.id}`}
          className="font-bold text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          {p.name}
        </Link>
      ),
    },
    {
      label: "Thương hiệu",
      key: "brand",
      render: (p) => (
        <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
          {p.brand}
        </span>
      ),
    },
    {
      label: "Giá",
      key: "price",
      render: (p) => (
        <span
          className={`font-extrabold text-lg ${
            bestValue.price?.has(p.id) ? highlightClass : "text-slate-900 dark:text-slate-50"
          }`}
        >
          {p.price}
        </span>
      ),
    },
    {
      label: "Đánh giá",
      key: "rating",
      render: (p) => (
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm ${
            bestValue.rating?.has(p.id)
              ? highlightClass
              : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500"
          }`}
        >
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold">{p.rating}</span>
        </div>
      ),
    },
    {
      label: "Lượt đánh giá",
      key: "reviews",
      render: (p) => (
        <span
          className={`text-sm ${
            bestValue.reviews?.has(p.id) ? highlightClass + " px-2 py-0.5 rounded-md" : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {p.reviews.toLocaleString()} đánh giá
        </span>
      ),
    },
    {
      label: "Đã bán",
      key: "sold",
      render: (p) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {p.sold}
        </span>
      ),
    },
    {
      label: "Danh mục",
      key: "category",
      render: (p) => (
        <Badge
          variant="secondary"
          className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {p.category}
        </Badge>
      ),
    },
    {
      label: "Tags",
      key: "tags",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-wider"
            >
              {tag}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      label: "Mô tả",
      key: "description",
      render: (p) => (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4">
          {p.description}
        </p>
      ),
    },
    {
      label: "Link mua",
      key: "affiliate_url",
      render: (p) =>
        p.affiliate_url ? (
          <Button asChild size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl gap-1.5">
            <a href={p.affiliate_url} target="_blank" rel="noopener noreferrer">
              Mua ngay
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">--</span>
        ),
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button asChild variant="ghost" size="sm" className="mb-4 text-slate-500 dark:text-slate-400">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50">
            So sánh sản phẩm
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            So sánh {products.length} sản phẩm đã chọn
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[140px] min-w-[140px]">
                    Tiêu chí
                  </th>
                  {products.map((product) => (
                    <th
                      key={product.id}
                      className="p-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50"
                      style={{ minWidth: 200 }}
                    >
                      {product.brand}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.key}
                    className={
                      i % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/50 dark:bg-slate-800/20"
                    }
                  >
                    <td className="sticky left-0 z-10 p-4 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-inherit border-r border-slate-100 dark:border-slate-800 w-[140px] min-w-[140px]">
                      {row.label}
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className="p-4 text-center align-top"
                        style={{ minWidth: 200 }}
                      >
                        {row.render(product)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="animate-pulse text-slate-500 dark:text-slate-400 text-lg">
            Đang tải...
          </div>
        </div>
      }
    >
      <CompareContent />
    </React.Suspense>
  )
}
