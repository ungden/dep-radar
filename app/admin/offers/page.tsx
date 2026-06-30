"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ExternalLink, Pencil, Plus, RefreshCcw, Save, Store, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { SAMPLE_PRODUCT_OFFERS, SAMPLE_PRODUCT_REFERENCES } from "@/lib/timeline-data"
import type { ProductOffer } from "@/lib/types"

type OfferForm = Omit<ProductOffer, "id" | "last_checked_at"> & { last_checked_at?: string }
type ProductReference = (typeof SAMPLE_PRODUCT_REFERENCES)[number]

const emptyForm: OfferForm = {
  product_id: "",
  marketplace: "shopee",
  shop_name: "",
  seller_url: "",
  affiliate_url: "",
  price_snapshot: "",
  stock_status: "unknown",
  is_preferred: true,
}

const MARKETPLACES: { value: ProductOffer["marketplace"]; label: string }[] = [
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
  { value: "tiktok_shop", label: "TikTok Shop" },
  { value: "official", label: "Official" },
  { value: "other", label: "Khác" },
]

const STOCK_STATUSES: { value: ProductOffer["stock_status"]; label: string }[] = [
  { value: "in_stock", label: "Còn hàng" },
  { value: "out_of_stock", label: "Hết hàng" },
  { value: "unknown", label: "Chưa rõ" },
]

const ADMIN_QUERY_TIMEOUT_MS = 4500

function withAdminTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T | { data: null; error: { message: string } }> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<{ data: null; error: { message: string } }>((resolve) => {
      window.setTimeout(() => resolve({ data: null, error: { message } }), ADMIN_QUERY_TIMEOUT_MS)
    }),
  ])
}

function marketplaceLabel(value: ProductOffer["marketplace"]) {
  return MARKETPLACES.find((item) => item.value === value)?.label ?? value
}

function stockStatusLabel(value: ProductOffer["stock_status"]) {
  return STOCK_STATUSES.find((item) => item.value === value)?.label ?? value
}

function stockClass(value: ProductOffer["stock_status"]) {
  if (value === "in_stock") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  if (value === "out_of_stock") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
}

export default function AdminOffersPage() {
  const [products, setProducts] = useState<ProductReference[]>([])
  const [offers, setOffers] = useState<ProductOffer[]>([])
  const [form, setForm] = useState<OfferForm>(emptyForm)
  const [editingOffer, setEditingOffer] = useState<ProductOffer | null>(null)
  const [deletingOffer, setDeletingOffer] = useState<ProductOffer | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const productMap = useMemo(() => Object.fromEntries(products.map((product) => [product.id, product])), [products])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [productsRes, offersRes] = await Promise.all([
      withAdminTimeout(supabase.from("radar_products").select("id,name,brand").order("name"), "Supabase products timeout"),
      withAdminTimeout(supabase.from("product_offers").select("*").order("last_checked_at", { ascending: false }), "Supabase offers timeout"),
    ])

    if (productsRes.error || offersRes.error) {
      setError("Chưa đọc được đủ bảng Supabase kịp thời. Đang hiển thị seed fallback; vẫn cần Supabase để lưu thay đổi.")
      setProducts(SAMPLE_PRODUCT_REFERENCES)
      setOffers(SAMPLE_PRODUCT_OFFERS)
      setLoading(false)
      return
    }
    setProducts((productsRes.data as ProductReference[] | null) ?? [])
    setOffers((offersRes.data as ProductOffer[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openCreate(productId?: string) {
    setEditingOffer(null)
    setForm({ ...emptyForm, product_id: productId ?? "" })
    setDialogOpen(true)
  }

  function openEdit(offer: ProductOffer) {
    setEditingOffer(offer)
    setForm({
      product_id: offer.product_id,
      marketplace: offer.marketplace,
      shop_name: offer.shop_name,
      seller_url: offer.seller_url ?? "",
      affiliate_url: offer.affiliate_url ?? "",
      price_snapshot: offer.price_snapshot ?? "",
      stock_status: offer.stock_status,
      is_preferred: offer.is_preferred,
      last_checked_at: offer.last_checked_at,
    })
    setDialogOpen(true)
  }

  function openDelete(offer: ProductOffer) {
    setDeletingOffer(offer)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    if (!form.product_id || !form.shop_name) return
    setSaving(true)
    setError(null)

    const payload = {
      product_id: form.product_id,
      marketplace: form.marketplace,
      shop_name: form.shop_name,
      seller_url: form.seller_url || null,
      affiliate_url: form.affiliate_url || null,
      price_snapshot: form.price_snapshot || null,
      stock_status: form.stock_status,
      is_preferred: form.is_preferred,
      last_checked_at: new Date().toISOString(),
    }

    if (form.is_preferred) {
      await supabase.from("product_offers").update({ is_preferred: false }).eq("product_id", form.product_id)
    }

    const { error: saveError } = editingOffer
      ? await supabase.from("product_offers").update(payload).eq("id", editingOffer.id)
      : await supabase.from("product_offers").insert({ id: crypto.randomUUID(), ...payload })

    if (saveError) {
      setError(saveError.message)
    } else {
      setDialogOpen(false)
      setEditingOffer(null)
      setForm(emptyForm)
      await loadData()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deletingOffer) return
    const { error: deleteError } = await supabase.from("product_offers").delete().eq("id", deletingOffer.id)
    if (deleteError) setError(deleteError.message)
    setDeleteDialogOpen(false)
    setDeletingOffer(null)
    await loadData()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
              <Store className="h-6 w-6 text-orange-500" />
              Affiliate offers
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Quản lý nhiều link Shopee/marketplace cho mỗi sản phẩm và chọn offer ưu tiên.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Làm mới
            </Button>
            <Button onClick={() => openCreate()} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm offer
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white py-20 text-center text-slate-400 dark:bg-slate-900">Đang tải...</div>
        ) : offers.length === 0 ? (
          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-500 dark:text-slate-400">Chưa có offer nào trong Supabase.</p>
              <Button onClick={() => openCreate()} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Thêm offer đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => {
              const product = productMap[offer.product_id]
              return (
                <Card key={offer.id} className="border-none bg-white shadow-sm dark:bg-slate-900">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{marketplaceLabel(offer.marketplace)}</Badge>
                          {offer.is_preferred && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Ưu tiên</Badge>}
                          <Badge className={stockClass(offer.stock_status)}>{stockStatusLabel(offer.stock_status)}</Badge>
                          <Badge variant="secondary" className={offer.affiliate_url ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""}>
                            {offer.affiliate_url ? "Có affiliate" : "Chưa có affiliate"}
                          </Badge>
                        </div>
                        <h2 className="font-bold text-slate-900 dark:text-slate-50">{product?.name ?? offer.product_id}</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product?.brand} &bull; {offer.shop_name} &bull; {offer.price_snapshot ?? "Chưa có giá"}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
                          {offer.seller_url && (
                            <a href={offer.seller_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 dark:text-orange-300">
                              Seller/source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {offer.affiliate_url && (
                            <a href={offer.affiliate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-300">
                              Affiliate URL <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <span className="text-slate-400">Checked {new Date(offer.last_checked_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(offer)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOffer ? "Sửa offer" : "Thêm offer"}</DialogTitle>
              <DialogDescription>
                Offer ưu tiên sẽ được dùng làm nút mua trên product page. Chỉ bật affiliate khi đã có link thật.
              </DialogDescription>
            </DialogHeader>

            <div className="grid max-h-[65vh] gap-4 overflow-y-auto py-4 pr-2">
              <div className="space-y-2">
                <Label htmlFor="product_id">Sản phẩm</Label>
                <Select id="product_id" value={form.product_id} onChange={(event) => setForm((prev) => ({ ...prev, product_id: event.target.value }))}>
                  <option value="">Chọn sản phẩm</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.brand} - {product.name}</option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="marketplace">Marketplace</Label>
                  <Select id="marketplace" value={form.marketplace} onChange={(event) => setForm((prev) => ({ ...prev, marketplace: event.target.value as ProductOffer["marketplace"] }))}>
                    {MARKETPLACES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_status">Tình trạng</Label>
                  <Select id="stock_status" value={form.stock_status} onChange={(event) => setForm((prev) => ({ ...prev, stock_status: event.target.value as ProductOffer["stock_status"] }))}>
                    {STOCK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop_name">Tên shop/seller</Label>
                <Input id="shop_name" value={form.shop_name} onChange={(event) => setForm((prev) => ({ ...prev, shop_name: event.target.value }))} placeholder="Shopee Mall / official reseller" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller_url">Seller/source URL</Label>
                <Input id="seller_url" value={form.seller_url ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, seller_url: event.target.value }))} placeholder="https://shopee.vn/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliate_url">Affiliate URL thật</Label>
                <Input id="affiliate_url" value={form.affiliate_url ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, affiliate_url: event.target.value }))} placeholder="https://s.shopee.vn/..." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price_snapshot">Giá snapshot</Label>
                  <Input id="price_snapshot" value={form.price_snapshot ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, price_snapshot: event.target.value }))} placeholder="350.000đ" />
                </div>
                <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_preferred}
                    onChange={(event) => setForm((prev) => ({ ...prev, is_preferred: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600"
                  />
                  Offer ưu tiên cho product page
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving || !form.product_id || !form.shop_name} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu offer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Xóa offer</DialogTitle>
              <DialogDescription>
                Xóa offer của {deletingOffer ? productMap[deletingOffer.product_id]?.name ?? deletingOffer.product_id : ""}. Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
