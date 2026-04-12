"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Star, MessageSquare, Heart, AlertCircle } from "lucide-react"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import type { Review, Kol, Product } from "@/lib/types"

interface ReviewForm {
  kolid: string
  productid: string
  rating: number
  ispr: boolean
  timeago: string
  content: string
}

const emptyForm: ReviewForm = {
  kolid: "",
  productid: "",
  rating: 5,
  ispr: false,
  timeago: "",
  content: "",
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [kols, setKols] = React.useState<Kol[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<ReviewForm>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  const kolMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    kols.forEach((k) => (map[k.id] = k.name))
    return map
  }, [kols])

  const productMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    products.forEach((p) => (map[p.id] = p.name))
    return map
  }, [products])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    const [reviewsRes, kolsRes, productsRes] = await Promise.all([
      supabase.from("reviews").select("*"),
      supabase.from("kols").select("id, name"),
      supabase.from("radar_products").select("id, name"),
    ])
    if (reviewsRes.data) setReviews(reviewsRes.data)
    if (kolsRes.data) setKols(kolsRes.data as Kol[])
    if (productsRes.data) setProducts(productsRes.data as Product[])
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = React.useMemo(() => {
    if (!search) return reviews
    const q = search.toLowerCase()
    return reviews.filter((r) => {
      const kolName = kolMap[r.kolid] || ""
      const productName = productMap[r.productid] || ""
      return (
        kolName.toLowerCase().includes(q) ||
        productName.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q)
      )
    })
  }, [reviews, search, kolMap, productMap])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(review: Review) {
    setEditingId(review.id)
    setForm({
      kolid: review.kolid,
      productid: review.productid,
      rating: review.rating,
      ispr: review.ispr,
      timeago: review.timeago,
      content: review.content,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      kolid: form.kolid,
      productid: form.productid,
      rating: form.rating,
      ispr: form.ispr,
      timeago: form.timeago,
      content: form.content,
    }

    if (editingId) {
      await supabase.from("reviews").update(payload).eq("id", editingId)
    } else {
      const id = crypto.randomUUID()
      await supabase.from("reviews").insert({
        id,
        ...payload,
        likes: 0,
        comments: 0,
      })
    }
    setSaving(false)
    setDialogOpen(false)
    fetchData()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from("reviews").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchData()
  }

  function renderStars(rating: number) {
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < rating
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300 dark:text-slate-600"
            }`}
          />
        ))}
      </span>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Quan ly Danh gia
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {reviews.length} danh gia
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Them danh gia
        </Button>
      </div>

      {/* Search */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tim kiem theo KOL, san pham, noi dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Dang tai...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Khong tim thay danh gia nao</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <Card
              key={review.id}
              className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                        {kolMap[review.kolid] || review.kolid}
                      </span>
                      <span className="text-slate-400 text-xs">danh gia</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                        {productMap[review.productid] || review.productid}
                      </span>
                      {review.ispr && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                          PR
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-slate-400">
                        {review.timeago}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {review.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Heart className="h-3 w-3" /> {review.likes}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MessageSquare className="h-3 w-3" /> {review.comments}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(review)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(review.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Chinh sua danh gia" : "Them danh gia moi"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="kolid">KOL/KOC</Label>
              <Select
                id="kolid"
                value={form.kolid}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, kolid: e.target.value }))
                }
              >
                <option value="">-- Chon KOL --</option>
                {kols.map((kol) => (
                  <option key={kol.id} value={kol.id}>
                    {kol.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productid">San pham</Label>
              <Select
                id="productid"
                value={form.productid}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productid: e.target.value }))
                }
              >
                <option value="">-- Chon san pham --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rating">Rating</Label>
                <Select
                  id="rating"
                  value={String(form.rating)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      rating: Number(e.target.value),
                    }))
                  }
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} sao
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeago">Thoi gian</Label>
                <Input
                  id="timeago"
                  value={form.timeago}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, timeago: e.target.value }))
                  }
                  placeholder="vd: 2 ngay truoc"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ispr"
                checked={form.ispr}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ispr: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
              />
              <Label htmlFor="ispr" className="cursor-pointer">
                Bai viet tai tro (PR)
              </Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Noi dung danh gia</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Noi dung danh gia..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Huy
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.kolid || !form.productid}
            >
              {saving ? "Dang luu..." : editingId ? "Cap nhat" : "Tao moi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xac nhan xoa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ban co chac chan muon xoa danh gia nay? Hanh dong nay khong the hoan tac.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
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
