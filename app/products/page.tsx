"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Beaker, BookOpen, CheckCircle2, ExternalLink, Filter, Layers3, Search, ShoppingBag, Star, TrendingUp } from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CompareBar } from "@/components/compare-bar"
import { CompareButton } from "@/components/compare-button"
import { containerVariants, itemVariants } from "@/lib/animations"
import { beautyNeedFilters, catalogueSections, productMatchesCatalogue, productMatchesNeed } from "@/lib/catalogue"
import { getCreatorProductEvents, getProductOffers, getProducts } from "@/lib/data"
import { PRODUCT_CATEGORIES, getProductCategoryLabel, productMatchesTaxonomy, productWithTaxonomy } from "@/lib/product-taxonomy"
import { getMatrixNodesByProductId, productGroups, researchStageLabels, type ProductGroup } from "@/lib/content-matrix"
import { trackAffiliateClick } from "@/lib/track-click"
import type { CatalogueSection } from "@/lib/catalogue"
import type { CreatorProductEvent, Product, ProductOffer } from "@/lib/types"

type SortMode = "science" | "kol-mentions" | "recent" | "rating" | "price-low" | "price-high"

const SCIENCE_GROUPS = Object.values(productGroups)
const PRODUCT_CATALOGUE_SECTIONS = catalogueSections.filter((section) => section.slug !== "product-radar")

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedNeed, setSelectedNeed] = React.useState<string | null>(null)
  const [selectedCatalogue, setSelectedCatalogue] = React.useState("all")
  const [selectedTaxonomy, setSelectedTaxonomy] = React.useState("all")
  const [selectedGroup, setSelectedGroup] = React.useState("all")
  const [selectedBudget, setSelectedBudget] = React.useState("all")
  const [sortMode, setSortMode] = React.useState<SortMode>("science")
  const [products, setProducts] = React.useState<Product[]>([])
  const [timelineEvents, setTimelineEvents] = React.useState<CreatorProductEvent[]>([])
  const [productOffers, setProductOffers] = React.useState<ProductOffer[]>([])

  React.useEffect(() => {
    Promise.all([getProducts(), getCreatorProductEvents(), getProductOffers()]).then(([items, events, offers]) => {
      setProducts(items.map(productWithTaxonomy))
      setTimelineEvents(events)
      setProductOffers(offers)
    })
  }, [])

  const productEventStats = React.useMemo(() => {
    const stats = new Map<string, { count: number; latest: string; highConfidence: number }>()
    for (const event of timelineEvents) {
      const current = stats.get(event.product_id) ?? { count: 0, latest: "", highConfidence: 0 }
      stats.set(event.product_id, {
        count: current.count + 1,
        latest: event.event_date > current.latest ? event.event_date : current.latest,
        highConfidence: current.highConfidence + (event.confidence === "high" ? 1 : 0),
      })
    }
    return stats
  }, [timelineEvents])

  const productOfferMap = React.useMemo(() => {
    const offers = new Map<string, ProductOffer[]>()
    for (const offer of productOffers) {
      offers.set(offer.product_id, [...(offers.get(offer.product_id) ?? []), offer])
    }
    return offers
  }, [productOffers])

  const catalogueBuckets = React.useMemo(
    () =>
      PRODUCT_CATALOGUE_SECTIONS.map((section) => ({
        section,
        products: products.filter((product) => productMatchesCatalogue(product, section)),
      }))
        .filter((bucket) => bucket.products.length > 0)
        .sort((a, b) => b.products.length - a.products.length),
    [products]
  )

  const groupBuckets = React.useMemo(
    () =>
      SCIENCE_GROUPS.map((group) => ({
        group,
        products: products.filter((product) => productMatchesScienceGroup(product, group)),
      })),
    [products]
  )

  const filteredProducts = React.useMemo(() => {
    const selectedCatalogueSection = PRODUCT_CATALOGUE_SECTIONS.find((section) => section.slug === selectedCatalogue)
    const selectedScienceGroup = SCIENCE_GROUPS.find((group) => group.key === selectedGroup)
    const query = searchQuery.trim().toLowerCase()

    return products
      .filter((product) => {
        const profile = getProductScienceProfile(product)
        const haystack = [
          product.name,
          product.brand,
          product.category,
          getProductCategoryLabel(product.category_key, ""),
          product.subcategory_key ?? "",
          product.description,
          ...product.tags,
          ...(product.concern_tags ?? []),
          ...(product.ingredient_tags ?? []),
          ...(product.aliases ?? []),
          ...profile.catalogues.map((section) => section.title),
          ...profile.groups.map((group) => group.title),
          ...profile.nodes.map((node) => node.title),
        ].join(" ").toLowerCase()

        const matchesSearch = query ? haystack.includes(query) : true
        const matchesNeed = selectedNeed ? productMatchesNeed(product, selectedNeed) : true
        const matchesCatalogue = selectedCatalogueSection ? productMatchesCatalogue(product, selectedCatalogueSection) : true
        const matchesTaxonomy = productMatchesTaxonomy(product, selectedTaxonomy)
        const matchesGroup = selectedScienceGroup ? productMatchesScienceGroup(product, selectedScienceGroup) : true
        const matchesBudget = matchesBudgetFilter(product.price, selectedBudget)

        return matchesSearch && matchesNeed && matchesCatalogue && matchesTaxonomy && matchesGroup && matchesBudget
      })
      .sort((a, b) => sortProducts(a, b, sortMode, productEventStats))
  }, [products, searchQuery, selectedNeed, selectedCatalogue, selectedTaxonomy, selectedGroup, selectedBudget, sortMode, productEventStats])

  return (
    <div className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
            <Beaker className="h-3.5 w-3.5" />
            Product Radar
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
                Sản phẩm theo catalogue khoa học.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
                Đi từ vấn đề da, nhóm sản phẩm, hoạt chất và mức bằng chứng trước khi chọn link mua. Mỗi sản phẩm được đặt vào đúng ngữ cảnh routine thay vì chỉ xếp theo brand.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Metric label="Sản phẩm" value={products.length} />
              <Metric label="Catalogue" value={catalogueBuckets.length} />
              <Metric label="Lượt nhắc" value={timelineEvents.length} />
            </div>
          </div>
        </motion.section>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                Catalogue theo vấn đề
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Dùng để bắt đầu từ nhu cầu thật: da mặt, trị mụn, bodycare, tóc, makeup, mùi hương.
              </p>
            </div>
            <Link href="/catalogue" className="inline-flex items-center gap-1 text-sm font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
              Xem bản đồ catalogue <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {catalogueBuckets.slice(0, 8).map(({ section, products: bucketProducts }) => (
              <button
                key={section.slug}
                type="button"
                onClick={() => setSelectedCatalogue(selectedCatalogue === section.slug ? "all" : section.slug)}
                className={`group rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md dark:bg-slate-900 dark:hover:border-rose-900 ${
                  selectedCatalogue === section.slug ? "border-rose-300 ring-2 ring-rose-100 dark:border-rose-700 dark:ring-rose-950" : "border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="font-bold text-slate-900 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                    {section.shortTitle}
                  </div>
                  <Badge variant="secondary" className="shrink-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {bucketProducts.length}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {section.productTypes.slice(0, 3).join(" / ")}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                Nhóm sản phẩm theo ma trận research
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Các nhóm có tiêu chí “nên cân nhắc / nên tránh” để không mua theo trend.
              </p>
            </div>
            <Button
              variant={selectedGroup === "all" ? "default" : "outline"}
              className={selectedGroup === "all" ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900" : ""}
              onClick={() => setSelectedGroup("all")}
            >
              Tất cả nhóm
            </Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {groupBuckets.map(({ group, products: bucketProducts }) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setSelectedGroup(selectedGroup === group.key ? "all" : group.key)}
                className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:border-rose-200 dark:bg-slate-900 dark:hover:border-rose-900 ${
                  selectedGroup === group.key ? "border-rose-300 ring-2 ring-rose-100 dark:border-rose-700 dark:ring-rose-950" : "border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-50">{group.title}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{bucketProducts.length} sản phẩm đã map</div>
                  </div>
                  <Layers3 className="h-5 w-5 shrink-0 text-rose-500" />
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{group.description}</p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                  <span className="font-bold">Nên cân nhắc:</span> {group.whenToConsider}
                </div>
              </button>
            ))}
          </div>
        </section>

        <motion.section
          className="mb-6 space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                type="search"
                placeholder="Tìm sản phẩm, hoạt chất, vấn đề da, catalogue..."
                className="w-full rounded-xl border-transparent bg-slate-50 pl-10 focus-visible:ring-rose-500 dark:bg-slate-950"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 lg:w-[680px]">
              <SelectControl label="Catalogue" value={selectedCatalogue} onChange={setSelectedCatalogue}>
                <option value="all">Tất cả catalogue</option>
                {PRODUCT_CATALOGUE_SECTIONS.map((section) => (
                  <option key={section.slug} value={section.slug}>
                    {section.shortTitle}
                  </option>
                ))}
              </SelectControl>
              <SelectControl label="Category" value={selectedTaxonomy} onChange={setSelectedTaxonomy}>
                <option value="all">Tất cả category</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </SelectControl>
              <SelectControl label="Ngân sách" value={selectedBudget} onChange={setSelectedBudget}>
                <option value="all">Tất cả giá</option>
                <option value="under-200">Dưới 200k</option>
                <option value="200-500">200-500k</option>
                <option value="luxury">Luxury</option>
              </SelectControl>
              <SelectControl label="Sắp xếp" value={sortMode} onChange={(value) => setSortMode(value as SortMode)}>
                <option value="science">Map khoa học</option>
                <option value="kol-mentions">KOL mention nhiều</option>
                <option value="recent">Mention mới nhất</option>
                <option value="rating">Rating cao</option>
                <option value="price-low">Giá thấp</option>
                <option value="price-high">Giá cao</option>
              </SelectControl>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Nhu cầu nhanh</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedNeed === null ? "default" : "outline"}
                className={`whitespace-nowrap rounded-xl ${selectedNeed === null ? "bg-rose-600 text-white hover:bg-rose-700" : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"}`}
                onClick={() => setSelectedNeed(null)}
              >
                Tất cả nhu cầu
              </Button>
              {beautyNeedFilters.map((need) => (
                <Button
                  key={need.slug}
                  variant={selectedNeed === need.slug ? "default" : "outline"}
                  className={`whitespace-nowrap rounded-xl ${selectedNeed === need.slug ? "bg-rose-600 text-white hover:bg-rose-700" : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"}`}
                  onClick={() => setSelectedNeed(need.slug)}
                >
                  {need.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              {filteredProducts.length} sản phẩm phù hợp
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ưu tiên sản phẩm đã nối với catalogue, nhóm research và timeline KOL/KOC.
            </p>
          </div>
          {(selectedCatalogue !== "all" || selectedTaxonomy !== "all" || selectedGroup !== "all" || selectedNeed || selectedBudget !== "all" || searchQuery) && (
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={() => {
                setSearchQuery("")
                setSelectedNeed(null)
                setSelectedCatalogue("all")
                setSelectedTaxonomy("all")
                setSelectedGroup("all")
                setSelectedBudget("all")
                setSortMode("science")
              }}
            >
              <Filter className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <motion.div
            key={`${filteredProducts.length}-${selectedCatalogue}-${selectedGroup}-${sortMode}`}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredProducts.map((product, index) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ScientificProductCard product={product} priority={index === 0} eventStats={productEventStats.get(product.id)} offers={productOfferMap.get(product.id) ?? []} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="rounded-3xl border border-slate-100 bg-white py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-lg text-slate-500 dark:text-slate-400">Không tìm thấy sản phẩm nào phù hợp.</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => {
                setSearchQuery("")
                setSelectedNeed(null)
                setSelectedCatalogue("all")
                setSelectedTaxonomy("all")
                setSelectedGroup("all")
                setSelectedBudget("all")
              }}
            >
              Xóa bộ lọc
            </Button>
          </motion.div>
        )}
      </div>
      <CompareBar />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-950">
      <div className="font-display text-2xl font-black text-slate-900 dark:text-slate-50">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  )
}

function SelectControl({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
      >
        {children}
      </select>
    </label>
  )
}

function ScientificProductCard({
  product,
  priority,
  eventStats,
  offers,
}: {
  product: Product
  priority: boolean
  eventStats?: { count: number; latest: string; highConfidence: number }
  offers: ProductOffer[]
}) {
  const profile = getProductScienceProfile(product)
  const primaryCatalogue = profile.catalogues[0]
  const primaryGroup = profile.groups[0]
  const stageLabels = Array.from(new Set(profile.nodes.map((node) => researchStageLabels[node.stage]))).slice(0, 2)
  const normalizedProduct = productWithTaxonomy(product)
  const preferredOffer = getPreferredOffer(offers, product)
  const shopHref = preferredOffer?.affiliate_url ?? preferredOffer?.seller_url ?? null
  const latestMention = eventStats?.latest ? formatShortDate(eventStats.latest) : null
  const decisionReason = primaryGroup?.whenToConsider ?? primaryCatalogue?.filters.slice(0, 3).join(" / ") ?? product.description

  return (
    <Card className="flex h-full flex-col overflow-hidden border-none bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-slate-900">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white dark:bg-slate-950">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-contain p-4 transition-transform duration-500 hover:scale-105"
            referrerPolicy="no-referrer"
            unoptimized
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {primaryCatalogue && (
              <Badge className="bg-white/90 font-bold text-slate-900 shadow-sm backdrop-blur-sm hover:bg-white dark:bg-slate-950/90 dark:text-slate-50 dark:hover:bg-slate-950">
                {primaryCatalogue.shortTitle}
              </Badge>
            )}
            <Badge className="bg-slate-900/90 font-bold text-white shadow-sm hover:bg-slate-900 dark:bg-slate-50/90 dark:text-slate-900 dark:hover:bg-slate-50">
              {getProductCategoryLabel(normalizedProduct.category_key, normalizedProduct.category)}
            </Badge>
            {primaryGroup && (
              <Badge className="bg-rose-600 font-bold text-white hover:bg-rose-600">
                {primaryGroup.title}
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            {shopHref ? (
              <Badge className="bg-white/95 font-bold text-emerald-700 shadow-sm backdrop-blur hover:bg-white dark:bg-slate-950/95 dark:text-emerald-300">
                <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                Có link shop
              </Badge>
            ) : (
              <Badge className="bg-white/95 font-bold text-slate-600 shadow-sm backdrop-blur hover:bg-white dark:bg-slate-950/95 dark:text-slate-300">
                Đang chờ offer
              </Badge>
            )}
            {latestMention && (
              <Badge className="bg-slate-900/90 font-bold text-white shadow-sm hover:bg-slate-900 dark:bg-slate-50/90 dark:text-slate-900">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                {latestMention}
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-rose-500">{product.brand}</div>
        <Link href={`/products/${product.id}`} className="group">
          <h3 className="mb-2 line-clamp-2 font-bold text-slate-900 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
            {product.name}
          </h3>
        </Link>
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {product.description}
        </p>

        <div className="mb-4 rounded-xl bg-rose-50/70 p-3 text-xs leading-relaxed text-rose-950 dark:bg-rose-950/20 dark:text-rose-100">
          <span className="font-bold">Nên xem khi:</span> {decisionReason}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {stageLabels.map((stage) => (
            <Badge key={stage} variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {stage}
            </Badge>
          ))}
          {profile.groups.length === 0 && (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              Cần map nhóm
            </Badge>
          )}
          {eventStats && eventStats.count > 0 && (
            <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
              {eventStats.count} lượt nhắc
            </Badge>
          )}
          {preferredOffer && (
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
              {preferredOffer.marketplace === "shopee" ? "Shopee" : preferredOffer.marketplace}
            </Badge>
          )}
        </div>

        {primaryGroup && (
          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            <span className="font-bold">Tránh khi:</span> {primaryGroup.whenToAvoid}
          </div>
        )}

        <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="font-extrabold text-lg text-slate-900 dark:text-slate-50">{product.price}</div>
            <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-sm font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {product.rating}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
            <CompareButton productId={product.id} productName={product.name} />
            {shopHref && (
              <ShopLinkButton href={shopHref} productId={product.id} offerId={preferredOffer?.id} />
            )}
            <Link
              href={`/products/${product.id}`}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition-colors hover:bg-rose-600 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-rose-200"
              aria-label={`Xem detail ${product.name}`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">Xem detail</span>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ShopLinkButton({ href, productId, offerId }: { href: string; productId: string; offerId?: string }) {
  function openShop(event: React.MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation()
    void trackAffiliateClick(productId, offerId)
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={openShop}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white transition-colors hover:bg-rose-700"
      aria-label="Mở link shop"
    >
      <ExternalLink className="h-4 w-4" />
    </a>
  )
}

function getProductScienceProfile(product: Product) {
  const groups = SCIENCE_GROUPS.filter((group) => productMatchesScienceGroup(product, group))
  const nodes = getMatrixNodesByProductId(product.id)
  const catalogues = PRODUCT_CATALOGUE_SECTIONS.filter((section) => productMatchesCatalogue(product, section))
  return { groups, nodes, catalogues }
}

function productMatchesScienceGroup(product: Product, group: ProductGroup) {
  return [...group.productIds, ...group.comparisonProductIds].includes(product.id)
}

function sortProducts(a: Product, b: Product, sortMode: SortMode, eventStats: Map<string, { count: number; latest: string; highConfidence: number }>) {
  const aStats = eventStats.get(a.id) ?? { count: 0, latest: "", highConfidence: 0 }
  const bStats = eventStats.get(b.id) ?? { count: 0, latest: "", highConfidence: 0 }
  if (sortMode === "kol-mentions") return bStats.count - aStats.count || bStats.highConfidence - aStats.highConfidence || scienceScore(b) - scienceScore(a)
  if (sortMode === "recent") return bStats.latest.localeCompare(aStats.latest) || bStats.count - aStats.count || scienceScore(b) - scienceScore(a)
  if (sortMode === "rating") return b.rating - a.rating
  if (sortMode === "price-low") return parsePrice(a.price) - parsePrice(b.price)
  if (sortMode === "price-high") return parsePrice(b.price) - parsePrice(a.price)

  return scienceScore(b) - scienceScore(a) || b.rating - a.rating
}

function scienceScore(product: Product) {
  const profile = getProductScienceProfile(product)
  return profile.groups.length * 5 + profile.nodes.length * 2 + profile.catalogues.length + product.rating / 10
}

function matchesBudgetFilter(price: string, budget: string) {
  if (budget === "all") return true
  const amount = parsePrice(price)
  if (!Number.isFinite(amount)) return true

  if (budget === "under-200") return amount < 200000
  if (budget === "200-500") return amount >= 200000 && amount <= 500000
  if (budget === "luxury") return amount > 500000
  return true
}

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, ""))
}

function getPreferredOffer(offers: ProductOffer[], product: Product) {
  return offers.find((offer) => offer.is_preferred && offer.affiliate_url)
    ?? offers.find((offer) => offer.affiliate_url)
    ?? offers.find((offer) => offer.is_preferred)
    ?? offers[0]
    ?? (product.affiliate_url
      ? {
          id: `legacy-affiliate-${product.id}`,
          product_id: product.id,
          marketplace: "shopee" as const,
          shop_name: "Shopee affiliate",
          seller_url: null,
          affiliate_url: product.affiliate_url,
          price_snapshot: product.price,
          stock_status: "unknown" as const,
          is_preferred: true,
          last_checked_at: "2026-06-30T00:00:00Z",
        }
      : null)
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value))
}
