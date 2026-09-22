import * as React from "react"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { FlashList } from "@shopify/flash-list"
import { Alert, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { getTemplate, getVariant, isPriceAllowed, travelDistanceKm } from "@/shared"
import { sendOffer, withdrawMyOfferOn } from "@/data/actions"
import { formatDateLong, formatKm, formatPrice } from "@/data/format"
import { listJobs, type JobItem } from "@/data/jobs"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, Chip, EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

type Scope = "match" | "all" | "offered"

/** Customers' requests for quotes. Same board, same RPCs (send_offer / withdraw_offer) as the web. */
export default function NewJobs() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const pro = app.myPro
  const uid = app.uid
  const jobs = useAsync(uid ? () => listJobs(uid) : null, [uid])
  const [scope, setScope] = React.useState<Scope>("match")
  const sheet = useSheet()
  const [quoting, setQuoting] = React.useState<JobItem | null>(null)
  const [price, setPrice] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  if (!pro || !uid) return null
  const listed = (j: JobItem) => app.data?.services.find((s) => s.proId === pro.id && s.templateId === j.templateId && s.active)?.prices[j.variantId] ?? null
  const kmTo = (j: JobItem) => travelDistanceKm(pro.city, pro.district, j.city, j.district)

  const list = (jobs.value ?? [])
    .filter((j) => !j.mine)
    .filter((j) => {
      if (scope === "offered") return Boolean(j.myOffer)
      if (j.status !== "open") return false
      if (scope === "match") {
        const km = kmTo(j)
        const category = getTemplate(j.templateId)?.category
        return Boolean(category && pro.categories.includes(category)) && km !== null && km <= pro.maxTravelKm
      }
      return true
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const openQuote = (j: JobItem) => {
    // A quote may not undercut the freelancer's own listed price (send_offer checks it too).
    const floor = listed(j) ?? 0
    const suggested = getVariant(j.templateId, j.variantId)?.suggestedPrice ?? 0
    setQuoting(j)
    setPrice(String(Math.max(floor, suggested) / 1000))
    setMessage("")
    sheet.open()
  }

  const submit = async () => {
    if (!quoting) return
    const value = Math.round(Number(price.replace(/[^\d]/g, "")) * 1000)
    const variant = getVariant(quoting.templateId, quoting.variantId)
    const floor = Math.max(listed(quoting) ?? 0, variant?.minPrice ?? 0)
    if (!value || (variant && (!isPriceAllowed(variant, value) || value < floor))) {
      return Alert.alert(
        "Giá chưa hợp lệ",
        variant ? `Giá cho gói này từ ${formatPrice(floor)} đến ${formatPrice(variant.maxPrice)}, làm tròn 5.000đ.` : "Nhập giá bằng nghìn đồng.",
      )
    }
    setBusy(true)
    const res = await sendOffer(quoting.id, value, message.trim())
    setBusy(false)
    if (!res.ok) return Alert.alert("Chưa gửi được báo giá", res.error)
    sheet.close()
    void jobs.reload()
  }

  const withdraw = async (j: JobItem) => {
    const res = await withdrawMyOfferOn(uid, j.id)
    if (!res.ok) return Alert.alert("Chưa rút được", res.error)
    void jobs.reload()
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <StudioHeader title="Việc mới" />
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: gutter, paddingBottom: 12 }}>
        <Chip label={`Phù hợp (≤ ${pro.maxTravelKm} km)`} selected={scope === "match"} onPress={() => setScope("match")} />
        <Chip label="Tất cả" selected={scope === "all"} onPress={() => setScope("all")} />
        <Chip label="Đã báo giá" selected={scope === "offered"} onPress={() => setScope("offered")} />
      </View>
      {!pro.acceptingJobs ? (
        <Txt v="meta" color={colors.warning} style={{ paddingHorizontal: gutter, paddingBottom: 8 }}>
          Bạn đang tạm nghỉ nhận lịch. Bật lại ở tab Tôi để gửi báo giá.
        </Txt>
      ) : null}
      <FlashList
        data={list}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
        refreshing={jobs.refreshing}
        onRefresh={() => void jobs.refresh()}
        renderItem={({ item: j }) => {
          const t = getTemplate(j.templateId)
          const v = getVariant(j.templateId, j.variantId)
          const km = kmTo(j)
          const mine = listed(j)
          const canOffer = mine !== null && km !== null && km <= pro.maxTravelKm && pro.acceptingJobs
          return (
            <Card style={{ marginBottom: 12 }}>
              <Txt w={700}>
                {t?.name ?? j.templateId}
                {v ? ` · ${v.label}` : ""}
                {j.quantity > 1 ? ` × ${j.quantity}` : ""}
              </Txt>
              <Txt v="meta" color={colors.inkSoft}>
                {j.time}, {formatDateLong(j.date)} · {j.district}, {j.city}
                {km !== null ? ` · cách ${formatKm(km)}` : ""}
              </Txt>
              {j.description ? <Txt color={colors.inkSoft}>{j.description}</Txt> : null}
              <Txt v="meta" color={colors.muted}>
                {j.customerName} · {j.atHome ? "làm tại nhà khách" : "làm tại studio"} · {j.offerCount ? `${j.offerCount} báo giá` : "chưa có báo giá"}
              </Txt>
              {j.myOffer ? (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, backgroundColor: colors.subtle, borderRadius: radius.sm, padding: 10 }}>
                  <Txt w={600}>Bạn đã báo {formatPrice(j.myOffer.price)}</Txt>
                  {j.myOffer.status === "pending" && j.status === "open" ? <Button label="Rút" size="sm" variant="secondary" onPress={() => void withdraw(j)} /> : null}
                </View>
              ) : j.status === "open" ? (
                canOffer ? (
                  <Button label="Báo giá" size="sm" onPress={() => openQuote(j)} />
                ) : (
                  <Txt v="meta" color={colors.muted}>
                    {mine === null ? "Bạn chưa đặt giá cho gói này nên chưa báo giá được." : km === null || km > pro.maxTravelKm ? "Ngoài phạm vi bạn đi." : "Bật nhận lịch để báo giá."}
                  </Txt>
                )
              ) : null}
            </Card>
          )
        }}
        ListHeaderComponent={jobs.error ? <ErrorNote text={jobs.error} onRetry={() => void jobs.reload()} /> : null}
        ListEmptyComponent={
          jobs.loading ? (
            <View style={{ gap: 12 }}>
              {[0, 1].map((i) => (
                <Skeleton key={i} style={{ height: 130, borderRadius: radius.md }} />
              ))}
            </View>
          ) : jobs.error ? null : (
            <EmptyState
              title={scope === "offered" ? "Bạn chưa báo giá yêu cầu nào" : "Chưa có yêu cầu mới"}
              text={scope === "match" ? "Không có yêu cầu nào đúng nghề và trong phạm vi bạn đi." : undefined}
              action={scope === "match" ? "Xem tất cả" : undefined}
              onAction={() => setScope("all")}
            />
          )
        }
      />

      <Sheet
        sheet={sheet}
        title="Báo giá"
        footer={<Button label="Gửi báo giá" full busy={busy} disabled={!price} onPress={() => void submit()} />}
      >
        {quoting ? (
          <Txt color={colors.inkSoft}>
            {getTemplate(quoting.templateId)?.name} · {quoting.time}, {formatDateLong(quoting.date)}
          </Txt>
        ) : null}
        <View style={{ gap: 6 }}>
          <Txt w={700}>
            Giá cho gói, nghìn đồng{quoting && getVariant(quoting.templateId, quoting.variantId)?.perPerson ? " (mỗi người)" : ""}
          </Txt>
          <BottomSheetTextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
            placeholder="350"
            placeholderTextColor={colors.muted}
            style={{ height: 50, backgroundColor: colors.subtle, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts[700], fontSize: 17, color: colors.ink }}
          />
          {price ? (
            <Txt v="meta" color={colors.muted}>
              = {formatPrice(Math.round(Number(price.replace(/[^\d]/g, "")) * 1000))}
            </Txt>
          ) : null}
        </View>
        <View style={{ gap: 6 }}>
          <Txt w={700}>Lời nhắn cho khách</Txt>
          <BottomSheetTextInput
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            placeholder="Mình làm được giờ này, mang đủ dụng cụ…"
            placeholderTextColor={colors.muted}
            style={{ minHeight: 80, backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
          />
        </View>
      </Sheet>
    </View>
  )
}
