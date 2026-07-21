"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ExternalLink, Merge, PackagePlus, RefreshCcw, SearchCheck, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PRODUCT_CATEGORIES, getProductCategory } from "@/lib/product-taxonomy"
import { supabase } from "@/lib/supabase"
import type { EvidenceClaim, ProductCandidate, ProductCandidateSource, ProductCandidateStatus } from "@/lib/types"

type CandidateSourceRow = ProductCandidateSource & {
  source_posts?: { source_url: string; caption: string; transcript_text: string | null; published_at: string | null } | null
  kols?: { name: string } | null
}

const STATUSES: ProductCandidateStatus[] = ["new", "needs_identity", "ready_to_create", "merged", "rejected"]

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function normalize(value: string) {
  return slugify(value)
}

export default function ProductCandidatesPage() {
  const [candidates, setCandidates] = useState<ProductCandidate[]>([])
  const [sources, setSources] = useState<CandidateSourceRow[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [filter, setFilter] = useState<ProductCandidateStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [categoryKey, setCategoryKey] = useState("skincare")
  const [subcategoryKey, setSubcategoryKey] = useState("serum")
  const [form, setForm] = useState({ brand: "", product_name: "", variant: "", official_product_url: "", image_source_url: "", review_note: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null
  const selectedCategory = getProductCategory(categoryKey)
  const visible = useMemo(() => candidates.filter((candidate) => {
    if (filter !== "all" && candidate.status !== filter) return false
    const needle = query.trim().toLowerCase()
    return !needle || [candidate.brand, candidate.product_name, candidate.variant ?? "", ...candidate.aliases].some((value) => value.toLowerCase().includes(needle))
  }), [candidates, filter, query])

  async function loadSources(candidateId: string) {
    const { data, error: sourceError } = await supabase
      .from("product_candidate_sources")
      .select("*, source_posts(source_url,caption,transcript_text,published_at), kols(name)")
      .eq("candidate_id", candidateId)
      .order("confidence_score", { ascending: false })
    if (sourceError) setError(sourceError.message)
    setSources((data as CandidateSourceRow[] | null) ?? [])
  }

  function selectCandidate(candidate: ProductCandidate) {
    setSelectedId(candidate.id)
    setForm({
      brand: candidate.brand,
      product_name: candidate.product_name,
      variant: candidate.variant ?? "",
      official_product_url: candidate.official_product_url ?? "",
      image_source_url: candidate.image_source_url ?? "",
      review_note: candidate.review_note ?? "",
    })
    void loadSources(candidate.id)
  }

  async function loadCandidates() {
    setLoading(true)
    setError(null)
    const { data, error: loadError } = await supabase.from("product_candidates").select("*").order("creator_count", { ascending: false }).order("identity_confidence", { ascending: false })
    if (loadError) setError(loadError.message)
    const nextCandidates = (data as ProductCandidate[] | null) ?? []
    setCandidates(nextCandidates)
    const nextSelected = nextCandidates.find((candidate) => candidate.id === selectedId) ?? nextCandidates[0]
    if (nextSelected) selectCandidate(nextSelected)
    else {
      setSelectedId("")
      setSources([])
    }
    setLoading(false)
  }

  useEffect(() => {
    // Initial server sync; later refreshes are explicit admin actions.
    void loadCandidates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveCandidate(status: ProductCandidateStatus) {
    if (!selected) return
    setSaving(true)
    setError(null)
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setError("Cần đăng nhập admin để review candidate.")
      setSaving(false)
      return
    }
    const reviewed = ["ready_to_create", "merged", "rejected"].includes(status)
    const { error: updateError } = await supabase.from("product_candidates").update({
      ...form,
      variant: form.variant || null,
      official_product_url: form.official_product_url || null,
      image_source_url: form.image_source_url || null,
      review_note: form.review_note || null,
      status,
      reviewed_by: reviewed ? authData.user.id : selected.reviewed_by,
      reviewed_at: reviewed ? new Date().toISOString() : selected.reviewed_at,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id)
    if (updateError) setError(updateError.message)
    else {
      setMessage(`Đã cập nhật candidate thành ${status}.`)
      await loadCandidates()
    }
    setSaving(false)
  }

  async function mergeEvidence(productId: string) {
    const evidenceIds = Array.from(new Set(sources.map((source) => source.evidence_id).filter((id): id is string => Boolean(id))))
    for (const evidenceId of evidenceIds) {
      const { data: evidence } = await supabase.from("creator_evidence_items").select("candidate_product_ids,candidate_product_names,extracted_claims").eq("id", evidenceId).maybeSingle()
      if (!evidence) continue
      const claims = ((evidence.extracted_claims ?? []) as EvidenceClaim[]).map((claim) => {
        const sameCandidate = normalize(`${claim.brand}-${claim.product_name}-${claim.variant ?? ""}`) === normalize(`${form.brand}-${form.product_name}-${form.variant}`)
        return sameCandidate ? { ...claim, matched_product_id: productId, risk_flags: claim.risk_flags.filter((flag) => flag !== "product_not_in_catalogue" && flag !== "ambiguous_variant") } : claim
      })
      await supabase.from("creator_evidence_items").update({
        candidate_product_ids: Array.from(new Set([...(evidence.candidate_product_ids ?? []), productId])),
        candidate_product_names: Array.from(new Set([...(evidence.candidate_product_names ?? []), `${form.brand} ${form.product_name}${form.variant ? ` ${form.variant}` : ""}`])),
        extracted_claims: claims,
        updated_at: new Date().toISOString(),
      }).eq("id", evidenceId)
    }
  }

  async function createProductAndMerge() {
    if (!selected) return
    setSaving(true)
    setError(null)
    setMessage(null)
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setError("Cần đăng nhập admin để tạo sản phẩm.")
      setSaving(false)
      return
    }
    if (selected.identity_confidence < 90 || selected.source_post_count < 1) {
      setError("Candidate phải đạt ít nhất 90 điểm và có nguồn trước khi tạo sản phẩm.")
      setSaving(false)
      return
    }
    if (!form.official_product_url.startsWith("https://") || !form.image_source_url.startsWith("https://")) {
      setError("Cần official product URL và nguồn ảnh HTTPS trước khi public sản phẩm.")
      setSaving(false)
      return
    }
    const category = getProductCategory(categoryKey)
    const fullName = `${form.product_name}${form.variant ? ` ${form.variant}` : ""}`.trim()
    const productId = slugify(`${form.brand}-${fullName}`)
    const { error: productError } = await supabase.from("radar_products").upsert({
      id: productId,
      name: fullName,
      brand: form.brand,
      image: form.image_source_url,
      rating: null,
      reviews: 0,
      sold: "Đang cập nhật",
      price: "Đang cập nhật",
      category: category?.displayCategory ?? "Skincare",
      tags: [],
      description: `Sản phẩm được phát hiện từ evidence creator và đã đối chiếu exact SKU với nguồn chính thức.`,
      affiliate_url: null,
      category_key: categoryKey,
      subcategory_key: subcategoryKey,
      concern_tags: [],
      ingredient_tags: [],
      aliases: Array.from(new Set([...selected.aliases, form.product_name, `${form.brand} ${fullName}`])),
      status: "published",
    }, { onConflict: "id" })
    if (productError) {
      setError(productError.message)
      setSaving(false)
      return
    }
    await mergeEvidence(productId)
    const { error: mergeError } = await supabase.from("product_candidates").update({
      ...form,
      variant: form.variant || null,
      official_product_url: form.official_product_url,
      image_source_url: form.image_source_url,
      status: "merged",
      matched_product_id: productId,
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id)
    if (mergeError) setError(mergeError.message)
    else {
      setMessage(`Đã tạo ${form.brand} ${fullName}, rematch evidence và đưa vào danh sách affiliate pending.`)
      await loadCandidates()
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-slate-900 dark:text-slate-50">Product candidates</h1>
          <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">Video → candidate → exact SKU → sản phẩm. Candidate không bao giờ public trực tiếp.</p>
        </div>
        <Button variant="outline" onClick={loadCandidates}><RefreshCcw className="mr-2 h-4 w-4" />Làm mới</Button>
      </div>

      {(message || error) && <div className={`rounded-2xl border p-4 text-sm font-semibold ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</div>}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card><CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-2">
            <Select value={filter} onChange={(event) => setFilter(event.target.value as ProductCandidateStatus | "all")}><option value="all">Tất cả</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</Select>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm brand/SKU" />
          </div>
          <div className="space-y-2">
            {loading ? <p className="py-8 text-center text-slate-400">Đang tải…</p> : visible.map((candidate) => (
              <button key={candidate.id} onClick={() => selectCandidate(candidate)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id === candidate.id ? "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20" : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"}`}>
                <div className="flex flex-wrap gap-2"><Badge>{candidate.status}</Badge><Badge variant="secondary">{candidate.identity_confidence}/100</Badge><Badge variant="secondary">{candidate.creator_count} creator</Badge></div>
                <div className="mt-2 font-bold text-slate-900 dark:text-slate-50">{candidate.brand} {candidate.product_name}</div>
                {candidate.variant && <div className="mt-1 text-sm text-slate-500">{candidate.variant}</div>}
              </button>
            ))}
          </div>
        </CardContent></Card>

        {selected ? <div className="space-y-6">
          <Card><CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl font-black">Chuẩn hóa exact SKU</h2><Badge variant="secondary">{selected.source_post_count} nguồn</Badge></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Brand" id="brand"><Input id="brand" value={form.brand} onChange={(event) => setForm((value) => ({ ...value, brand: event.target.value }))} /></Field><Field label="Product name" id="product-name"><Input id="product-name" value={form.product_name} onChange={(event) => setForm((value) => ({ ...value, product_name: event.target.value }))} /></Field><Field label="Variant / dung tích / màu" id="variant"><Input id="variant" value={form.variant} onChange={(event) => setForm((value) => ({ ...value, variant: event.target.value }))} /></Field><Field label="Official product URL" id="official-url"><Input id="official-url" value={form.official_product_url} onChange={(event) => setForm((value) => ({ ...value, official_product_url: event.target.value }))} placeholder="https://brand.com/..." /></Field><Field label="Image source URL" id="image-url"><Input id="image-url" value={form.image_source_url} onChange={(event) => setForm((value) => ({ ...value, image_source_url: event.target.value }))} placeholder="https://...jpg" /></Field><Field label="Danh mục" id="category"><Select id="category" value={categoryKey} onChange={(event) => { const next = getProductCategory(event.target.value); setCategoryKey(event.target.value); setSubcategoryKey(next?.subcategories[0]?.key ?? "") }}>{PRODUCT_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}</Select></Field><Field label="Nhóm con" id="subcategory"><Select id="subcategory" value={subcategoryKey} onChange={(event) => setSubcategoryKey(event.target.value)}>{selectedCategory?.subcategories.map((subcategory) => <option key={subcategory.key} value={subcategory.key}>{subcategory.label}</option>)}</Select></Field></div>
            <Field label="Review note" id="review-note"><Textarea id="review-note" value={form.review_note} onChange={(event) => setForm((value) => ({ ...value, review_note: event.target.value }))} /></Field>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => saveCandidate("needs_identity")} disabled={saving}><SearchCheck className="mr-2 h-4 w-4" />Cần kiểm tra</Button><Button variant="outline" onClick={() => saveCandidate("rejected")} disabled={saving}><XCircle className="mr-2 h-4 w-4" />Reject</Button><Button onClick={createProductAndMerge} disabled={saving} className="bg-rose-600 text-white hover:bg-rose-700"><PackagePlus className="mr-2 h-4 w-4" />Tạo sản phẩm & rematch</Button></div>
          </CardContent></Card>

          <Card><CardContent className="space-y-3 p-6"><h2 className="flex items-center gap-2 font-display text-xl font-black"><Merge className="h-5 w-5 text-cyan-500" />Nguồn candidate</h2>{sources.map((source) => <div key={source.source_post_id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><div className="flex flex-wrap gap-2"><Badge variant="secondary">{source.kols?.name ?? source.creator_id}</Badge><Badge variant="secondary">{source.event_type}</Badge><Badge variant="secondary">{source.disclosure}</Badge><Badge>{source.confidence_score}/100</Badge></div><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{source.evidence_spans[0]?.value ?? source.source_posts?.caption ?? "Chưa có evidence span"}</p>{source.source_posts?.source_url && <a className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-rose-600" href={source.source_posts.source_url} target="_blank" rel="noopener noreferrer">Mở TikTok <ExternalLink className="h-3.5 w-3.5" /></a>}</div>)}</CardContent></Card>
        </div> : <div className="rounded-3xl border border-dashed p-12 text-center text-slate-500">Chọn một candidate để review.</div>}
      </div>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>
}
