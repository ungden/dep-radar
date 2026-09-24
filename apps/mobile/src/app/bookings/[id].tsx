import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { Alert, Linking, Platform, ScrollView, View } from "react-native"
import { BLIND_NOTE, POLICY, bookingChatOpen, customerJobActions, reviewWindow, verticalOf } from "@/shared"
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  confirmBookingDone,
  declineBooking,
  disputeNoShow,
  getBooking,
  hasDisputedNoShow,
  reportProNoShow,
  startBooking,
  type BookingItem,
} from "@/data/bookings"
import { openThread } from "@/data/chat"
import { formatCountdown, formatDateLong, formatDuration, formatPhone, formatPrice, localDate, localTime } from "@/data/format"
import type { Result } from "@/data/supabase"
import { VoucherCard } from "@/components/booking-voucher"
import { FeeCard, OWING_NOTE, useFee } from "@/components/fee-card"
import { StatusPill } from "@/components/booking-row"
import { CustomerReviewCard } from "@/components/customer-review"
import { useSafetyMenu } from "@/components/safety"
import { Timeline, type TimelineStep } from "@/components/timeline"
import { useApp } from "@/state/app"
import { useNow } from "@/state/keyboard"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Avatar, Card, EmptyState, ErrorNote, Line, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

function stepsFor(b: BookingItem): TimelineStep[] {
  const steps: TimelineStep[] = [
    { label: "Đã gửi lịch", at: b.createdAt },
    { label: "Người làm nhận lịch", at: b.confirmedAt },
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
  const [reasonFor, setReasonFor] = React.useState<"cancel" | "decline" | "noshow" | "dispute">("cancel")
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState<string | null>(null)
  const bv = booking.value
  const customerView = Boolean(bv && app.uid && bv.customer.id === app.uid && bv.pro.id !== app.uid)
  // Ticks while the confirmation countdown is on screen, or while a customer's
  // buttons for finishing the job may appear by the clock.
  const startsSoon = Boolean(bv && Date.parse(bv.startsAt) - Date.now() < 3_600_000)
  // Ticks near the start for both sides: the customer's actions and the
  // freelancer's "Hoàn thành" both open at the start time.
  const now = useNow(bv?.status === "pending" || (startsSoon && (bv?.status === "confirmed" || bv?.status === "in_progress")))
  const noShowOpen = Boolean(customerView && bv?.status === "no_show" && bv.cancelledAt && now <= Date.parse(bv.cancelledAt) + 24 * 3_600_000)
  const disputed = useAsync(noShowOpen && bv && app.uid ? () => hasDisputedNoShow(bv.id, app.uid!) : null, [noShowOpen, bv?.id, app.uid])
  // A freelancer who owes the last job's fee cannot accept this one (confirm_booking refuses).
  const fee = useFee(app.uid, Boolean(bv && bv.status === "pending" && bv.pro.id === app.uid))
  const safety = useSafetyMenu(
    bv && app.uid
      ? {
          accountId: bv.pro.id === app.uid ? bv.customer.id : bv.pro.id,
          name: bv.pro.id === app.uid ? bv.customer.name : bv.pro.name,
          bookingId: bv.id,
        }
      : null,
  )

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
    if (!res.ok) {
      haptic.error()
      return Alert.alert("Chưa thực hiện được", res.error)
    }
    haptic.success()
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
  const active = bookingChatOpen(b.status)
  // Each side's number only while the job is live (data/bookings.ts reads it that way too).
  const phone = active ? (iAmPro ? b.customer.phone : b.pro.phone) : null
  const other = iAmPro ? b.customer.name : b.pro.name
  const phoneNote =
    b.status === "pending" ? (iAmPro ? "Số hiện khi bạn nhận lịch" : "Số hiện khi người làm nhận lịch") : active ? "Chưa có số" : "Lịch hẹn đã kết thúc"
  const job = customerJobActions({ status: b.status, startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt) }, new Date(now))
  const at = (d: Date | string) => `${localTime(d)} ${formatDateLong(localDate(d))}`
  const review = reviewWindow(b.completedAt, new Date(now))
  const voucherOpen = !iAmPro && ["pending", "confirmed"].includes(b.status) && Date.parse(b.startsAt) > now
  const confirmDone = () =>
    Alert.alert("Xác nhận đã xong?", `Lịch hẹn với ${b.pro.name} sẽ chuyển sang hoàn thành, và bạn đánh giá được trong 14 ngày.`, [
      { text: "Chưa", style: "cancel" },
      { text: "Đã xong", onPress: () => void run("done", () => confirmBookingDone(b.id), "Đã xác nhận hoàn thành") },
    ])
  const openSheet = (mode: typeof reasonFor) => {
    setReasonFor(mode)
    setReason("")
    reasonSheet.open()
  }
  const SHEET: Record<typeof reasonFor, { title: string; action: string; done: string; placeholder: string; min: number }> = {
    cancel: { title: "Huỷ lịch hẹn", action: "Xác nhận huỷ", done: "Đã huỷ lịch hẹn", placeholder: "Lý do", min: 1 },
    decline: { title: "Từ chối lịch này", action: "Xác nhận từ chối", done: "Đã từ chối lịch", placeholder: "Lý do", min: 1 },
    noshow: {
      title: "Người làm không đến",
      action: "Báo người làm không đến",
      done: "Đã báo 360dep. Lịch hẹn đã huỷ.",
      placeholder: "Bạn đã chờ tới mấy giờ, có gọi được người làm không… (không bắt buộc)",
      min: 0,
    },
    dispute: { title: "Khiếu nại báo vắng mặt", action: "Gửi khiếu nại", done: "Đã gửi khiếu nại. 360dep sẽ xem xét.", placeholder: "Chuyện gì đã xảy ra?", min: 10 },
  }
  const sheet = SHEET[reasonFor]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 48 }}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerRight: () => <IconButton name="more" label="Báo cáo hoặc chặn" onPress={safety.open} /> }} />
      {safety.element}
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
              ? "Xem giờ, địa chỉ rồi bấm nhận lịch. Nhận xong, bạn và khách nhắn tin, gọi được cho nhau. Quá hạn, lịch tự huỷ."
              : `${b.pro.name} sẽ xem và nhận lịch. Nhận xong, hai bên nhắn tin, gọi được cho nhau. Quá ${POLICY.confirmWithinHours} giờ không nhận, lịch tự huỷ.`}
          </Txt>
        </Card>
      ) : null}

      {iAmPro && b.status === "pending" && fee.owing ? <FeeCard fee={fee.value} /> : null}

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={other} uri={iAmPro ? undefined : b.pro.avatar} size={44} />
          <View style={{ flex: 1 }}>
            <Txt w={700}>{other}</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              {phone ? formatPhone(phone) : phoneNote}
            </Txt>
          </View>
        </View>
        {phone || active || (iAmPro && b.atHome) ? (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {phone ? <Button label="Gọi" icon="phone" size="sm" onPress={() => call(phone)} /> : null}
            {active ? <Button label="Nhắn tin" icon="chat" size="sm" variant="secondary" busy={busy === "chat"} onPress={() => void message()} /> : null}
            {iAmPro && b.atHome ? <Button label="Chỉ đường" icon="directions" size="sm" variant="secondary" onPress={directions} /> : null}
          </View>
        ) : null}
        {b.status === "pending" ? (
          <Txt v="meta" color={colors.muted}>
            {iAmPro ? "Nhắn tin mở khi bạn nhận lịch." : "Nhắn tin mở khi người làm nhận lịch."}
          </Txt>
        ) : null}
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
        {b.discount > 0 ? (
          <>
            <Line label="Tổng" value={formatPrice(b.quote.total)} />
            <Line label="Voucher 360dep" value={`−${formatPrice(b.discount)}`} />
            <Line label="Khách trả người làm" value={formatPrice(Math.max(0, b.quote.total - b.discount))} strong />
          </>
        ) : (
          <Line label={b.paymentMethod === "cash" ? "Khách trả sau khi làm xong" : "Khách đã trả qua 360dep"} value={formatPrice(b.quote.total)} strong />
        )}
        {iAmPro ? (
          <>
            <Line label={`Hoa hồng ${Math.round(b.quote.commissionRate * 100)}%`} value={`−${formatPrice(b.quote.commission)}`} />
            <Line label="Bạn nhận" value={formatPrice(b.quote.payout)} strong />
            {b.discount > 0 ? (
              <Txt v="meta" color={colors.muted}>
                Khách dùng voucher 360dep: khách trả bạn {formatPrice(Math.max(0, b.quote.total - b.discount))}, 360dep cộng {formatPrice(b.discount)} vào ví khi job hoàn thành.
              </Txt>
            ) : null}
          </>
        ) : null}
      </Card>

      {voucherOpen && app.uid ? <VoucherCard booking={b} uid={app.uid} onChanged={() => void booking.reload()} /> : null}

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
            <Button
              label="Nhận lịch"
              full
              busy={busy === "confirm"}
              disabled={fee.owing}
              onPress={() =>
                void run("confirm", async () => {
                  const res = await confirmBooking(b.id)
                  if (!res.ok) void fee.reload()
                  return res
                }, "Đã nhận lịch. Giờ bạn nhắn tin được với khách.")
              }
            />
            {fee.owing ? (
              <Txt v="meta" color={colors.warning} center>
                {OWING_NOTE}
              </Txt>
            ) : null}
            <Button label="Từ chối" variant="danger" full onPress={() => openSheet("decline")} />
          </>
        ) : null}
        {!iAmPro && job.confirmDone ? (
          <Button label="Xác nhận đã xong" icon="check" full busy={busy === "done"} onPress={confirmDone} />
        ) : null}
        {!iAmPro && job.reportNoShow ? <Button label="Người làm không đến" variant="danger" full onPress={() => openSheet("noshow")} /> : null}
        {active && Date.parse(b.startsAt) <= now ? (
          <Txt v="meta" color={colors.muted} center>
            Nếu không ai bấm hoàn thành, lịch tự hoàn thành lúc {at(job.autoCompleteAt)}
            {!iAmPro ? ". Người làm không đến thì báo trước lúc đó." : "."}
          </Txt>
        ) : null}
        {noShowOpen && disputed.value === false ? (
          <Card style={{ backgroundColor: colors.warningSoft }}>
            <Txt w={700} color={colors.warning}>
              {b.pro.name} báo bạn vắng mặt
            </Txt>
            <Txt v="meta" color={colors.warning}>
              Nếu không đúng, khiếu nại trước {at(new Date(Date.parse(b.cancelledAt!) + 24 * 3_600_000))}.
              {b.quote.travelFee > 0 ? " Khi bạn khiếu nại, khoản bù phí di chuyển cho người làm được giữ lại tới khi 360dep xem xét xong." : ""}
            </Txt>
            <Button label="Khiếu nại" size="sm" variant="secondary" onPress={() => openSheet("dispute")} />
          </Card>
        ) : null}
        {noShowOpen && disputed.value === true ? (
          <Txt v="meta" color={colors.muted} center>
            Bạn đã khiếu nại. 360dep sẽ xem xét và liên hệ nếu cần thêm thông tin.
          </Txt>
        ) : null}
        {iAmPro && b.status === "confirmed" && hoursToStart < 1 ? (
          <Button label="Bắt đầu làm" full busy={busy === "start"} onPress={() => void run("start", () => startBooking(b.id), "Đã bắt đầu")} />
        ) : null}
        {iAmPro && b.status === "in_progress" ? (
          <>
            {/* complete_booking refuses it before the start time; say so before the tap. */}
            <Button
              label="Hoàn thành"
              full
              busy={busy === "complete"}
              disabled={Date.parse(b.startsAt) > now}
              onPress={() => void run("complete", () => completeBooking(b.id), "Đã hoàn thành")}
            />
            {Date.parse(b.startsAt) > now ? (
              <Txt v="meta" color={colors.muted} center>
                Bấm hoàn thành được từ {at(b.startsAt)}.
              </Txt>
            ) : null}
          </>
        ) : null}
        {!iAmPro && b.status === "completed" ? (
          b.reviewed && b.reviewPublishedAt ? (
            <Txt v="meta" color={colors.muted} center>
              Đánh giá của bạn đã hiện trên hồ sơ {b.pro.name}.
            </Txt>
          ) : review.open ? (
            <>
              <Button
                label={b.reviewed ? "Sửa đánh giá" : "Viết đánh giá"}
                icon={b.reviewed ? "edit" : "star"}
                variant={b.reviewed ? "secondary" : "primary"}
                full
                onPress={() => router.push({ pathname: "/danh-gia/[bookingId]", params: { bookingId: b.id } })}
              />
              <Txt v="meta" color={colors.muted} center>
                {b.reviewed ? BLIND_NOTE : `Còn ${review.daysLeft} ngày để đánh giá.`}
              </Txt>
            </>
          ) : b.reviewed ? (
            <Txt v="meta" color={colors.muted} center>
              Bạn đã đánh giá lịch hẹn này.
            </Txt>
          ) : (
            <Txt v="meta" color={colors.muted} center>
              Đã quá 14 ngày kể từ khi hoàn thành, không đánh giá được nữa.
            </Txt>
          )
        ) : null}
        {iAmPro && b.status === "completed" ? <CustomerReviewCard booking={b} now={now} onDone={() => void booking.reload()} /> : null}
        {canCancel ? <Button label={iAmPro ? "Huỷ lịch đã nhận" : "Huỷ lịch"} variant="danger" full onPress={() => openSheet("cancel")} /> : null}
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
        title={sheet.title}
        footer={
          <Button
            label={sheet.action}
            variant={reasonFor === "dispute" ? "primary" : "danger"}
            full
            busy={busy === "reason"}
            disabled={reason.trim().length < sheet.min}
            onPress={async () => {
              reasonSheet.close()
              const text = reason.trim()
              const task =
                reasonFor === "decline"
                  ? () => declineBooking(b.id, text)
                  : reasonFor === "noshow"
                    ? () => reportProNoShow(b.id, text)
                    : reasonFor === "dispute"
                      ? () => disputeNoShow(b.id, text)
                      : () => cancelBooking(b.id, text)
              await run("reason", task, sheet.done)
              if (reasonFor === "dispute") void disputed.reload()
            }}
          />
        }
      >
        <Txt color={colors.inkSoft}>
          {reasonFor === "noshow"
            ? `Lịch hẹn sẽ được huỷ (tính là ${b.pro.name} huỷ) và 360dep nhận báo cáo để xem xét. Chỉ báo khi người làm thật sự không đến.`
            : reasonFor === "dispute"
              ? "Kể ngắn gọn chuyện đã xảy ra (ít nhất 10 ký tự). 360dep sẽ xem xét và liên hệ nếu cần."
              : iAmPro
                ? `Lý do sẽ gửi cho ${b.customer.name}. Huỷ nhiều ảnh hưởng tới thứ hạng hiển thị của bạn.`
                : `Lý do sẽ gửi cho ${b.pro.name}.`}
        </Txt>
        <BottomSheetTextInput
          value={reason}
          onChangeText={setReason}
          placeholder={sheet.placeholder}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={reasonFor === "dispute" || reasonFor === "noshow" ? 1000 : 300}
          style={{ minHeight: 88, backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
        />
      </Sheet>
    </ScrollView>
  )
}
