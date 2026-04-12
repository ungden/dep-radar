"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Search, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import type { Kol } from "@/lib/types"

const EMPTY_FORM: Omit<Kol, "id"> = {
  name: "",
  avatar: "",
  cover: "",
  platform: "Youtube",
  handle: "",
  followers: "",
  trustscore: 50,
  categories: [],
  recentreview: "",
  verified: false,
}

export default function AdminKolsPage() {
  const [kols, setKols] = React.useState<Kol[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<Omit<Kol, "id">>(EMPTY_FORM)
  const [categoriesInput, setCategoriesInput] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const fetchKols = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("kols")
      .select("*")
      .order("name", { ascending: true })
    setKols(data ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchKols()
  }, [fetchKols])

  const filtered = kols.filter(
    (k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.handle.toLowerCase().includes(search.toLowerCase()) ||
      k.platform.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setCategoriesInput("")
    setDialogOpen(true)
  }

  function openEdit(kol: Kol) {
    setEditingId(kol.id)
    setForm({
      name: kol.name,
      avatar: kol.avatar,
      cover: kol.cover,
      platform: kol.platform,
      handle: kol.handle,
      followers: kol.followers,
      trustscore: kol.trustscore,
      categories: kol.categories,
      recentreview: kol.recentreview,
      verified: kol.verified,
    })
    setCategoriesInput(kol.categories.join(", "))
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const categories = categoriesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
    const payload = { ...form, categories }

    if (editingId) {
      await supabase.from("kols").update(payload).eq("id", editingId)
    } else {
      const id = crypto.randomUUID()
      await supabase.from("kols").insert({ id, ...payload })
    }

    setSaving(false)
    setDialogOpen(false)
    fetchKols()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from("kols").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchKols()
  }

  const platformColor: Record<string, string> = {
    Youtube: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    Tiktok: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Instagram: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-50">
            KOL / KOC
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Quan ly danh sach beauty blogger & reviewer
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" /> Them KOL
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Tim kiem theo ten, handle, platform..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center text-slate-400 py-12">Dang tai...</p>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <p className="text-center text-slate-400 py-12">
          {search ? "Khong tim thay KOL nao." : "Chua co KOL nao. Bam 'Them KOL' de bat dau."}
        </p>
      )}

      {/* KOL Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((kol) => (
            <Card
              key={kol.id}
              className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden"
            >
              {/* Cover */}
              {kol.cover && (
                <div
                  className="h-24 bg-slate-200 dark:bg-slate-800 bg-cover bg-center"
                  style={{ backgroundImage: `url(${kol.cover})` }}
                />
              )}
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {kol.avatar ? (
                      <img
                        src={kol.avatar}
                        alt={kol.name}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-lg">
                        {kol.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 truncate">
                        {kol.name}
                      </h3>
                      {kol.verified ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {kol.handle}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge
                    className={`text-xs font-medium rounded-lg ${platformColor[kol.platform] || "bg-slate-100 text-slate-700"}`}
                  >
                    {kol.platform}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {kol.followers} followers
                  </span>
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    Trust {kol.trustscore}%
                  </span>
                </div>

                {/* Categories */}
                {kol.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {kol.categories.map((cat) => (
                      <Badge
                        key={cat}
                        className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Recent review */}
                {kol.recentreview && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 line-clamp-2">
                    {kol.recentreview}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-xs"
                    onClick={() => openEdit(kol)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Sua
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => setDeleteId(kol.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xoa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Chinh sua KOL" : "Them KOL moi"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Ten</Label>
              <Input
                id="name"
                placeholder="Nguyen Van A"
                className="rounded-xl"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Handle */}
            <div className="grid gap-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                placeholder="@handle"
                className="rounded-xl"
                value={form.handle}
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
              />
            </div>

            {/* Platform */}
            <div className="grid gap-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                id="platform"
                className="rounded-xl"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              >
                <option value="Youtube">Youtube</option>
                <option value="Tiktok">Tiktok</option>
                <option value="Instagram">Instagram</option>
              </Select>
            </div>

            {/* Followers */}
            <div className="grid gap-2">
              <Label htmlFor="followers">Followers</Label>
              <Input
                id="followers"
                placeholder="1.2M"
                className="rounded-xl"
                value={form.followers}
                onChange={(e) => setForm({ ...form, followers: e.target.value })}
              />
            </div>

            {/* Trust Score */}
            <div className="grid gap-2">
              <Label htmlFor="trustscore">Trust Score (0-100): {form.trustscore}</Label>
              <input
                id="trustscore"
                type="range"
                min={0}
                max={100}
                value={form.trustscore}
                onChange={(e) =>
                  setForm({ ...form, trustscore: Number(e.target.value) })
                }
                className="w-full accent-rose-600"
              />
            </div>

            {/* Avatar URL */}
            <div className="grid gap-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                placeholder="https://..."
                className="rounded-xl"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              />
            </div>

            {/* Cover URL */}
            <div className="grid gap-2">
              <Label htmlFor="cover">Cover URL</Label>
              <Input
                id="cover"
                placeholder="https://..."
                className="rounded-xl"
                value={form.cover}
                onChange={(e) => setForm({ ...form, cover: e.target.value })}
              />
            </div>

            {/* Categories */}
            <div className="grid gap-2">
              <Label htmlFor="categories">Categories (phan cach bang dau phay)</Label>
              <Input
                id="categories"
                placeholder="Skincare, Makeup, Haircare"
                className="rounded-xl"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
              />
            </div>

            {/* Recent Review */}
            <div className="grid gap-2">
              <Label htmlFor="recentreview">Recent Review</Label>
              <Input
                id="recentreview"
                placeholder="Review gan nhat..."
                className="rounded-xl"
                value={form.recentreview}
                onChange={(e) => setForm({ ...form, recentreview: e.target.value })}
              />
            </div>

            {/* Verified */}
            <div className="flex items-center gap-3">
              <input
                id="verified"
                type="checkbox"
                checked={form.verified}
                onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <Label htmlFor="verified" className="cursor-pointer">
                Verified
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDialogOpen(false)}
            >
              Huy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
            >
              {saving ? "Dang luu..." : editingId ? "Cap nhat" : "Them moi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xac nhan xoa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ban co chac chan muon xoa KOL nay? Hanh dong nay khong the hoan tac.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteId(null)}
            >
              Huy
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              onClick={handleDelete}
            >
              Xoa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
