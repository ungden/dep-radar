"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Archive, CheckCircle2, ClipboardList, ExternalLink, PackagePlus, Plus, RefreshCcw, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { REAL_KOLS } from "@/lib/kols-data"
import type {
  CreatorEvidenceItem,
  CreatorEvidenceStatus,
  CreatorProductConfidence,
  CreatorProductDisclosure,
  CreatorProductEvent,
  CreatorProductEventType,
  CreatorProductSentiment,
  Kol,
  Product,
} from "@/lib/types"

type ProductReference = Pick<Product, "id" | "name" | "brand" | "category" | "category_key" | "subcategory_key" | "aliases" | "status">

const STATUS_OPTIONS: { value: CreatorEvidenceStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "needs_product_match", label: "Needs product match" },
  { value: "ready_to_publish", label: "Ready to publish" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
]

const EVENT_TYPES: { value: CreatorProductEventType; label: string }[] = [
  { value: "used", label: "Da dung" },
  { value: "reviewed", label: "Da review" },
  { value: "recommended", label: "Recommend" },
  { value: "disliked", label: "Khong hop" },
  { value: "emptied", label: "Dung het" },
  { value: "repurchased", label: "Mua lai" },
  { value: "live_sold", label: "Live ban" },
  { value: "sponsored", label: "Tai tro" },
  { value: "first_seen", label: "Bat dau theo doi" },
]

const SENTIMENTS: CreatorProductSentiment[] = ["positive", "mixed", "negative", "neutral"]
const DISCLOSURES: CreatorProductDisclosure[] = ["organic", "pr", "sponsored", "affiliate", "unknown"]
const CONFIDENCES: CreatorProductConfidence[] = ["high", "medium", "low"]

const today = new Date().toISOString().slice(0, 10)

const emptyEvidenceForm = {
  creator_id: "",
  source_platform: "TikTok",
  source_url: "",
  source_post_id: "",
  published_at: "",
  source_title: "",
  source_excerpt: "",
  raw_text: "",
  media_url: "",
  status: "new" as CreatorEvidenceStatus,
  candidate_product_ids: [] as string[],
  candidate_product_names: "",
  researcher_note: "",
}

const emptyPublishForm = {
  product_id: "",
  event_type: "used" as CreatorProductEventType,
  event_date: today,
  sentiment: "neutral" as CreatorProductSentiment,
  disclosure: "unknown" as CreatorProductDisclosure,
  confidence: "medium" as CreatorProductConfidence,
  usage_context: "",
}

const emptyPendingProductForm = {
  name: "",
  brand: "",
  category_key: "skincare",
  subcategory_key: "serum",
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatDate(value: string | null) {
  if (!value) return "Chua ro ngay"
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

function statusClass(status: CreatorEvidenceStatus) {
  if (status === "published") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  if (status === "ready_to_publish") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  if (status === "needs_product_match") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  if (status === "rejected") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
}

export default function AdminEvidencePage() {
  const [kols, setKols] = useState<Kol[]>([])
  const [products, setProducts] = useState<ProductReference[]>([])
  const [evidenceItems, setEvidenceItems] = useState<CreatorEvidenceItem[]>([])
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("")
  const [evidenceForm, setEvidenceForm] = useState(emptyEvidenceForm)
  const [publishForm, setPublishForm] = useState(emptyPublishForm)
  const [pendingProductForm, setPendingProductForm] = useState(emptyPendingProductForm)
  const [filterStatus, setFilterStatus] = useState<CreatorEvidenceStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedEvidence = evidenceItems.find((item) => item.id === selectedEvidenceId) ?? evidenceItems[0] ?? null
  const selectedCategory = getProductCategory(pendingProductForm.category_key)
  const kolMap = useMemo(() => Object.fromEntries(kols.map((kol) => [kol.id, kol.name])), [kols])
  const productMap = useMemo(() => Object.fromEntries(products.map((product) => [product.id, product])), [products])

  const filteredEvidence = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return evidenceItems.filter((item) => {
      if (filterStatus !== "all" && item.status !== filterStatus) return false
      if (!normalizedQuery) return true
      return [
        item.source_title,
        item.source_excerpt,
        item.raw_text ?? "",
        item.source_platform,
        kolMap[item.creator_id] ?? "",
        ...item.candidate_product_names,
      ].some((field) => field.toLowerCase().includes(normalizedQuery))
    })
  }, [evidenceItems, filterStatus, kolMap, query])

  const productSuggestions = useMemo(() => {
    const text = [
      selectedEvidence?.source_title,
      selectedEvidence?.source_excerpt,
      selectedEvidence?.raw_text,
      selectedEvidence?.candidate_product_names.join(" "),
    ].join(" ").toLowerCase()

    return products
      .map((product) => {
        const aliases = product.aliases ?? []
        const score = [product.name, product.brand, ...aliases].reduce((sum, field) => {
          if (!field) return sum
          return text.includes(field.toLowerCase()) ? sum + 10 : sum
        }, selectedEvidence?.candidate_product_ids.includes(product.id) ? 50 : 0)
        return { product, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.product)
  }, [products, selectedEvidence])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [kolsRes, productsRes, evidenceRes] = await Promise.all([
      supabase.from("kols").select("*").order("trustscore", { ascending: false }),
      supabase.from("radar_products").select("id,name,brand,category,category_key,subcategory_key,aliases,status").order("name"),
      supabase.from("creator_evidence_items").select("*").order("observed_at", { ascending: false }).limit(120),
    ])

    setKols((kolsRes.data as Kol[] | null) ?? REAL_KOLS)
    setProducts(((productsRes.data as ProductReference[] | null) ?? []).map((product) => productWithTaxonomy(product as Product)))
    if (evidenceRes.error) {
      setError("Chua doc duoc bang creator_evidence_items. Hay chay setup-db.sql truoc khi dung inbox.")
      setEvidenceItems([])
    } else {
      setEvidenceItems((evidenceRes.data as CreatorEvidenceItem[] | null) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedEvidence) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedEvidenceId(selectedEvidence.id)
    setPublishForm((prev) => ({
      ...prev,
      product_id: selectedEvidence.candidate_product_ids[0] ?? prev.product_id,
      event_date: selectedEvidence.published_at ? selectedEvidence.published_at.slice(0, 10) : prev.event_date,
    }))
  }, [selectedEvidence])

  async function saveEvidence() {
    if (!evidenceForm.creator_id || !evidenceForm.source_title || !evidenceForm.source_excerpt) return
    setSaving(true)
    setError(null)
    setMessage(null)

    const payload: CreatorEvidenceItem = {
      id: crypto.randomUUID(),
      creator_id: evidenceForm.creator_id,
      source_platform: evidenceForm.source_platform,
      source_url: evidenceForm.source_url || null,
      source_post_id: evidenceForm.source_post_id || null,
      published_at: evidenceForm.published_at ? `${evidenceForm.published_at}T00:00:00Z` : null,
      observed_at: new Date().toISOString(),
      source_title: evidenceForm.source_title,
      source_excerpt: evidenceForm.source_excerpt,
      raw_text: evidenceForm.raw_text || null,
      media_url: evidenceForm.media_url || null,
      status: evidenceForm.status,
      candidate_product_ids: evidenceForm.candidate_product_ids,
      candidate_product_names: splitList(evidenceForm.candidate_product_names),
      researcher_note: evidenceForm.researcher_note || null,
    }

    const { error: insertError } = await supabase.from("creator_evidence_items").insert(payload)
    if (insertError) {
      setError(insertError.message)
    } else {
      setEvidenceForm(emptyEvidenceForm)
      setMessage("Da luu evidence vao inbox.")
      await loadData()
      setSelectedEvidenceId(payload.id)
    }
    setSaving(false)
  }

  async function updateEvidenceStatus(item: CreatorEvidenceItem, status: CreatorEvidenceStatus) {
    setError(null)
    const { error: updateError } = await supabase.from("creator_evidence_items").update({ status }).eq("id", item.id)
    if (updateError) {
      setError(updateError.message)
    } else {
      setEvidenceItems((items) => items.map((current) => current.id === item.id ? { ...current, status } : current))
    }
  }

  async function createPendingProduct() {
    if (!pendingProductForm.name || !pendingProductForm.brand || !pendingProductForm.subcategory_key) return
    setSaving(true)
    setError(null)
    const category = getProductCategory(pendingProductForm.category_key)
    const id = `pending-${slugify(`${pendingProductForm.brand}-${pendingProductForm.name}`) || crypto.randomUUID()}`
    const payload = {
      id,
      name: pendingProductForm.name,
      brand: pendingProductForm.brand,
      image: "",
      description: "Pending product created from KOL/KOC evidence inbox.",
      rating: 0,
      reviews: 0,
      sold: "0",
      price: "",
      category: category?.displayCategory ?? "Skincare",
      tags: [],
      affiliate_url: null,
      category_key: pendingProductForm.category_key,
      subcategory_key: pendingProductForm.subcategory_key,
      concern_tags: [],
      ingredient_tags: [],
      aliases: [pendingProductForm.name, `${pendingProductForm.brand} ${pendingProductForm.name}`],
      status: "pending",
    }

    const { error: upsertError } = await supabase.from("radar_products").upsert(payload)
    if (upsertError) {
      setError(upsertError.message)
    } else {
      setPendingProductForm(emptyPendingProductForm)
      setPublishForm((prev) => ({ ...prev, product_id: id }))
      setMessage("Da tao pending product. Hay bo sung anh/link/offer truoc khi publish public.")
      await loadData()
    }
    setSaving(false)
  }

  async function publishEvent() {
    if (!selectedEvidence || !publishForm.product_id || !publishForm.event_date) return
    setSaving(true)
    setError(null)
    setMessage(null)

    const payload: CreatorProductEvent = {
      id: crypto.randomUUID(),
      creator_id: selectedEvidence.creator_id,
      product_id: publishForm.product_id,
      evidence_id: selectedEvidence.id,
      event_type: publishForm.event_type,
      event_date: publishForm.event_date,
      observed_at: new Date().toISOString(),
      source_platform: selectedEvidence.source_platform,
      source_url: selectedEvidence.source_url,
      source_post_id: selectedEvidence.source_post_id,
      source_title: selectedEvidence.source_title,
      source_excerpt: selectedEvidence.source_excerpt,
      media_url: selectedEvidence.media_url,
      sentiment: publishForm.sentiment,
      disclosure: publishForm.disclosure,
      usage_context: publishForm.usage_context || null,
      evidence_note: selectedEvidence.researcher_note || "Published from Evidence Inbox.",
      confidence: publishForm.confidence,
    }

    const { error: insertError } = await supabase.from("creator_product_events").insert(payload)
    if (insertError) {
      setError(insertError.message)
    } else {
      await updateEvidenceStatus(selectedEvidence, "published")
      setPublishForm({ ...emptyPublishForm, product_id: publishForm.product_id })
      setMessage("Da publish thanh timeline event. Evidence van co the publish them product khac neu video co nhieu san pham.")
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
              <ClipboardList className="h-6 w-6 text-rose-500" />
              Evidence Inbox
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Thu thap link public social, match product, roi publish thanh timeline KOL/KOC.
            </p>
          </div>
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Lam moi
          </Button>
        </div>

        {(error || message) && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${error ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
                <Plus className="h-5 w-5 text-rose-500" />
                Evidence moi
              </div>

              <Field label="KOL/KOC" id="creator_id">
                <Select id="creator_id" value={evidenceForm.creator_id} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, creator_id: event.target.value }))}>
                  <option value="">Chon creator</option>
                  {kols.map((kol) => (
                    <option key={kol.id} value={kol.id}>
                      {kol.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Platform" id="source_platform">
                  <Select id="source_platform" value={evidenceForm.source_platform} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, source_platform: event.target.value }))}>
                    {["TikTok", "Instagram", "YouTube", "Facebook", "360dep.vn seed", "Other"].map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Post ID" id="source_post_id">
                  <Input id="source_post_id" value={evidenceForm.source_post_id} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, source_post_id: event.target.value }))} />
                </Field>
              </div>

              <Field label="Source URL" id="source_url">
                <Input id="source_url" value={evidenceForm.source_url} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, source_url: event.target.value }))} placeholder="https://..." />
              </Field>

              <Field label="Ngay post" id="published_at">
                <Input id="published_at" type="date" value={evidenceForm.published_at} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, published_at: event.target.value }))} />
              </Field>

              <Field label="Title" id="source_title">
                <Input id="source_title" value={evidenceForm.source_title} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, source_title: event.target.value }))} />
              </Field>

              <Field label="Excerpt bang chung" id="source_excerpt">
                <Textarea id="source_excerpt" rows={3} value={evidenceForm.source_excerpt} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, source_excerpt: event.target.value }))} />
              </Field>

              <Field label="Caption/transcript raw" id="raw_text">
                <Textarea id="raw_text" rows={4} value={evidenceForm.raw_text} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, raw_text: event.target.value }))} />
              </Field>

              <Field label="Candidate product names" id="candidate_product_names">
                <Input id="candidate_product_names" value={evidenceForm.candidate_product_names} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, candidate_product_names: event.target.value }))} placeholder="brand product, product khac..." />
              </Field>

              <Field label="Candidate product da co" id="candidate_product_ids">
                <Select
                  id="candidate_product_ids"
                  value={evidenceForm.candidate_product_ids[0] ?? ""}
                  onChange={(event) => setEvidenceForm((prev) => ({ ...prev, candidate_product_ids: event.target.value ? [event.target.value] : [] }))}
                >
                  <option value="">Chua match product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.brand} - {product.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Researcher note" id="researcher_note">
                <Textarea id="researcher_note" rows={2} value={evidenceForm.researcher_note} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, researcher_note: event.target.value }))} />
              </Field>

              <Button onClick={saveEvidence} disabled={saving || !evidenceForm.creator_id || !evidenceForm.source_title || !evidenceForm.source_excerpt} className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900">
                <Archive className="h-4 w-4" />
                Luu vao inbox
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Queue evidence</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{evidenceItems.length} evidence items</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
                    <Select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as CreatorEvidenceStatus | "all")}>
                      <option value="all">Tat ca status</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </Select>
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence..." />
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-slate-400">Dang tai...</div>
                ) : filteredEvidence.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800">Chua co evidence phu hop.</div>
                ) : (
                  <div className="grid gap-3">
                    {filteredEvidence.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedEvidenceId(item.id)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${selectedEvidence?.id === item.id ? "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20" : "border-slate-100 bg-slate-50 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-950"}`}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className={statusClass(item.status)}>{STATUS_OPTIONS.find((status) => status.value === item.status)?.label ?? item.status}</Badge>
                          <Badge variant="secondary" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">{item.source_platform}</Badge>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{formatDate(item.published_at)}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-50">{item.source_title}</div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{kolMap[item.creator_id] ?? item.creator_id}</div>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.source_excerpt}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Publish timeline event</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Mot evidence co the publish nhieu event neu video nhac nhieu product.</p>
                  </div>
                  {selectedEvidence?.source_url && (
                    <a href={selectedEvidence.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
                      Nguon <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {selectedEvidence ? (
                  <>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                      <div className="font-bold text-slate-900 dark:text-slate-50">{selectedEvidence.source_title}</div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{selectedEvidence.source_excerpt}</p>
                    </div>

                    {productSuggestions.length > 0 && (
                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Suggested matches</div>
                        <div className="flex flex-wrap gap-2">
                          {productSuggestions.map((product) => (
                            <Button key={product.id} variant="outline" size="sm" onClick={() => setPublishForm((prev) => ({ ...prev, product_id: product.id }))}>
                              {product.brand} - {product.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Field label="Product" id="product_id">
                        <Select id="product_id" value={publishForm.product_id} onChange={(event) => setPublishForm((prev) => ({ ...prev, product_id: event.target.value }))}>
                          <option value="">Chon product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.brand} - {product.name} ({getProductSubcategoryLabel(product.category_key, product.subcategory_key)})
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Event type" id="event_type">
                        <Select id="event_type" value={publishForm.event_type} onChange={(event) => setPublishForm((prev) => ({ ...prev, event_type: event.target.value as CreatorProductEventType }))}>
                          {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </Select>
                      </Field>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-4">
                      <Field label="Ngay event" id="event_date">
                        <Input id="event_date" type="date" value={publishForm.event_date} onChange={(event) => setPublishForm((prev) => ({ ...prev, event_date: event.target.value }))} />
                      </Field>
                      <Field label="Sentiment" id="sentiment">
                        <Select id="sentiment" value={publishForm.sentiment} onChange={(event) => setPublishForm((prev) => ({ ...prev, sentiment: event.target.value as CreatorProductSentiment }))}>
                          {SENTIMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                        </Select>
                      </Field>
                      <Field label="Disclosure" id="disclosure">
                        <Select id="disclosure" value={publishForm.disclosure} onChange={(event) => setPublishForm((prev) => ({ ...prev, disclosure: event.target.value as CreatorProductDisclosure }))}>
                          {DISCLOSURES.map((item) => <option key={item} value={item}>{item}</option>)}
                        </Select>
                      </Field>
                      <Field label="Confidence" id="confidence">
                        <Select id="confidence" value={publishForm.confidence} onChange={(event) => setPublishForm((prev) => ({ ...prev, confidence: event.target.value as CreatorProductConfidence }))}>
                          {CONFIDENCES.map((item) => <option key={item} value={item}>{item}</option>)}
                        </Select>
                      </Field>
                    </div>

                    <Field label="Usage context" id="usage_context">
                      <Input id="usage_context" value={publishForm.usage_context} onChange={(event) => setPublishForm((prev) => ({ ...prev, usage_context: event.target.value }))} placeholder="routine sang, toc bet, livestream sale..." />
                    </Field>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={publishEvent} disabled={saving || !publishForm.product_id || !selectedEvidence} className="gap-2 bg-rose-600 text-white hover:bg-rose-700">
                        <Send className="h-4 w-4" />
                        Publish event
                      </Button>
                      <Button variant="outline" onClick={() => updateEvidenceStatus(selectedEvidence, "ready_to_publish")} disabled={saving}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark ready
                      </Button>
                      <Button variant="outline" onClick={() => updateEvidenceStatus(selectedEvidence, "rejected")} disabled={saving}>
                        Reject
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800">Chon evidence de publish.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
                  <PackagePlus className="h-5 w-5 text-amber-500" />
                  Tao pending product
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Product name" id="pending_name">
                    <Input id="pending_name" value={pendingProductForm.name} onChange={(event) => setPendingProductForm((prev) => ({ ...prev, name: event.target.value }))} />
                  </Field>
                  <Field label="Brand" id="pending_brand">
                    <Input id="pending_brand" value={pendingProductForm.brand} onChange={(event) => setPendingProductForm((prev) => ({ ...prev, brand: event.target.value }))} />
                  </Field>
                  <Field label="Danh muc" id="pending_category">
                    <Select
                      id="pending_category"
                      value={pendingProductForm.category_key}
                      onChange={(event) =>
                        setPendingProductForm((prev) => {
                          const nextCategory = getProductCategory(event.target.value)
                          return {
                            ...prev,
                            category_key: event.target.value,
                            subcategory_key: nextCategory?.subcategories[0]?.key ?? "",
                          }
                        })
                      }
                    >
                      {PRODUCT_CATEGORIES.map((category) => (
                        <option key={category.key} value={category.key}>{category.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Nhom con" id="pending_subcategory">
                    <Select id="pending_subcategory" value={pendingProductForm.subcategory_key} onChange={(event) => setPendingProductForm((prev) => ({ ...prev, subcategory_key: event.target.value }))}>
                      {selectedCategory?.subcategories.map((subcategory) => (
                        <option key={subcategory.key} value={subcategory.key}>{subcategory.label}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Button variant="outline" onClick={createPendingProduct} disabled={saving || !pendingProductForm.name || !pendingProductForm.brand || !pendingProductForm.subcategory_key} className="gap-2">
                  <PackagePlus className="h-4 w-4" />
                  Tao pending product va chon de publish
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
