"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Search, Plus, Pencil, Trash2, Star, Package } from "lucide-react"

const CATEGORIES = [
  "Skincare",
  "Makeup",
  "Haircare",
  "Body Care",
  "Fragrance",
  "Tools",
  "Supplements",
]

const emptyForm: Omit<Product, "id"> = {
  name: "",
  brand: "",
  image: "",
  description: "",
  rating: 0,
  reviews: 0,
  sold: "0",
  price: "",
  category: "",
  tags: [],
  affiliate_url: null,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [tagsInput, setTagsInput] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("radar_products")
      .select("*")
      .order("name")
    if (!error && data) {
      setProducts(data as Product[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditingProduct(null)
    setForm(emptyForm)
    setTagsInput("")
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setForm({
      name: product.name,
      brand: product.brand,
      image: product.image,
      description: product.description,
      rating: product.rating,
      reviews: product.reviews,
      sold: product.sold,
      price: product.price,
      category: product.category,
      tags: product.tags,
      affiliate_url: product.affiliate_url,
    })
    setTagsInput(product.tags.join(", "))
    setDialogOpen(true)
  }

  function openDelete(product: Product) {
    setDeletingProduct(product)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const payload = {
      ...form,
      tags,
      affiliate_url: form.affiliate_url || null,
    }

    if (editingProduct) {
      await supabase
        .from("radar_products")
        .update(payload)
        .eq("id", editingProduct.id)
    } else {
      await supabase.from("radar_products").insert({
        id: crypto.randomUUID(),
        ...payload,
      })
    }

    setSaving(false)
    setDialogOpen(false)
    fetchProducts()
  }

  async function handleDelete() {
    if (!deletingProduct) return
    await supabase
      .from("radar_products")
      .delete()
      .eq("id", deletingProduct.id)
    setDeleteDialogOpen(false)
    setDeletingProduct(null)
    fetchProducts()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Quản ly san pham
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {products.length} san pham
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Them san pham
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tim kiem theo ten, thuong hieu, danh muc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Product List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Dang tai...</div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {search ? "Khong tim thay san pham nao" : "Chua co san pham nao"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((product) => (
              <Card
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {product.brand} &middot; {product.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(product)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(product)}
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-sm font-semibold text-rose-500">
                          {product.price}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </span>
                        <span className="text-sm text-slate-400">
                          {product.reviews} danh gia
                        </span>
                        <span className="text-sm text-slate-400">
                          Da ban {product.sold}
                        </span>
                      </div>

                      {product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {product.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Sua san pham" : "Them san pham"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Cap nhat thong tin san pham"
                : "Dien thong tin de them san pham moi"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ten san pham</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Serum Vitamin C..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Thuong hieu</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                  placeholder="La Roche-Posay"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Gia</Label>
                <Input
                  id="price"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="350.000d"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Danh muc</Label>
                <Select
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  <option value="">Chon danh muc</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={form.rating}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      rating: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviews">So danh gia</Label>
                <Input
                  id="reviews"
                  type="number"
                  min={0}
                  value={form.reviews}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      reviews: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sold">Da ban</Label>
              <Input
                id="sold"
                value={form.sold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sold: e.target.value }))
                }
                placeholder="1.2k"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL hinh anh</Label>
              <Input
                id="image"
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mo ta</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Mo ta san pham..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (cach nhau boi dau phay)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="serum, vitamin c, chong lao hoa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliate_url">Affiliate URL</Label>
              <Input
                id="affiliate_url"
                value={form.affiliate_url ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    affiliate_url: e.target.value || null,
                  }))
                }
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Huy
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving
                ? "Dang luu..."
                : editingProduct
                  ? "Cap nhat"
                  : "Them"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xac nhan xoa</DialogTitle>
            <DialogDescription>
              Ban co chac chan muon xoa san pham &ldquo;{deletingProduct?.name}&rdquo;?
              Hanh dong nay khong the hoan tac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Huy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xoa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
