"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Search, FileText, Heart, MessageSquare } from "lucide-react"
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
import type { Post } from "@/lib/types"

const CATEGORIES = [
  "Review San Pham",
  "Cham Soc Da",
  "Trang Diem",
  "Skincare Routine",
  "Cham Soc Toc",
  "Meo Lam Dep",
  "Nuoc Hoa",
  "Xu Huong",
]

const CATEGORY_LABELS: Record<string, string> = {
  "Review San Pham": "Review San Pham",
  "Cham Soc Da": "Cham Soc Da",
  "Trang Diem": "Trang Diem",
  "Skincare Routine": "Skincare Routine",
  "Cham Soc Toc": "Cham Soc Toc",
  "Meo Lam Dep": "Meo Lam Dep",
  "Nuoc Hoa": "Nuoc Hoa",
  "Xu Huong": "Xu Huong",
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface PostForm {
  title: string
  slug: string
  excerpt: string
  content: string
  author_name: string
  category: string
  image: string
  tags_str: string
}

const emptyForm: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author_name: "",
  category: CATEGORIES[0],
  image: "",
  tags_str: "",
}

export default function AdminPostsPage() {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [filterCategory, setFilterCategory] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const fetchPosts = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) setPosts(data)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const filtered = React.useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.author_name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !filterCategory || p.category === filterCategory
      return matchSearch && matchCategory
    })
  }, [posts, search, filterCategory])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(post: Post) {
    setEditingId(post.id)
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_name: post.author_name,
      category: post.category,
      image: post.image,
      tags_str: (post.tags || []).join(", "),
    })
    setDialogOpen(true)
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editingId ? prev.slug : slugify(title),
    }))
  }

  async function handleSave() {
    setSaving(true)
    const tags = form.tags_str
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      author_name: form.author_name,
      category: form.category,
      image: form.image,
      tags,
    }

    if (editingId) {
      await supabase.from("posts").update(payload).eq("id", editingId)
    } else {
      const id = crypto.randomUUID()
      await supabase.from("posts").insert({
        id,
        ...payload,
        author_avatar: "",
        likes: 0,
        comments: 0,
        product_ids: [],
        created_at: new Date().toISOString(),
      })
    }
    setSaving(false)
    setDialogOpen(false)
    fetchPosts()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from("posts").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchPosts()
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Quan ly Bai viet
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {posts.length} bai viet
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Them bai viet
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tim kiem theo tieu de, tac gia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="sm:w-56"
            >
              <option value="">Tat ca danh muc</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Dang tai...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Khong tim thay bai viet nao</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <Card
              key={post.id}
              className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 hidden sm:block"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(post)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(post.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[post.category] || post.category}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {post.author_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(post.created_at)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Heart className="h-3 w-3" /> {post.likes}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MessageSquare className="h-3 w-3" /> {post.comments}
                      </span>
                      {(post.tags || []).slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Chinh sua bai viet" : "Them bai viet moi"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Tieu de</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nhap tieu de bai viet"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="tu-dong-tao-tu-tieu-de"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Mo ta ngan</Label>
              <Input
                id="excerpt"
                value={form.excerpt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                placeholder="Mo ta ngan cho bai viet"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Noi dung</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Noi dung bai viet..."
                className="min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="author_name">Tac gia</Label>
                <Input
                  id="author_name"
                  value={form.author_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      author_name: e.target.value,
                    }))
                  }
                  placeholder="Ten tac gia"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Danh muc</Label>
                <Select
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (phan cach bang dau phay)</Label>
              <Input
                id="tags"
                value={form.tags_str}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tags_str: e.target.value }))
                }
                placeholder="skincare, serum, vitamin c"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Anh dai dien (URL)</Label>
              <Input
                id="image"
                value={form.image}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, image: e.target.value }))
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
            <Button onClick={handleSave} disabled={saving || !form.title}>
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
            Ban co chac chan muon xoa bai viet nay? Hanh dong nay khong the hoan tac.
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
