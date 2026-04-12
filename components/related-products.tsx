"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"

interface RelatedProductsProps {
  category: string
  currentProductId: string
}

export function RelatedProducts({ category, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelated() {
      const { data } = await supabase
        .from("radar_products")
        .select("*")
        .eq("category", category)
        .neq("id", currentProductId)
        .limit(4)

      setProducts((data as Product[]) || [])
      setLoading(false)
    }

    fetchRelated()
  }, [category, currentProductId])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 mb-3" />
            <div className="h-4 rounded-xl bg-slate-200 dark:bg-slate-800 mb-2" />
            <div className="h-3 rounded-xl bg-slate-200 dark:bg-slate-800 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div>
      <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-50 mb-6">
        Sản phẩm tương tự
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-900 transition-all"
          >
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">
                {product.brand}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 mb-1">
                {product.name}
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {product.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
