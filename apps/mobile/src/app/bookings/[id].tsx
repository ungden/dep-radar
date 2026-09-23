import * as React from "react"
import { router, useLocalSearchParams } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { Alert, Linking, Platform, ScrollView, View } from "react-native"
import { POLICY, verticalOf } from "@/shared"
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  declineBooking,
  getBooking,
  startBooking,
  type BookingItem,
} from "@/data/bookings"
import { openThread } from "@/data/chat"
import { formatCountdown, formatDateLong, formatDuration, formatPhone, formatPrice, localDate } from "@/data/format"
import { webLink } from "@/data/links"
import type { Result } from "@/data/supabase"
import { StatusPill } from "@/components/booking-row"
import { Timeline, type TimelineStep } from "@/components/timeline"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Avatar, Card, EmptyState, ErrorNote, Line, Skeleton } from "@/ui/bits"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

function stepsFor(b: BookingItem): TimelineStep[] {
  const steps: TimelineStep[] = [
    { label: "Đã gửi lịch", at: b.createdAt },
    { label: "Đã gọi xác nhận, nhận lịch", at: b.confirmedAt },
    { label: "Bắt đầu làm", at: b.startedAt },
    { label: verticalOf(b.category) === "photo" ? "Xong buổi chụp" : "Hoàn thành", at: b.completedAt },
  ]
  if (b.delivery) {
    steps.push({
      label: "Đã giao ảnh / clip",
      at: b.delivery.deliveredAt,
      detail: !b.delivery.deliveredAt && b.delivery.dueAt ? `Hạn giao: ${formatDateLong(localDate(b.delivery.dueAt))}` : undefined,
    })
    if (b.delivery.deliveredAt) steps.push({ label: "Khách đã nhận file", at: b.delivery.acceptedAt })
  }
  const stopped: Partial<Record<BookingItem["status"], string>> = {
    cancelled: b.cancelledBy === "pro" ? "Người làm đã huỷ" : "Đã huỷ",
    declined: "Người làm từ chối",
    expired: "Hết hạn xác nhận, lịch tự huỷ",
    no_show: "Báo vắng mặt",
  }
  const stop = stopped[b.status]
  if (stop) {
    const done = steps.filter((s) => s.at)
    return [...done, { label: stop, at: b.cancelledAt ?? b.confirmBy, detail: b.cancelReason ?? undefined, stop: true }]
  }
  return steps
}

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const booking = useAsync(app.uid ? () => getBooking(id, app.uid!) : null, [id, app.uid])
  const reasonSheet = useSheet()
  const [reasonFor, setReasonFor] = React.useState<"cancel" | "decline">("cancel")
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState<string | null>(null)
  const [now, setNow] = React.useState(Date.now())

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!app.uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />
  const b = booking.value
  if (booking.loading && !b)
    return (
      <View style={{ padding: gutter, gap: 12 }}>
        <Skeleton style={{ height: 28, width: "70%" }} />
        <Skeleton style={{ height: 160 }} />
        <Skeleton style={{ height: 120 }} />
      </View>
    )
  if (booking.error) return <View style={{ padding: gutter }}><ErrorNote text={booking.error} onRetry={() => void booking.reload()} /></View>
  if (!b) return <EmptyState title="Không tìm thấy lịch hẹn" />

  const iAmPro = b.pro.id === app.uid
  const run = async (key: string, task: () => Promise<Result<unknown>>, done: string) => {
    setBusy(key)
    const res = await task()
    setBusy(null)
    if (!res.ok) return Alert.alert("Chưa thực hiện được", res.error)
    Alert.alert(done)
    void booking.reload()
  }
  const call = (phone: string) => void Linking.openURL(`tel:${phone}`)
  const message = async () => {
    setBusy("chat")
    const res = await openThread(b.pro.id, b.id)
    setBusy(null)
    if (res.ok) router.push({ pathname: "/tin-nhan/[id]", params: { id: res.data } })
    else Alert.alert("Chưa mở được hội thoại", res.error)
  }
  const place = b.atHome ? [b.address, b.district, b.city].filter(Boolean).join(", ") : "Tại studio"
  const directions = () => {
    const q = encodeURIComponent([b.address, b.district, b.city].filter(Boolean).join(", "))
    void Linking.openURL(Platform.OS === "ios" ? `http://maps.apple.com/?daddr=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${q}`)
  }
  const confirmLeft = Date.parse(b.confirmBy) - now
  const hoursToStart = (Date.parse(b.startsAt) - now) / 3_600_000
  const canCancel = ["pending", "confirmed"].includes(b.status)
  const phone = iAmPro ? b.customer.phone : b.pro.phone
  const other = iAmPro ? b.customer.name : b.pro.name

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 48 }}>
      <View style={{ gap: 6 }}>
        <StatusPill status={b.status} />
        <Txt v="h2">{b.serviceName}</Txt>
        <Txt color={colors.inkSoft}>
          {b.variantLabel}
          {b.quantity > 1 ? ` × ${b.quantity} người` : ""} · {formatDuration(b.durationMin)}
        </Txt>
        <Txt v="lead" w={700}>
          {b.time} · {formatDateLong(b.date)}
        </Txt>
      </View>

      {b.status === "pending" ? (
        <Card style={{ backgroundColor: colors.warningSoft }}>
          <Txt w={700} color={colors.warning}>
            {confirmLeft > 0 ? `Còn ${formatCountdown(confirmLeft)} để xác nhận` : "Đã quá hạn xác nhận"}
          </Txt>
          <Txt v="meta" color={colors.warning}>
            {iAmPro
              ? "Gọi cho khách để chốt chi tiết rồi bấm nhận lịch. Quá hạn, lịch tự huỷ."
              : `${b.pro.name} sẽ gọi cho bạn trước khi nhận lịch. Quá ${POLICY.confirmWithinHours} giờ không xác nhận, lịch tự huỷ.`}
          </Txt>
        </Card>
      ) : null}

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={other} uri={iAmPro ? undefined : b.pro.avatar} size={44} />
          <View style={{ flex: 1 }}>
            <Txt w={700}>{other}</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              {phone ? formatPhone(phone) : iAmPro ? "Chưa có số" : "Số hiện khi người làm đã nhận lịch"}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {phone ? <Button label="Gọi" icon="phone" size="sm" onPress={() => call(phone)} /> : null}
          {!iAmPro ? <Button label="Nhắn tin" icon="chat" size="sm" variant="secondary" busy={busy === "chat"} onPress={() => void message()} /> : null}
          {iAmPro && b.atHome ? <Button label="Chỉ đường" icon="directions" size="sm" variant="secondary" onPress={directions} /> : null}
        </View>
      </Card>

      <Card>
        <Txt w={700}>Ở đâu</Txt>
        <Txt color={colors.inkSoft}>{place}</Txt>
        {b.addressNote ? <Txt v="meta" color={colors.muted}>{b.addressNote}</Txt> : null}
        {b.note ? (
          <>
            <Txt w={700} style={{ marginTop: 6 }}>
              Ghi chú
            </Txt>
            <Txt color={colors.inkSoft}>{b.note}</Txt>
          </>
        ) : null}
      </Card>

      <Card>
        <Line label="Dịch vụ" value={formatPrice(b.quote.servicePrice)} />
        {b.quote.travelFee ? <Line label="Phí di chuyển" value={formatPrice(b.quote.travelFee)} /> : null}
        {b.quote.urgentFee ? <Line label="Phí gấp" value={formatPrice(b.quote.urgentFee)} /> : null}
        <Line label={b.paymentMethod === "cash" ? "Khách trả sau khi làm xong" : "Khách đã trả qua 360dep"} value={formatPrice(b.quote.total)} strong />
        {iAmPro ? (
          <>
            <Line label={`Hoa hồng ${Math.round(b.quote.commissionRate * 100)}%`} value={`−${formatPrice(b.quote.commission)}`} />
            <Line label="Bạn nhận" value={formatPrice(b.quote.payout)} strong />
          </>
        ) : null}
      </Card>

      <Card>
        <Txt w={700} style={{ marginBottom: 6 }}>
          Tiến trình
        </Txt>
        <Timeline steps={stepsFor(b)} />
        {b.delivery?.url ? <Button label="Mở link file" variant="secondary" size="sm" icon="external" onPress={() => void Linking.openURL(b.delivery!.url!)} /> : null}
      </Card>

      {/* Actions */}
      <View style={{ gap: 10 }}>
        {iAmPro && b.status === "pending" ? (
          <>
            <Button label="Đã gọi khách, nhận lịch" full busy={busy === "confirm"} onPress={() => void run("confirm", () => confirmBooking(b.id), "Đã nhận lịch")} />
            <Button
              label="Từ chối"
              variant="danger"
              full
              onPress={() => {
                setReasonFor("decline")
                setReason("")
                reasonSheet.open()
              }}
            />
          </>
        ) : null}
        {iAmPro && b.status === "confirmed" && hoursToStart < 1 ? (
          <Button label="Bắt đầu làm" full busy={busy === "start"} onPress={() => void run("start", () => startBooking(b.id), "Đã bắt đầu")} />
        ) : null}
        {iAmPro && b.status === "in_progress" ? (
          <Button label="Hoàn thành" full busy={busy === "complete"} onPress={() => void run("complete", () => completeBooking(b.id), "Đã hoàn thành")} />
        ) : null}
        {!iAmPro && b.status === "completed" && !b.reviewed ? (
          <Button label="Viết đánh giá trên web" variant="secondary" icon="external" full onPress={() => void WebBrowser.openBrowserAsync(webLink(`/bookings/${b.id}/review`))} />
        ) : null}
        {canCancel ? (
          <Button
            label={iAmPro ? "Huỷ lịch đã nhận" : "Huỷ lịch"}
            variant="danger"
            full
            onPress={() => {
              setReasonFor("cancel")
              setReason("")
              reasonSheet.open()
            }}
          />
        ) : null}
        {canCancel && !iAmPro ? (
          <Txt v="meta" color={colors.muted} center>
            {hoursToStart >= POLICY.freeCancelHours
              ? `Huỷ miễn phí trước giờ hẹn ${POLICY.freeCancelHours} tiếng.`
              : "Đã quá hạn huỷ miễn phí. Huỷ muộn nhiều lần có thể bị tạm khoá hình thức trả sau."}
          </Txt>
        ) : null}
      </View>

      <Sheet
        sheet={reasonSheet}
        title={reasonFor === "decline" ? "Từ chối lịch này" : "Huỷ lịch hẹn"}
        footer={
          <Button
            label={reasonFor === "decline" ? "Xác nhận từ chối" : "Xác nhận huỷ"}
            variant="danger"
            full
            busy={busy === "reason"}
            disabled={!reason.trim()}
            onPress={async () => {
              reasonSheet.close()
              await run(
                "reason",
                () => (reasonFor === "decline" ? declineBooking(b.id, reason.trim()) : cancelBooking(b.id, reason.trim())),
                reasonFor === "decline" ? "Đã từ chối lịch" : "Đã huỷ lịch hẹn",
              )
            }}
          />
        }
      >
        <Txt color={colors.inkSoft}>
          {iAmPro ? `Lý do sẽ gửi cho ${b.customer.name}. Huỷ nhiều ảnh hưởng tới thứ hạng hiển thị của bạn.` : `Lý do sẽ gửi cho ${b.pro.name}.`}
        </Txt>
        <BottomSheetTextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Lý do"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={300}
          style={{ minHeight: 88, backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
        />
      </Sheet>
    </ScrollView>
  )
}
