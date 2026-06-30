"use client"

import * as React from "react"
import { CalendarClock, Package, Store, Users, FileText, MessageSquare, TrendingUp, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

interface Stats {
  products: number
  kols: number
  posts: number
  reviews: number
  offers: number
  timeline: number
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<Stats>({ products: 0, kols: 0, posts: 0, reviews: 0, offers: 0, timeline: 0 })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      supabase.from("radar_products").select("id", { count: "exact", head: true }),
      supabase.from("kols").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("reviews").select("id", { count: "exact", head: true }),
      supabase.from("product_offers").select("id", { count: "exact", head: true }),
      supabase.from("creator_product_events").select("id", { count: "exact", head: true }),
    ]).then(([products, kols, posts, reviews, offers, timeline]) => {
      setStats({
        products: products.count || 0,
        kols: kols.count || 0,
        posts: posts.count || 0,
        reviews: reviews.count || 0,
        offers: offers.count || 0,
        timeline: timeline.count || 0,
      })
      setLoading(false)
    })
  }, [])

  const statCards = [
    { label: "Sản phẩm", value: stats.products, icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "KOL/KOC", value: stats.kols, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Offers", value: stats.offers, icon: Store, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "Timeline", value: stats.timeline, icon: CalendarClock, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Bài viết", value: stats.posts, icon: FileText, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Đánh giá", value: stats.reviews, icon: MessageSquare, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Tổng quan hệ thống 360dep.vn</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {loading ? "..." : stat.value}
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-400" /> Hướng dẫn nhanh
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">1.</span>
                Vào <strong>Sản phẩm</strong> để thêm/sửa sản phẩm và gắn link Shopee affiliate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">2.</span>
                Vào <strong>Affiliate offers</strong> để thêm link Shopee thật, chọn offer ưu tiên và theo dõi giá snapshot
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">3.</span>
                Vào <strong>Timeline</strong> mỗi khi KOL/KOC dùng, review, recommend hoặc live bán sản phẩm mới
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">4.</span>
                Vào <strong>KOL/KOC</strong> và <strong>Bài viết</strong> để quản lý hồ sơ creator và nội dung editorial
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Cấu hình hệ thống</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex justify-between">
                <span>Tạo bài tự động</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Hoạt động</span>
              </li>
              <li className="flex justify-between">
                <span>Lịch chạy</span>
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">14:00 VN daily</span>
              </li>
              <li className="flex justify-between">
                <span>Google Analytics</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Chờ GA ID</span>
              </li>
              <li className="flex justify-between">
                <span>Shopee Affiliate</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sẵn sàng</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
