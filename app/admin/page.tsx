"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarClock, Package, Store, Users, FileText, MessageSquare, TrendingUp, Eye, ClipboardList, AlertTriangle, SearchCheck, Settings, Tags, Link2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProductCategoryLabel } from "@/lib/product-taxonomy"
import { supabase } from "@/lib/supabase"

interface Stats {
  products: number
  kols: number
  posts: number
  reviews: number
  offers: number
  timeline: number
  evidence: number
  readyEvidence: number
  missingTaxonomy: number
  productsWithoutOffers: number
}

interface ProductRow {
  id: string
  name: string
  brand: string
  category: string | null
  category_key: string | null
  subcategory_key: string | null
  status: string | null
}

interface EventRow {
  id: string
  creator_id: string
  product_id: string
  event_date: string
  observed_at: string
}

interface KolRow {
  id: string
  name: string
}

interface OfferRow {
  product_id: string
  affiliate_url: string | null
  seller_url: string | null
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<Stats>({ products: 0, kols: 0, posts: 0, reviews: 0, offers: 0, timeline: 0, evidence: 0, readyEvidence: 0, missingTaxonomy: 0, productsWithoutOffers: 0 })
  const [categoryStats, setCategoryStats] = React.useState<{ label: string; count: number }[]>([])
  const [trendingProducts, setTrendingProducts] = React.useState<{ label: string; count: number }[]>([])
  const [staleKols, setStaleKols] = React.useState<KolRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      supabase.from("radar_products").select("id", { count: "exact", head: true }),
      supabase.from("kols").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("reviews").select("id", { count: "exact", head: true }),
      supabase.from("product_offers").select("id", { count: "exact", head: true }),
      supabase.from("creator_product_events").select("id", { count: "exact", head: true }),
      supabase.from("creator_evidence_items").select("id", { count: "exact", head: true }),
      supabase.from("creator_evidence_items").select("id", { count: "exact", head: true }).in("status", ["new", "needs_product_match", "ready_to_publish"]),
      supabase.from("radar_products").select("id,name,brand,category,category_key,subcategory_key,status"),
      supabase.from("product_offers").select("product_id,affiliate_url,seller_url"),
      supabase.from("creator_product_events").select("id,creator_id,product_id,event_date,observed_at"),
      supabase.from("kols").select("id,name"),
    ]).then(([products, kols, posts, reviews, offers, timeline, evidence, readyEvidence, productRows, offerRows, eventRows, kolRows]) => {
      const productList = (productRows.data as ProductRow[] | null) ?? []
      const offerList = (offerRows.data as OfferRow[] | null) ?? []
      const eventList = (eventRows.data as EventRow[] | null) ?? []
      const kolList = (kolRows.data as KolRow[] | null) ?? []
      const productMap = Object.fromEntries(productList.map((product) => [product.id, product]))
      const productsWithOffers = new Set(offerList.filter((offer) => offer.affiliate_url || offer.seller_url).map((offer) => offer.product_id))

      const byCategory = new Map<string, number>()
      for (const event of eventList) {
        const product = productMap[event.product_id]
        const label = getProductCategoryLabel(product?.category_key, product?.category ?? "Chua phan loai")
        byCategory.set(label, (byCategory.get(label) ?? 0) + 1)
      }

      const byProduct = new Map<string, number>()
      for (const event of eventList) byProduct.set(event.product_id, (byProduct.get(event.product_id) ?? 0) + 1)

      const latestByCreator = new Map<string, string>()
      for (const event of eventList) {
        const current = latestByCreator.get(event.creator_id)
        if (!current || event.event_date > current) latestByCreator.set(event.creator_id, event.event_date)
      }
      const staleCutoff = new Date()
      staleCutoff.setDate(staleCutoff.getDate() - 45)

      setStats({
        products: products.count || 0,
        kols: kols.count || 0,
        posts: posts.count || 0,
        reviews: reviews.count || 0,
        offers: offers.count || 0,
        timeline: timeline.count || 0,
        evidence: evidence.count || 0,
        readyEvidence: readyEvidence.count || 0,
        missingTaxonomy: productList.filter((product) => product.status !== "archived" && (!product.category_key || !product.subcategory_key)).length,
        productsWithoutOffers: productList.filter((product) => product.status !== "archived" && !productsWithOffers.has(product.id)).length,
      })
      setCategoryStats(Array.from(byCategory.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 6))
      setTrendingProducts(Array.from(byProduct.entries())
        .map(([productId, count]) => {
          const product = productMap[productId]
          return { label: product ? `${product.brand} - ${product.name}` : productId, count }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 6))
      setStaleKols(kolList.filter((kol) => {
        const latest = latestByCreator.get(kol.id)
        return !latest || new Date(latest) < staleCutoff
      }).slice(0, 8))
      setLoading(false)
    })
  }, [])

  const statCards = [
    { label: "Sản phẩm", value: stats.products, icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "KOL/KOC", value: stats.kols, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Offers", value: stats.offers, icon: Store, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "Timeline", value: stats.timeline, icon: CalendarClock, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Evidence", value: stats.evidence, icon: ClipboardList, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
    { label: "Bài viết", value: stats.posts, icon: FileText, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Đánh giá", value: stats.reviews, icon: MessageSquare, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50">Ops Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tổng quan freshness, creator data, commerce readiness, SEO và tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/seo" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
            <SearchCheck className="h-4 w-4" />
            SEO audit
          </Link>
          <Link href="/admin/settings" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 mb-8">
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

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <OpsCard
          href="/admin/evidence"
          icon={ClipboardList}
          title="Evidence cần duyệt"
          value={loading ? "..." : stats.readyEvidence}
          detail="Nguồn public đã vào inbox nhưng chưa publish timeline."
          tone={stats.readyEvidence > 0 ? "amber" : "emerald"}
        />
        <OpsCard
          href="/admin/products"
          icon={Tags}
          title="Thiếu taxonomy"
          value={loading ? "..." : stats.missingTaxonomy}
          detail="Product cần category/subcategory trước khi lên catalogue chuẩn."
          tone={stats.missingTaxonomy > 0 ? "rose" : "emerald"}
        />
        <OpsCard
          href="/admin/offers"
          icon={Link2}
          title="Thiếu offer"
          value={loading ? "..." : stats.productsWithoutOffers}
          detail="Sản phẩm chưa có Shopee/official offer để route affiliate."
          tone={stats.productsWithoutOffers > 0 ? "amber" : "emerald"}
        />
        <OpsCard
          href="/admin/settings"
          icon={SearchCheck}
          title="GA4 tracking"
          value={process.env.NEXT_PUBLIC_GA_ID ? "Ready" : "No ID"}
          detail="Public page views/events no-op nếu chưa set NEXT_PUBLIC_GA_ID."
          tone={process.env.NEXT_PUBLIC_GA_ID ? "emerald" : "slate"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Category hot
            </h3>
            <MetricList items={categoryStats} empty="Chưa có timeline theo category" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" /> Product đang lên
            </h3>
            <MetricList items={trendingProducts} empty="Chưa có product mention" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> KOL cần cập nhật
            </h3>
            {staleKols.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staleKols.map((kol) => (
                  <Badge key={kol.id} variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {kol.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Không có KOL stale trong dữ liệu hiện tại.</p>
            )}
          </CardContent>
        </Card>

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
                Vào <strong>Evidence inbox</strong> để lưu link nguồn public, match product rồi publish timeline event
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">4.</span>
                Vào <strong>KOL/KOC</strong> và <strong>Bài viết</strong> để quản lý hồ sơ creator và nội dung editorial
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">5.</span>
                Vào <strong>SEO audit</strong> để rà metadata, sitemap, JSON-LD và tín hiệu AI-friendly
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
              <li className="flex justify-between">
                <span>Evidence cần duyệt</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">{loading ? "..." : stats.readyEvidence}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricList({ items, empty }: { items: { label: string; count: number }[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
          <span className="line-clamp-1 font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {item.count}
          </Badge>
        </div>
      ))}
    </div>
  )
}

function OpsCard({
  href,
  icon: Icon,
  title,
  value,
  detail,
  tone,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: number | string
  detail: string
  tone: "emerald" | "amber" | "rose" | "slate"
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  }[tone]

  return (
    <Link href={href}>
      <Card className="h-full border-none bg-white shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-slate-900">
        <CardContent className="p-6">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{value}</div>
          <div className="mt-1 font-bold text-slate-900 dark:text-slate-50">{title}</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{detail}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
