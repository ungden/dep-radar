"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarClock, ExternalLink, Plus, RefreshCcw, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { REAL_KOLS } from "@/lib/kols-data"
import { SAMPLE_CREATOR_PRODUCT_EVENTS, SAMPLE_PRODUCT_REFERENCES } from "@/lib/timeline-data"
import type { CreatorProductDisclosure, CreatorProductEvent, CreatorProductEventType, CreatorProductSentiment, Kol } from "@/lib/types"

type ProductReference = (typeof SAMPLE_PRODUCT_REFERENCES)[number]

const EVENT_TYPES: { value: CreatorProductEventType; label: string }[] = [
  { value: "first_seen", label: "Bắt đầu theo dõi" },
  { value: "used", label: "Đã dùng" },
  { value: "reviewed", label: "Đã review" },
  { value: "recommended", label: "Recommend" },
  { value: "disliked", label: "Không hợp" },
  { value: "emptied", label: "Dùng hết" },
  { value: "repurchased", label: "Mua lại" },
  { value: "live_sold", label: "Live bán" },
  { value: "sponsored", label: "Tài trợ" },
]

const DISCLOSURES: { value: CreatorProductDisclosure; label: string }[] = [
  { value: "organic", label: "Tự mua/organic" },
  { value: "pr", label: "PR" },
  { value: "sponsored", label: "Tài trợ" },
  { value: "affiliate", label: "Affiliate" },
  { value: "unknown", label: "Chưa rõ" },
]

const SENTIMENTS: { value: CreatorProductSentiment; label: string }[] = [
  { value: "positive", label: "Positive" },
  { value: "mixed", label: "Mixed" },
  { value: "negative", label: "Negative" },
  { value: "neutral", label: "Neutral" },
]

interface TimelineForm {
  creator_id: string
  product_id: string
  event_type: CreatorProductEventType
  event_date: string
  source_platform: string
  source_url: string
  source_title: string
  source_excerpt: string
  sentiment: CreatorProductSentiment
  disclosure: CreatorProductDisclosure
  usage_context: string
  evidence_note: string
  confidence: "high" | "medium" | "low"
}

const today = new Date().toISOString().slice(0, 10)

const emptyForm: TimelineForm = {
  creator_id: "",
  product_id: "",
  event_type: "used",
  event_date: today,
  source_platform: "TikTok",
  source_url: "",
  source_title: "",
  source_excerpt: "",
  sentiment: "neutral",
  disclosure: "unknown",
  usage_context: "",
  evidence_note: "",
  confidence: "medium",
}

const ADMIN_QUERY_TIMEOUT_MS = 4500

function withAdminTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T | { data: null; error: { message: string } }> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<{ data: null; error: { message: string } }>((resolve) => {
      window.setTimeout(() => resolve({ data: null, error: { message } }), ADMIN_QUERY_TIMEOUT_MS)
    }),
  ])
}

function eventLabel(type: CreatorProductEventType) {
  return EVENT_TYPES.find((item) => item.value === type)?.label ?? type
}

function sentimentClass(sentiment: CreatorProductSentiment) {
  if (sentiment === "positive") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  if (sentiment === "negative") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  if (sentiment === "mixed") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
}

export default function AdminTimelinePage() {
  const [kols, setKols] = useState<Kol[]>([])
  const [products, setProducts] = useState<ProductReference[]>([])
  const [events, setEvents] = useState<CreatorProductEvent[]>([])
  const [form, setForm] = useState<TimelineForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kolMap = useMemo(() => Object.fromEntries(kols.map((kol) => [kol.id, kol.name])), [kols])
  const productMap = useMemo(() => Object.fromEntries(products.map((product) => [product.id, product.name])), [products])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [kolsRes, productsRes, eventsRes] = await Promise.all([
      withAdminTimeout(supabase.from("kols").select("*").order("trustscore", { ascending: false }), "Supabase kols timeout"),
      withAdminTimeout(supabase.from("radar_products").select("id,name,brand").order("name"), "Supabase products timeout"),
      withAdminTimeout(supabase.from("creator_product_events").select("*").order("event_date", { ascending: false }).limit(50), "Supabase timeline timeout"),
    ])

    if (kolsRes.error || productsRes.error || eventsRes.error) {
      setError("Chưa đọc được đủ bảng Supabase kịp thời. Đang hiển thị seed fallback; vẫn cần Supabase để lưu event mới.")
      setKols(REAL_KOLS)
      setProducts(SAMPLE_PRODUCT_REFERENCES)
      setEvents(SAMPLE_CREATOR_PRODUCT_EVENTS)
      setLoading(false)
      return
    }
    setKols((kolsRes.data as Kol[] | null) ?? [])
    setProducts((productsRes.data as ProductReference[] | null) ?? [])
    setEvents((eventsRes.data as CreatorProductEvent[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  async function handleSave() {
    if (!form.creator_id || !form.product_id || !form.source_url || !form.source_title || !form.source_excerpt) return
    setSaving(true)
    setError(null)

    const payload: CreatorProductEvent = {
      id: crypto.randomUUID(),
      creator_id: form.creator_id,
      product_id: form.product_id,
      event_type: form.event_type,
      event_date: form.event_date,
      observed_at: new Date().toISOString(),
      source_platform: form.source_platform,
      source_url: form.source_url || null,
      source_title: form.source_title,
      source_excerpt: form.source_excerpt,
      media_url: null,
      sentiment: form.sentiment,
      disclosure: form.disclosure,
      usage_context: form.usage_context || null,
      evidence_note: form.evidence_note || "Nhập thủ công từ admin timeline.",
      confidence: form.confidence,
    }

    const { error: insertError } = await supabase.from("creator_product_events").insert(payload)
    if (insertError) {
      setError(insertError.message)
    } else {
      setForm((prev) => ({
        ...emptyForm,
        creator_id: prev.creator_id,
        product_id: prev.product_id,
        source_platform: prev.source_platform,
      }))
      await loadData()
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
              <CalendarClock className="h-6 w-6 text-rose-500" />
              Timeline KOL/KOC
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Thêm sự kiện khi creator dùng, review, recommend hoặc live bán một sản phẩm.
            </p>
          </div>
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
                <Plus className="h-5 w-5 text-rose-500" />
                Sự kiện mới
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creator_id">KOL/KOC</Label>
                  <Select id="creator_id" value={form.creator_id} onChange={(event) => setForm((prev) => ({ ...prev, creator_id: event.target.value }))}>
                    <option value="">Chọn creator</option>
                    {kols.map((kol) => (
                      <option key={kol.id} value={kol.id}>{kol.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_id">Sản phẩm</Label>
                  <Select id="product_id" value={form.product_id} onChange={(event) => setForm((prev) => ({ ...prev, product_id: event.target.value }))}>
                    <option value="">Chọn sản phẩm</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.brand} - {product.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Loại event</Label>
                    <Select id="event_type" value={form.event_type} onChange={(event) => setForm((prev) => ({ ...prev, event_type: event.target.value as CreatorProductEventType }))}>
                      {EVENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Ngày</Label>
                    <Input id="event_date" type="date" value={form.event_date} onChange={(event) => setForm((prev) => ({ ...prev, event_date: event.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sentiment">Sentiment</Label>
                    <Select id="sentiment" value={form.sentiment} onChange={(event) => setForm((prev) => ({ ...prev, sentiment: event.target.value as CreatorProductSentiment }))}>
                      {SENTIMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disclosure">Disclosure</Label>
                    <Select id="disclosure" value={form.disclosure} onChange={(event) => setForm((prev) => ({ ...prev, disclosure: event.target.value as CreatorProductDisclosure }))}>
                      {DISCLOSURES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_platform">Nền tảng nguồn</Label>
                  <Input id="source_platform" value={form.source_platform} onChange={(event) => setForm((prev) => ({ ...prev, source_platform: event.target.value }))} placeholder="TikTok, YouTube, Instagram..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_url">Source URL</Label>
                  <Input id="source_url" value={form.source_url} onChange={(event) => setForm((prev) => ({ ...prev, source_url: event.target.value }))} placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_title">Tiêu đề/tóm tắt nguồn</Label>
                  <Input id="source_title" value={form.source_title} onChange={(event) => setForm((prev) => ({ ...prev, source_title: event.target.value }))} placeholder="Review serum phục hồi..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_excerpt">Trích yếu bằng chứng</Label>
                  <Textarea id="source_excerpt" value={form.source_excerpt} onChange={(event) => setForm((prev) => ({ ...prev, source_excerpt: event.target.value }))} rows={3} placeholder="Creator nói gì, dùng trong ngữ cảnh nào..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage_context">Ngữ cảnh dùng</Label>
                  <Input id="usage_context" value={form.usage_context} onChange={(event) => setForm((prev) => ({ ...prev, usage_context: event.target.value }))} placeholder="Da dầu, treatment, makeup nền..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence_note">Ghi chú bằng chứng</Label>
                  <Input id="evidence_note" value={form.evidence_note} onChange={(event) => setForm((prev) => ({ ...prev, evidence_note: event.target.value }))} placeholder="Live-check, manually reviewed..." />
                </div>

                <Button onClick={handleSave} disabled={saving || !form.creator_id || !form.product_id || !form.source_url || !form.source_title || !form.source_excerpt} className="h-12 gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Đang lưu..." : "Lưu event"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">50 event mới nhất</h2>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{events.length} event</span>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-white py-20 text-center text-slate-400 dark:bg-slate-900">Đang tải...</div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Chưa có timeline event trong Supabase.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{eventLabel(event.event_type)}</Badge>
                      <Badge className={sentimentClass(event.sentiment)}>{event.sentiment}</Badge>
                      <Badge variant="secondary">{event.disclosure}</Badge>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{event.event_date}</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-50">
                      {kolMap[event.creator_id] ?? event.creator_id} → {productMap[event.product_id] ?? event.product_id}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{event.source_title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{event.source_excerpt}</p>
                    {event.source_url && (
                      <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-300">
                        Mở nguồn <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
