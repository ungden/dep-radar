"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, ExternalLink, Link2, MessageSquareQuote, ShieldCheck, Star, UserRoundCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import type { CommunityReview, Kol } from "@/lib/types"

interface RealReviewPanelProps {
  productId: string
  productName: string
  initialReviews: CommunityReview[]
  kols: Kol[]
}

const SKIN_TYPES = ["Da dầu", "Da khô", "Da hỗn hợp", "Da nhạy cảm", "Da treatment", "Không áp dụng"]
const USAGE_DURATIONS = ["Dưới 1 tuần", "1-2 tuần", "3-4 tuần", "1-3 tháng", "Trên 3 tháng", "Dùng thử / swatch"]
const PURCHASE_SOURCES = ["Shopee", "TikTok Shop", "Lazada", "Watsons/Guardian", "Store chính hãng", "Được tặng/PR", "Khác"]
const REVIEWER_RELATIONS = [
  { value: "", label: "Không chọn reviewer" },
  { value: "influenced_by", label: "Tôi mua vì reviewer này" },
  { value: "compare_with", label: "Tôi muốn đối chiếu với reviewer này" },
  { value: "disagree_with", label: "Trải nghiệm của tôi khác reviewer này" },
]

export function RealReviewPanel({ productId, productName, initialReviews, kols }: RealReviewPanelProps) {
  const { user, loading: authLoading } = useAuth()
  const [reviews, setReviews] = React.useState(initialReviews)
  const [rating, setRating] = React.useState(0)
  const [hovered, setHovered] = React.useState(0)
  const [review, setReview] = React.useState("")
  const [reviewerAlias, setReviewerAlias] = React.useState("")
  const [skinType, setSkinType] = React.useState("")
  const [usageDuration, setUsageDuration] = React.useState("")
  const [purchaseSource, setPurchaseSource] = React.useState("")
  const [wouldRepurchase, setWouldRepurchase] = React.useState("")
  const [proofUrl, setProofUrl] = React.useState("")
  const [linkedKolId, setLinkedKolId] = React.useState("")
  const [reviewerRelation, setReviewerRelation] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const kolMap = React.useMemo(() => Object.fromEntries(kols.map((kol) => [kol.id, kol])), [kols])
  const connectedReviews = reviews.filter((item) => item.linked_kol_id)

  React.useEffect(() => {
    setReviews(initialReviews)
  }, [initialReviews])

  React.useEffect(() => {
    if (!user || !isSupabaseSchemaReady) return

    let alive = true
    supabase
      .from("user_ratings")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return
        const existing = data as CommunityReview
        setRating(existing.rating)
        setReview(existing.review ?? "")
        setReviewerAlias(existing.reviewer_alias ?? "")
        setSkinType(existing.skin_type ?? "")
        setUsageDuration(existing.usage_duration ?? "")
        setPurchaseSource(existing.purchase_source ?? "")
        setWouldRepurchase(existing.would_repurchase === null ? "" : existing.would_repurchase ? "yes" : "no")
        setProofUrl(existing.proof_url ?? "")
        setLinkedKolId(existing.linked_kol_id ?? "")
        setReviewerRelation(existing.reviewer_relation ?? "")
        setStatusMessage(existing.status === "approved" ? "Review của bạn đã được duyệt." : "Review của bạn đang chờ duyệt.")
      })

    return () => {
      alive = false
    }
  }, [productId, user])

  async function handleSubmit() {
    if (!user || rating === 0 || review.trim().length < 40 || submitting) return
    setSubmitting(true)
    setError(null)
    setStatusMessage(null)

    if (!isSupabaseSchemaReady) {
      setStatusMessage("Đã nhận review ở chế độ demo. Khi Supabase bật schema, review sẽ được lưu để duyệt.")
      setSubmitting(false)
      return
    }

    const payload = {
      user_id: user.id,
      product_id: productId,
      rating,
      review: review.trim(),
      status: "pending",
      reviewer_alias: reviewerAlias.trim() || user.email?.split("@")[0] || "Người dùng 360dep.vn",
      skin_type: skinType || null,
      usage_duration: usageDuration || null,
      purchase_source: purchaseSource || null,
      would_repurchase: wouldRepurchase ? wouldRepurchase === "yes" : null,
      proof_url: proofUrl.trim() || null,
      linked_kol_id: linkedKolId || null,
      reviewer_relation: linkedKolId ? reviewerRelation || "compare_with" : null,
      updated_at: new Date().toISOString(),
    }

    const { error: submitError } = await supabase.from("user_ratings").upsert(payload, { onConflict: "user_id,product_id" })

    if (submitError) {
      setError(submitError.message)
    } else {
      setStatusMessage("Đã gửi review thật. Review sẽ public sau khi admin duyệt để chống spam/fake review.")
    }
    setSubmitting(false)
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <UserRoundCheck className="h-5 w-5 text-emerald-500" />
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">Review thật từ người dùng</h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Thu review có loại da, thời gian dùng, nguồn mua và reviewer/KOL liên quan để đối chiếu với nội dung KOL/KOC.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2 text-center dark:bg-slate-950">
          <Metric label="Đã duyệt" value={reviews.length} />
          <Metric label="Có kết nối" value={connectedReviews.length} />
          <Metric label="Reviewer" value={new Set(reviews.map((item) => item.reviewer_alias || item.user_id)).size} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((item) => <CommunityReviewCard key={item.id} review={item} linkedKol={item.linked_kol_id ? kolMap[item.linked_kol_id] : undefined} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
              <MessageSquareQuote className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Chưa có review cộng đồng đã duyệt.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review đầu tiên có ngữ cảnh tốt sẽ giúp sản phẩm này đáng tin hơn.</p>
            </div>
          )}
        </div>

        <Card className="border-slate-100 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">Gửi review thật</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Review càng có ngữ cảnh càng dễ được duyệt và dùng để đối chiếu với reviewer.
              </p>
            </div>

            {authLoading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
            ) : !user ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <Link href="/auth/login" className="font-bold text-rose-600 underline underline-offset-4 dark:text-rose-300">
                    Đăng nhập
                  </Link>{" "}
                  để gửi review thật cho {productName}.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Điểm số</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1
                      const filled = value <= (hovered || rating)
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          onMouseEnter={() => setHovered(value)}
                          onMouseLeave={() => setHovered(0)}
                          className="rounded-lg p-1 transition-transform hover:scale-110"
                          aria-label={`${value} sao`}
                        >
                          <Star className={cn("h-6 w-6", filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700")} />
                        </button>
                      )
                    })}
                    {rating > 0 && <span className="ml-2 text-sm font-bold text-slate-500">{rating}/5</span>}
                  </div>
                </div>

                <Textarea
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                  placeholder="Bạn dùng bao lâu, loại da/tóc/body của bạn là gì, điểm tốt/xấu thực tế ra sao?"
                  className="min-h-[120px] resize-none rounded-xl border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-900"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={reviewerAlias} onChange={(event) => setReviewerAlias(event.target.value)} placeholder="Tên hiển thị" className="rounded-xl bg-white dark:bg-slate-900" />
                  <Select value={skinType} onChange={(event) => setSkinType(event.target.value)} className="rounded-xl bg-white dark:bg-slate-900">
                    <option value="">Loại da/tóc/body</option>
                    {SKIN_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                  <Select value={usageDuration} onChange={(event) => setUsageDuration(event.target.value)} className="rounded-xl bg-white dark:bg-slate-900">
                    <option value="">Thời gian dùng</option>
                    {USAGE_DURATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                  <Select value={purchaseSource} onChange={(event) => setPurchaseSource(event.target.value)} className="rounded-xl bg-white dark:bg-slate-900">
                    <option value="">Nguồn mua</option>
                    {PURCHASE_SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                  <Select value={wouldRepurchase} onChange={(event) => setWouldRepurchase(event.target.value)} className="rounded-xl bg-white dark:bg-slate-900">
                    <option value="">Có mua lại?</option>
                    <option value="yes">Có</option>
                    <option value="no">Không chắc / không</option>
                  </Select>
                  <Input value={proofUrl} onChange={(event) => setProofUrl(event.target.value)} placeholder="Link bằng chứng nếu có" className="rounded-xl bg-white dark:bg-slate-900" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Link2 className="h-3.5 w-3.5" />
                    Connect với reviewer/KOL
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={linkedKolId} onChange={(event) => setLinkedKolId(event.target.value)} className="rounded-xl">
                      <option value="">Chọn reviewer/KOL liên quan</option>
                      {kols.slice(0, 80).map((kol) => <option key={kol.id} value={kol.id}>{kol.name}</option>)}
                    </Select>
                    <Select value={reviewerRelation} onChange={(event) => setReviewerRelation(event.target.value)} className="rounded-xl" disabled={!linkedKolId}>
                      {REVIEWER_RELATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || review.trim().length < 40 || submitting}
                  className="h-12 w-full rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                >
                  {submitting ? "Đang gửi..." : "Gửi review để duyệt"}
                </Button>

                {review.trim().length > 0 && review.trim().length < 40 && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-300">Review cần ít nhất 40 ký tự để đủ ngữ cảnh.</p>
                )}
                {statusMessage && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">{statusMessage}</p>}
                {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[72px] rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
      <div className="font-display text-xl font-black text-slate-900 dark:text-slate-50">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  )
}

function CommunityReviewCard({ review, linkedKol }: { review: CommunityReview; linkedKol?: Kol }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-bold text-slate-900 dark:text-slate-50">{review.reviewer_alias || "Người dùng 360dep.vn"}</div>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Đã duyệt
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className={cn("h-3.5 w-3.5", index < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700")} />
            ))}
            <span className="ml-2 text-xs font-medium text-slate-400">{new Date(review.created_at).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {review.skin_type && <Badge variant="secondary">{review.skin_type}</Badge>}
          {review.usage_duration && <Badge variant="secondary">{review.usage_duration}</Badge>}
          {review.purchase_source && <Badge variant="secondary">{review.purchase_source}</Badge>}
          {review.would_repurchase !== null && (
            <Badge variant="secondary" className={review.would_repurchase ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"}>
              {review.would_repurchase ? "Sẽ mua lại" : "Không chắc mua lại"}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">&quot;{review.review}&quot;</p>

      {(linkedKol || review.proof_url) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 text-xs font-bold dark:border-slate-800">
          {linkedKol && (
            <Link href={`/koc-tracker/${linkedKol.id}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-slate-700 transition-colors hover:text-rose-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-rose-300">
              <Avatar className="h-5 w-5">
                <AvatarImage src={linkedKol.avatar} />
                <AvatarFallback>{linkedKol.name[0]}</AvatarFallback>
              </Avatar>
              Kết nối: {linkedKol.name}
            </Link>
          )}
          {review.proof_url && (
            <a href={review.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-300">
              Bằng chứng <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <span className="inline-flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="h-3 w-3" />
            {review.reviewer_relation ? relationLabel(review.reviewer_relation) : "Review có ngữ cảnh"}
          </span>
        </div>
      )}
    </div>
  )
}

function relationLabel(value: string) {
  if (value === "influenced_by") return "Mua vì reviewer"
  if (value === "disagree_with") return "Trải nghiệm khác reviewer"
  return "Đối chiếu với reviewer"
}
