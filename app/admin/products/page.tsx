"use client"

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Package, Pencil, Plus, Search, Star, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  PRODUCT_CATEGORIES,
  getProductCategory,
  getProductSubcategoryLabel,
  productWithTaxonomy,
} from "@/lib/product-taxonomy"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"

const emptyForm: Omit<Product, "id"> = {
  name: "",
  brand: "",
  image: "",
  description: "",
  rating: 0,
  reviews: 0,
  sold: "0",
  price: "",
  category: "Skincare",
  tags: [],
  affiliate_url: null,
  category_key: "skincare",
  subcategory_key: "serum",
  concern_tags: [],
  ingredient_tags: [],
  aliases: [],
  status: "published",
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
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
  const [concernTagsInput, setConcernTagsInput] = useState("")
  const [ingredientTagsInput, setIngredientTagsInput] = useState("")
  const [aliasesInput, setAliasesInput] = useState("")
  const [saving, setSaving] = useState(false)

  const selectedCategory = getProductCategory(form.category_key)

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const { data, error } = await supabase
      .from("radar_products")
      .select("*")
      .order("name")

    if (!error && data) {
      setProducts((data as Product[]).map(productWithTaxonomy))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts()
  }, [fetchProducts])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products

    return products.filter((product) => {
      const normalized = productWithTaxonomy(product)
      return [
        normalized.name,
        normalized.brand,
        normalized.category,
        normalized.category_key ?? "",
        normalized.subcategory_key ?? "",
        ...(normalized.tags ?? []),
        ...(normalized.concern_tags ?? []),
        ...(normalized.ingredient_tags ?? []),
        ...(normalized.aliases ?? []),
      ].some((field) => field.toLowerCase().includes(q))
    })
  }, [products, search])

  function syncFormLists(product: Product) {
    const normalized = productWithTaxonomy(product)
    setTagsInput((normalized.tags ?? []).join(", "))
    setConcernTagsInput((normalized.concern_tags ?? []).join(", "))
    setIngredientTagsInput((normalized.ingredient_tags ?? []).join(", "))
    setAliasesInput((normalized.aliases ?? []).join(", "))
  }

  function openCreate() {
    setEditingProduct(null)
    setForm(emptyForm)
    syncFormLists(emptyForm as Product)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    const normalized = productWithTaxonomy(product)
    setEditingProduct(product)
    setForm({
      name: normalized.name,
      brand: normalized.brand,
      image: normalized.image,
      description: normalized.description,
      rating: normalized.rating,
      reviews: normalized.reviews,
      sold: normalized.sold,
      price: normalized.price,
      category: normalized.category,
      tags: normalized.tags,
      affiliate_url: normalized.affiliate_url,
      category_key: normalized.category_key,
      subcategory_key: normalized.subcategory_key,
      concern_tags: normalized.concern_tags,
      ingredient_tags: normalized.ingredient_tags,
      aliases: normalized.aliases,
      status: normalized.status,
    })
    syncFormLists(normalized)
    setDialogOpen(true)
  }

  function openDelete(product: Product) {
    setDeletingProduct(product)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.brand || !form.category_key || !form.subcategory_key) return
    setSaving(true)

    const category = getProductCategory(form.category_key)
    const payload = {
      ...form,
      category: category?.displayCategory ?? form.category,
      tags: splitList(tagsInput),
      concern_tags: splitList(concernTagsInput),
      ingredient_tags: splitList(ingredientTagsInput),
      aliases: splitList(aliasesInput),
      affiliate_url: form.affiliate_url || null,
    }

    if (editingProduct) {
      await supabase.from("radar_products").update(payload).eq("id", editingProduct.id)
    } else {
      await supabase.from("radar_products").insert({ id: crypto.randomUUID(), ...payload })
    }

    setSaving(false)
    setDialogOpen(false)
    fetchProducts(false)
  }

  async function handleDelete() {
    if (!deletingProduct) return
    await supabase.from("radar_products").delete().eq("id", deletingProduct.id)
    setDeleteDialogOpen(false)
    setDeletingProduct(null)
    fetchProducts(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Quan ly san pham</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{products.length} san pham trong kho</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Them san pham
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tim ten, thuong hieu, danh muc, alias, concern..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Dang tai...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Package className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">
                {search ? "Khong tim thay san pham nao" : "Chua co san pham nao"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((product) => {
              const normalized = productWithTaxonomy(product)
              return (
                <Card key={product.id} className="border-none bg-white shadow-sm dark:bg-slate-900">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {normalized.image ? (
                          <img src={normalized.image} alt={normalized.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-900 dark:text-slate-50">{normalized.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {normalized.brand} &middot; {getProductCategory(normalized.category_key)?.label ?? normalized.category}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(normalized)} className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDelete(normalized)} className="h-8 w-8 text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-rose-500">{normalized.price}</span>
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {normalized.rating}
                          </span>
                          <span className="text-sm text-slate-400">{normalized.reviews} danh gia</span>
                          <span className="text-sm text-slate-400">Da ban {normalized.sold}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getProductSubcategoryLabel(normalized.category_key, normalized.subcategory_key)}
                          </Badge>
                          {normalized.status !== "published" && (
                            <Badge variant="secondary" className="bg-amber-50 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                              {normalized.status}
                            </Badge>
                          )}
                        </div>

                        {normalized.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {normalized.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Sua san pham" : "Them san pham"}</DialogTitle>
            <DialogDescription>
              Chon taxonomy chuan de thong ke KOL/KOC theo skincare, haircare, makeup va cac nhom con.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[65vh] gap-4 overflow-y-auto py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ten san pham" id="name">
                <Input id="name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              </Field>
              <Field label="Thuong hieu" id="brand">
                <Input id="brand" value={form.brand} onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Danh muc" id="category_key">
                <Select
                  id="category_key"
                  value={form.category_key ?? "skincare"}
                  onChange={(event) =>
                    setForm((prev) => {
                      const nextCategory = getProductCategory(event.target.value)
                      return {
                        ...prev,
                        category_key: event.target.value as Product["category_key"],
                        subcategory_key: nextCategory?.subcategories[0]?.key ?? null,
                        category: nextCategory?.displayCategory ?? prev.category,
                      }
                    })
                  }
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nhom con" id="subcategory_key">
                <Select
                  id="subcategory_key"
                  value={form.subcategory_key ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, subcategory_key: event.target.value }))}
                >
                  {selectedCategory?.subcategories.map((subcategory) => (
                    <option key={subcategory.key} value={subcategory.key}>
                      {subcategory.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Gia" id="price">
                <Input id="price" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
              </Field>
              <Field label="Rating" id="rating">
                <Input id="rating" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(event) => setForm((prev) => ({ ...prev, rating: parseFloat(event.target.value) || 0 }))} />
              </Field>
              <Field label="So danh gia" id="reviews">
                <Input id="reviews" type="number" min={0} value={form.reviews} onChange={(event) => setForm((prev) => ({ ...prev, reviews: parseInt(event.target.value) || 0 }))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Da ban" id="sold">
                <Input id="sold" value={form.sold} onChange={(event) => setForm((prev) => ({ ...prev, sold: event.target.value }))} />
              </Field>
              <Field label="Trang thai" id="status">
                <Select id="status" value={form.status ?? "published"} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Product["status"] }))}>
                  <option value="published">Published</option>
                  <option value="pending">Pending product match</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>
            </div>

            <Field label="URL hinh anh" id="image">
              <Input id="image" value={form.image} onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))} placeholder="https://..." />
            </Field>

            <Field label="Mo ta" id="description">
              <Textarea id="description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} />
            </Field>

            <Field label="Tags" id="tags">
              <Input id="tags" value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="serum, phuc hoi, chong lao hoa" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Concern tags" id="concern_tags">
                <Input id="concern_tags" value={concernTagsInput} onChange={(event) => setConcernTagsInput(event.target.value)} placeholder="mun, phuc hoi, toc bet" />
              </Field>
              <Field label="Ingredient tags" id="ingredient_tags">
                <Input id="ingredient_tags" value={ingredientTagsInput} onChange={(event) => setIngredientTagsInput(event.target.value)} placeholder="B5, ceramide, SPF" />
              </Field>
            </div>

            <Field label="Aliases / cach goi khac" id="aliases">
              <Input id="aliases" value={aliasesInput} onChange={(event) => setAliasesInput(event.target.value)} placeholder="GoodnDoc B5, serum B5 GoodnDoc" />
            </Field>

            <Field label="Affiliate URL" id="affiliate_url">
              <Input id="affiliate_url" value={form.affiliate_url ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, affiliate_url: event.target.value || null }))} placeholder="https://..." />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Huy
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.brand || !form.subcategory_key}>
              {saving ? "Dang luu..." : editingProduct ? "Cap nhat" : "Them"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xac nhan xoa</DialogTitle>
            <DialogDescription>
              Ban co chac chan muon xoa san pham &ldquo;{deletingProduct?.name}&rdquo;? Hanh dong nay khong the hoan tac.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
