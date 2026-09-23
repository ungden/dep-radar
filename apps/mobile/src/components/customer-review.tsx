import * as React from "react"
import { TextInput, View } from "react-native"
import { BLIND_NOTE, reviewWindow } from "@/shared"
import { reviewCustomer, type BookingItem } from "@/data/bookings"
import { colors, fonts, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Txt } from "@/ui/text"
import { STAR_WORDS, StarPicker } from "./stars"

const MIN_REASON = 10

/**
 * The freelancer's review of the customer, on a completed booking: within 14
 * days, once, blind until the customer's review is in (or the 14 days end).
 * Two stars or fewer needs a reason other freelancers can read.
 */
export function CustomerReviewCard({ booking: b, now, onDone }: { booking: BookingItem; now: number; onDone: () => void }) {
  const [rating, setRating] = React.useState(0)
  const [body, setBody] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const win = reviewWindow(b.completedAt, new Date(now))

  if (b.customerReview) {
    const r = b.customerReview
    return (
      <Card>
        <Txt w={700}>Bạn đã đánh giá {b.customer.name}</Txt>
        <Txt color={colors.accent} accessibilityLabel={`${r.rating} sao`}>
          {"★".repeat(r.rating)}
          <Txt color={colors.subtleStrong}>{"★".repeat(Math.max(0, 5 - r.rating))}</Txt>
        </Txt>
        {r.body ? <Txt color={colors.inkSoft}>{r.body}</Txt> : null}
        <Txt v="meta" color={colors.muted}>
          {r.publishedAt ? "Đánh giá đã hiện với khách." : BLIND_NOTE}
        </Txt>
      </Card>
    )
  }
  if (!win.open) {
    return (
      <Txt v="meta" color={colors.muted} center>
        Đã quá 14 ngày kể từ khi hoàn thành, không đánh giá khách được nữa.
      </Txt>
    )
  }

  const needsReason = rating > 0 && rating <= 2
  const valid = rating > 0 && (!needsReason || body.trim().length >= MIN_REASON)
  const submit = async () => {
    setBusy(true)
    setError(null)
    const res = await reviewCustomer(b.id, rating, body.trim())
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    onDone()
  }

  return (
    <Card>
      <Txt w={700}>Đánh giá {b.customer.name}</Txt>
      <Txt v="meta" color={colors.inkSoft}>
        Còn {win.daysLeft} ngày. {BLIND_NOTE}
      </Txt>
      <View style={{ alignItems: "center", gap: 4, paddingVertical: 4 }}>
        <StarPicker value={rating} onChange={setRating} size={30} />
        <Txt v="meta" color={colors.inkSoft}>
          {STAR_WORDS[rating] || "Chạm để chấm sao"}
        </Txt>
      </View>
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={1000}
        placeholder={needsReason ? "Chuyện gì đã xảy ra? Người làm khác sẽ đọc được." : "Nhận xét về khách (không bắt buộc)"}
        placeholderTextColor={colors.muted}
        accessibilityLabel="Nhận xét về khách"
        style={{ minHeight: 80, backgroundColor: colors.subtle, borderRadius: radius.md, padding: 12, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
      />
      {needsReason && body.trim().length < MIN_REASON ? (
        <Txt v="meta" color={colors.warning}>
          Từ 2 sao trở xuống, cho người làm khác biết lý do (còn {MIN_REASON - body.trim().length} ký tự).
        </Txt>
      ) : null}
      {error ? <ErrorNote text={error} /> : null}
      <Button label="Gửi đánh giá" full disabled={!valid} busy={busy} onPress={() => void submit()} />
    </Card>
  )
}
