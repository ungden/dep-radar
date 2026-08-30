"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ExternalLink, SkipForward } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import type { CreatorProductDisclosure, CreatorProductEventType } from "@/lib/types"

type ContentClass = "product_review" | "expert_education" | "commercial" | "ambiguous" | "no_product"
type GoldenSample = {
  id: string
  status: "pending" | "labeled" | "excluded"
  content_class: ContentClass | "unlabeled"
  expected_claims: Array<Record<string, unknown>>
  source_posts: {
    source_url: string
    title: string
    caption: string
    transcript_text: string | null
    content_lane: string
    creator_id: string
  } | null
}

const EVENT_TYPES: CreatorProductEventType[] = ["mentioned", "unboxed", "used", "reviewed", "recommended", "emptied", "repurchased", "disliked", "stopped_using", "live_sold", "sponsored"]
const DISCLOSURES: CreatorProductDisclosure[] = ["organic", "pr", "sponsored", "affiliate", "unknown"]

export default function GoldenSetPage() {
  const [samples, setSamples] = useState<GoldenSample[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [contentClass, setContentClass] = useState<ContentClass>("product_review")
  const [claim, setClaim] = useState({ brand: "", product_name: "", variant: "", product_id: "", event_type: "reviewed" as CreatorProductEventType, disclosure: "unknown" as CreatorProductDisclosure })
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = samples.find((sample) => sample.id === selectedId) ?? samples.find((sample) => sample.status === "pending") ?? samples[0] ?? null
  const progress = useMemo(() => ({ labeled: samples.filter((sample) => sample.status === "labeled").length, total: samples.length }), [samples])

  async function loadSamples() {
    const { data, error: loadError } = await supabase
      .from("evidence_golden_samples")
      .select("id,status,content_class,expected_claims,source_posts(source_url,title,caption,transcript_text,content_lane,creator_id)")
      .eq("cohort", "pilot-200")
      .order("status")
      .order("created_at")
    if (loadError) setError(loadError.message)
    else setSamples((data as unknown as GoldenSample[]) ?? [])
  }

  useEffect(() => {
    // Initial remote sync; later refreshes only follow explicit review actions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSamples()
  }, [])

  function choose(sample: GoldenSample) {
    setSelectedId(sample.id)
    setContentClass(sample.content_class === "unlabeled" ? "product_review" : sample.content_class)
    const existing = sample.expected_claims[0] ?? {}
    setClaim({
      brand: String(existing.brand ?? ""),
      product_name: String(existing.product_name ?? ""),
      variant: String(existing.variant ?? ""),
      product_id: String(existing.product_id ?? ""),
      event_type: (existing.event_type as CreatorProductEventType) ?? "reviewed",
      disclosure: (existing.disclosure as CreatorProductDisclosure) ?? "unknown",
    })
  }

  async function save(status: "labeled" | "excluded") {
    if (!selected) return
    setSaving(true)
    setError(null)
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setError("Cần đăng nhập admin để chấm golden sample.")
      setSaving(false)
      return
    }
    const noClaim = ["no_product", "expert_education"].includes(contentClass)
    if (status === "labeled" && !noClaim && (!claim.brand.trim() || !claim.product_name.trim())) {
      setError("Mẫu có sản phẩm cần brand và exact product name.")
      setSaving(false)
      return
    }
    const expectedClaims = noClaim ? [] : [{ ...claim, variant: claim.variant || null, product_id: claim.product_id || null }]
    const { error: saveError } = await supabase.from("evidence_golden_samples").update({
      status,
      content_class: status === "excluded" ? "unlabeled" : contentClass,
      expected_claims: status === "excluded" ? [] : expectedClaims,
      reviewer_note: note || null,
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id)
    if (saveError) setError(saveError.message)
    else {
      setClaim({ brand: "", product_name: "", variant: "", product_id: "", event_type: "reviewed", disclosure: "unknown" })
      setNote("")
      setSelectedId("")
      await loadSamples()
    }
    setSaving(false)
  }

  return <div className="mx-auto max-w-7xl space-y-6">
    <div><h1 className="font-display text-3xl font-black">Golden set 200</h1><p className="mt-2 text-slate-500">Mẫu người chấm để đo exact-SKU, event type và disclosure. Không dùng nhãn AI làm ground truth.</p></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Đã chấm" value={progress.labeled} /><Metric label="Tổng mẫu" value={progress.total} /><Metric label="Tiến độ" value={progress.total ? `${Math.round(progress.labeled / progress.total * 100)}%` : "0%"} /></div>
    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card><CardContent className="max-h-[75vh] space-y-2 overflow-y-auto p-4">{samples.map((sample, index) => <button key={sample.id} onClick={() => choose(sample)} className={`w-full rounded-xl border p-3 text-left ${selected?.id === sample.id ? "border-rose-300 bg-rose-50" : "border-slate-100"}`}><div className="flex gap-2"><Badge>{index + 1}</Badge><Badge variant="secondary">{sample.status}</Badge><Badge variant="secondary">{sample.source_posts?.content_lane ?? "unknown"}</Badge></div><p className="mt-2 line-clamp-2 text-sm font-semibold">{sample.source_posts?.title || sample.source_posts?.caption || "Untitled"}</p></button>)}</CardContent></Card>
      {selected && <Card><CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>{selected.source_posts?.content_lane}</Badge><h2 className="mt-2 font-display text-xl font-black">{selected.source_posts?.title}</h2></div>{selected.source_posts?.source_url && <a href={selected.source_posts.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-rose-600">Mở nguồn <ExternalLink className="h-4 w-4" /></a>}</div>
        <div className="max-h-64 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed dark:bg-slate-950">{selected.source_posts?.transcript_text || selected.source_posts?.caption || "Không có transcript/caption."}</div>
        <Field label="Content class" id="content-class"><Select id="content-class" value={contentClass} onChange={(event) => setContentClass(event.target.value as ContentClass)}><option value="product_review">Product review</option><option value="expert_education">Expert education, no product event</option><option value="commercial">Commercial/live</option><option value="ambiguous">Ambiguous product/variant</option><option value="no_product">No product</option></Select></Field>
        {!(["no_product", "expert_education"].includes(contentClass)) && <div className="grid gap-4 sm:grid-cols-2"><Field label="Brand" id="gold-brand"><Input id="gold-brand" value={claim.brand} onChange={(event) => setClaim((value) => ({ ...value, brand: event.target.value }))} /></Field><Field label="Exact product name" id="gold-product"><Input id="gold-product" value={claim.product_name} onChange={(event) => setClaim((value) => ({ ...value, product_name: event.target.value }))} /></Field><Field label="Variant / dung tích / màu" id="gold-variant"><Input id="gold-variant" value={claim.variant} onChange={(event) => setClaim((value) => ({ ...value, variant: event.target.value }))} /></Field><Field label="Catalogue product ID (nếu có)" id="gold-product-id"><Input id="gold-product-id" value={claim.product_id} onChange={(event) => setClaim((value) => ({ ...value, product_id: event.target.value }))} /></Field><Field label="Event type" id="gold-event"><Select id="gold-event" value={claim.event_type} onChange={(event) => setClaim((value) => ({ ...value, event_type: event.target.value as CreatorProductEventType }))}>{EVENT_TYPES.map((eventType) => <option key={eventType}>{eventType}</option>)}</Select></Field><Field label="Disclosure" id="gold-disclosure"><Select id="gold-disclosure" value={claim.disclosure} onChange={(event) => setClaim((value) => ({ ...value, disclosure: event.target.value as CreatorProductDisclosure }))}>{DISCLOSURES.map((disclosure) => <option key={disclosure}>{disclosure}</option>)}</Select></Field></div>}
        <Field label="Reviewer note" id="gold-note"><Textarea id="gold-note" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
        <div className="flex flex-wrap gap-2"><Button onClick={() => save("labeled")} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />Lưu nhãn & mẫu kế</Button><Button variant="outline" onClick={() => save("excluded")} disabled={saving}><SkipForward className="mr-2 h-4 w-4" />Loại khỏi set</Button></div>
      </CardContent></Card>}
    </div>
  </div>
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border bg-white p-4 dark:bg-slate-900"><div className="text-2xl font-black">{value}</div><div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div></div> }
