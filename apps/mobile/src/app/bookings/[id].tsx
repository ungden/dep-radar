import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { Alert, Linking, Platform, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BLIND_NOTE, POLICY, bookingChatOpen, customerJobActions, isSpa, rebookCart, reviewWindow, spaDirectionsLink, travelDistanceKm, verticalOf } from "@/shared"
import {
  acceptDelivery,
  cancelBooking,
  completeBooking,
  confirmBooking,
  confirmBookingDone,
  confirmPaymentReceived,
  declineBooking,
  disputeProNoShow,
  markDeparted,
  markNoShow,
  disputeNoShow,
  getBooking,
  hasDisputedNoShow,
  reportProNoShow,
  requestReschedule,
  respondReschedule,
  startBooking,
  type BookingItem,
} from "@/data/bookings"
import { openThread } from "@/data/chat"
import { formatCountdown, formatDateLong, formatDuration, formatKm, formatPhone, formatPrice, localDate, localTime } from "@/data/format"
import type { Result } from "@/data/supabase"
import { ReferencePhotos } from "@/components/reference-photos"
import { BookingPayment } from "@/components/booking-payment"
import { BookingContract } from "@/components/booking-contract"
import { VoucherCard } from "@/components/booking-voucher"
import { FeeCard, OWING_NOTE, useFee } from "@/components/fee-card"
import { loadFee, owes } from "@/data/wallet"
import { StatusPill } from "@/components/booking-row"
import { CustomerReviewCard } from "@/components/customer-review"
import { useSafetyMenu } from "@/components/safety"
import { ActionRow, DeliverCard, RescheduleButton } from "@/components/partner-booking-actions"
import { Timeline, type TimelineStep } from "@/components/timeline"
import { useApp } from "@/state/app"
import { useNow } from "@/state/keyboard"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, hairline, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Avatar, Card, EmptyState, ErrorNote, Line, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon, type IconName } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"
import { useToast } from "@/ui/toast"

function stepsFor(b: BookingItem, spa: boolean): TimelineStep[] {
  const steps: TimelineStep[] = [
    { label: "Đã gửi lịch", at: b.createdAt },
    { label: spa ? "Spa nhận lịch" : "Artist nhận lịch", at: b.confirmedAt },
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
    cancelled: b.cancelledBy === "pro" ? (spa ? "Spa đã huỷ" : "Artist đã huỷ") : "Đã huỷ",
    declined: spa ? "Spa từ chối" : "Artist từ chối",
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
  const { id, decline } = useLocalSearchParams<{ id: string; decline?: string }>()
  const app = useApp()
  const insets = useSafeAreaInsets()
  const booking = useAsync(app.uid ? () => getBooking(id, app.uid!) : null, [id, app.uid])
  const reasonSheet = useSheet()
  const [reasonFor, setReasonFor] = React.useState<"cancel" | "decline" | "noshow" | "dispute" | "absent" | "proDispute">("cancel")
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState<string | null>(null)
  const toast = useToast(140)
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

  // Hôm nay's "Từ chối" lands on this booking with the reason already asked for.
  const askDecline = decline === "1" && bv?.status === "pending" && bv.pro.id === app.uid
  React.useEffect(() => {
    if (!askDecline) return
    setReasonFor("decline")
    setReason("")
    reasonSheet.open()
  }, [askDecline])

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
  const kmAway = iAmPro && b.atHome && app.myPro ? travelDistanceKm(app.myPro.city, app.myPro.district, b.city, b.district) : null
  const run = async (key: string, task: () => Promise<Result<unknown>>, done: string) => {
    setBusy(key)
    const res = await task()
    setBusy(null)
    if (!res.ok) {
      haptic.error()
      return Alert.alert("Chưa thực hiện được", res.error)
    }
    haptic.success()
    toast.show(done)
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
  // At the provider's place the customer needs that address, and directions to it.
  const provider = app.data?.pros.find((p) => p.uuid === b.pro.id)
  const providerIsSpa = isSpa(provider)
  const providerPlace = provider?.studioAddress ? [provider.studioAddress, provider.district, provider.city].filter(Boolean).join(", ") : null
  const place = b.atHome ? [b.address, b.district, b.city].filter(Boolean).join(", ") : (providerPlace ?? (providerIsSpa ? "Tại spa" : "Tại studio"))
  const directions = () => {
    const q = encodeURIComponent([b.address, b.district, b.city].filter(Boolean).join(", "))
    void Linking.openURL(Platform.OS === "ios" ? `http://maps.apple.com/?daddr=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${q}`)
  }
  const directionsToProvider = !iAmPro && !b.atHome && provider?.studioAddress ? () => void Linking.openURL(spaDirectionsLink(provider)) : null
  const confirmLeft = Date.parse(b.confirmBy) - now
  const hoursToStart = (Date.parse(b.startsAt) - now) / 3_600_000
  // A partner answers a booking still waiting with "Từ chối", above.
  const canCancel = b.status === "confirmed" || (b.status === "pending" && !iAmPro)
  const canMarkAbsent = iAmPro && (b.status === "confirmed" || b.status === "in_progress") && now >= Date.parse(b.startsAt) + 15 * 60_000
  const active = bookingChatOpen(b.status)
  // Each side's number only while the job is live (data/bookings.ts reads it that way too).
  const phone = active ? (iAmPro ? b.customer.phone : b.pro.phone) : null
  const other = iAmPro ? b.customer.name : b.pro.name
  // How the customer's screens name the other side.
  const who = providerIsSpa ? "spa" : "Artist"
  const phoneNote =
    b.status === "pending" ? (iAmPro ? "Số điện thoại hiện khi bạn nhận lịch" : `Số điện thoại hiện khi ${who} nhận lịch`) : active ? "Chưa có số" : "Lịch hẹn đã kết thúc"
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
      title: "Artist không đến",
      action: "Báo Artist không đến",
      done: "Đã báo 360đẹp. Lịch hẹn đã huỷ.",
      placeholder: "Bạn đã chờ tới mấy giờ, có gọi được Artist không… (không bắt buộc)",
      min: 0,
    },
    dispute: { title: "Khiếu nại báo vắng mặt", action: "Gửi khiếu nại", done: "Đã gửi khiếu nại. 360đẹp sẽ xem xét.", placeholder: "Chuyện gì đã xảy ra?", min: 10 },
    proDispute: { title: "Khiếu nại: khách báo bạn không đến", action: "Gửi khiếu nại", done: "Đã gửi khiếu nại. 360đẹp sẽ xem xét.", placeholder: "Bạn tới lúc mấy giờ, đã gọi khách chưa…", min: 10 },
    absent: { title: "Khách vắng mặt", action: "Báo khách vắng mặt", done: "Đã báo khách vắng mặt", placeholder: "Bạn đã chờ tới mấy giờ, có gọi được khách không… (không bắt buộc)", min: 0 },
  }
  const sheet = SHEET[reasonFor]
  // The partner's next step stays at the bottom of the screen.
  const canStart = iAmPro && b.status === "confirmed" && hoursToStart <= 0.25
  const canDepart = iAmPro && b.status === "confirmed" && b.atHome && !b.departedAt && hoursToStart <= 3
  const canComplete = iAmPro && b.status === "in_progress"
  const fixedAction = canComplete
    ? { label: "Hoàn thành", key: "complete", disabled: Date.parse(b.startsAt) > now, task: () => completeBooking(b.id), done: "Đã hoàn thành" }
    : canStart
      ? { label: "Bắt đầu làm", key: "start", disabled: false, task: () => startBooking(b.id), done: "Đã bắt đầu" }
      : canDepart
        ? { label: "Tôi đang đến", key: "departed", disabled: false, task: () => markDeparted(b.id), done: "Đã báo khách bạn đang đến" }
        : null

  // Completing charges the fee to the wallet: say so at once, with the way to pay it.
  const complete = async () => {
    setBusy("complete")
    const res = await completeBooking(b.id)
    setBusy(null)
    if (!res.ok) {
      haptic.error()
      return Alert.alert("Chưa thực hiện được", res.error)
    }
    haptic.success()
    void booking.reload()
    const wallet = await loadFee(app.uid!).catch(() => null)
    if (owes(wallet))
      Alert.alert(
        "Đã hoàn thành",
        `Phí 360đẹp của đơn này là ${formatPrice(b.quote.commission)}. Chuyển phí ${formatPrice(-wallet!.balance)} để nhận đơn tiếp.`,
        [
          { text: "Để sau", style: "cancel" },
          { text: "Trả phí", onPress: () => router.push("/vi") },
        ],
      )
    else toast.show(`Đã hoàn thành. Phí ${formatPrice(b.quote.commission)} đã trừ vào ví.`)
  }

  type BarButton = { label: string; key: string; onPress: () => void; disabled?: boolean; icon?: IconName }
  const stopped = !iAmPro && (b.status === "declined" || b.status === "expired" || (b.status === "cancelled" && b.cancelledBy === "pro"))
  const unlocks = (at: number) => `${localTime(new Date(at))}${localDate(new Date(at)) === localDate(new Date(now)) ? "" : ` ${formatDateLong(localDate(new Date(at)))}`}`
  // The one next step of this booking, pinned to the bottom of the screen.
  const bar: { primary?: BarButton; secondary?: BarButton; note?: string } | null =
    iAmPro && b.status === "pending"
      ? {
          primary: {
            label: "Nhận lịch",
            key: "confirm",
            disabled: fee.owing || confirmLeft <= 0,
            onPress: () =>
              void run("confirm", async () => {
                const res = await confirmBooking(b.id)
                if (!res.ok) void fee.reload()
                return res
              }, "Đã nhận lịch. Giờ bạn nhắn tin được với khách."),
          },
          secondary: { label: "Từ chối", key: "decline", onPress: () => openSheet("decline") },
          note: fee.owing ? OWING_NOTE : undefined,
        }
      : fixedAction
        ? {
            primary: {
              label: fixedAction.label,
              key: fixedAction.key,
              disabled: fixedAction.disabled,
              onPress: fixedAction.key === "complete" ? () => void complete() : () => void run(fixedAction.key, fixedAction.task, fixedAction.done),
            },
            note: fixedAction.key === "complete" && fixedAction.disabled ? `Bấm hoàn thành được từ ${at(b.startsAt)}.` : undefined,
          }
        : iAmPro && b.status === "confirmed"
          ? {
              note:
                b.atHome && !b.departedAt
                  ? `Bước tiếp: bấm “Tôi đang đến” từ ${unlocks(Date.parse(b.startsAt) - 3 * 3_600_000)}`
                  : `Bước tiếp: bấm “Bắt đầu làm” từ ${unlocks(Date.parse(b.startsAt) - 15 * 60_000)}`,
            }
          : !iAmPro && job.confirmDone
            ? { primary: { label: "Xác nhận đã xong", key: "done", icon: "check", onPress: confirmDone } }
            : !iAmPro && b.delivery?.deliveredAt && !b.delivery.acceptedAt
              ? { primary: { label: "Đã nhận đủ file", key: "files", icon: "check", onPress: () => void run("files", () => acceptDelivery(b.id), "Đã xác nhận nhận file") } }
              : !iAmPro && b.status === "completed" && review.open && !b.reviewed
                ? { primary: { label: "Viết đánh giá", key: "review", icon: "star", onPress: () => router.push({ pathname: "/danh-gia/[bookingId]", params: { bookingId: b.id } }) } }
                : stopped && b.pro.slug
                  ? {
                      primary: { label: "Đặt giờ khác", key: "rebook", onPress: () => router.push({ pathname: "/book/[proId]", params: { proId: b.pro.slug, cart: rebookCart(b) } }) },
                      secondary: providerIsSpa
                        ? undefined
                        : { label: "Artist khác", key: "request", onPress: () => router.push({ pathname: "/yeu-cau/moi", params: { template: b.templateId, variant: b.variantId } }) },
                      note: b.status === "declined" ? `${b.pro.name} không nhận được giờ này.` : b.status === "expired" ? `${b.pro.name} chưa kịp trả lời, lịch đã tự huỷ.` : `${b.pro.name} đã huỷ lịch này.`,
                    }
                  : null

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: gutter, gap: 20, paddingBottom: 48 }}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerRight: () => <IconButton name="more" label="Báo cáo hoặc chặn" onPress={safety.open} /> }} />
      {safety.element}
      <View style={{ gap: 6 }}>
        <StatusPill status={b.status} as={iAmPro ? "pro" : "customer"} />
        <Txt v="h2">{b.serviceName}</Txt>
        <Txt color={colors.inkSoft}>
          {b.variantLabel}
          {b.quantity > 1 && !b.lines ? ` × ${b.quantity} người` : ""} · {formatDuration(b.durationMin)}
        </Txt>
        <Txt v="h1" style={{ marginTop: 6 }}>
          {b.time}, {formatDateLong(b.date)}
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
          <Avatar name={other} uri={iAmPro ? undefined : b.pro.avatar} artist={!iAmPro} size={44} />
          <Press onPress={iAmPro || !b.pro.slug ? undefined : () => router.push({ pathname: "/pros/[id]", params: { id: b.pro.slug } })} accessibilityRole={iAmPro ? "text" : "button"} accessibilityLabel={iAmPro ? other : `Xem hồ sơ ${other}`} style={{ flex: 1 }}>
            <Txt w={700}>{other}</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              {phone ? formatPhone(phone) : phoneNote}
            </Txt>
          </Press>
          {!iAmPro && b.pro.slug ? <Icon name="right" size={14} color={colors.muted} /> : null}
        </View>
        {phone || active || (iAmPro && b.atHome) || directionsToProvider ? (
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            {phone ? <RoundAction icon="phone" label="Gọi" onPress={() => call(phone)} /> : null}
            {active ? <RoundAction icon="chat" label="Nhắn tin" onPress={() => void message()} /> : null}
            {iAmPro && b.atHome ? <RoundAction icon="directions" label="Chỉ đường" onPress={directions} /> : null}
            {directionsToProvider ? <RoundAction icon="directions" label="Chỉ đường" onPress={directionsToProvider} /> : null}
          </View>
        ) : null}
        {b.status === "pending" ? (
          <Txt v="meta" color={colors.muted}>
            {iAmPro ? "Nhắn tin mở khi bạn nhận lịch." : `Nhắn tin mở khi ${who} nhận lịch.`}
          </Txt>
        ) : null}
      </Card>

      <Card>
        <Txt w={700}>Ở đâu</Txt>
        <Txt color={colors.inkSoft}>{place}</Txt>
        {kmAway !== null ? <Txt v="meta" w={600} color={colors.accentDark}>Cách bạn {formatKm(kmAway)}</Txt> : null}
        {b.addressNote ? <Txt v="meta" color={colors.muted}>{b.addressNote}</Txt> : null}
        {b.note ? (
          <>
            <Txt w={700} style={{ marginTop: 6 }}>
              Ghi chú
            </Txt>
            <Txt color={colors.inkSoft}>{b.note}</Txt>
          </>
        ) : null}
        <ReferencePhotos paths={b.referencePhotos} title={iAmPro ? "Ảnh mẫu khách gửi" : "Ảnh mẫu bạn gửi"} />
      </Card>

      <BookingContract booking={b} />
      {b.status === "completed" && b.delivery && !b.delivery.acceptedAt && <Txt color={colors.warning}>{b.delivery.deliveredAt ? "Chờ khách xác nhận sản phẩm" : "Xong buổi làm · chờ giao sản phẩm"}</Txt>}
      <Card>
        {b.lines ? b.lines.map((line) => <Line key={line.id} label={`${line.serviceName} · ${line.variantLabel}${line.quantity > 1 ? ` × ${line.quantity}` : ""}`} value={formatPrice(line.servicePrice)} />) : <Line label="Dịch vụ" value={formatPrice(b.quote.servicePrice)} />}
        {b.quote.travelFee ? <Line label="Phí di chuyển" value={formatPrice(b.quote.travelFee)} /> : null}
        {b.quote.urgentFee ? <Line label="Phí gấp" value={formatPrice(b.quote.urgentFee)} /> : null}
        {b.discount > 0 ? <Line label="Voucher 360đẹp" value={`−${formatPrice(b.discount)}`} /> : null}
        {iAmPro ? (
          // In plain words: what the customer hands over, what goes back to 360đẹp, what stays.
          <View style={{ gap: 2, marginTop: 6, paddingTop: 8, borderTopWidth: hairline, borderTopColor: colors.line }}>
            {b.paymentMethod === "cash" ? (
              <>
                <Line label="Khách đưa bạn" value={formatPrice(Math.max(0, b.quote.total - b.discount))} />
                <Line label="Bạn chuyển lại 360đẹp" value={formatPrice(b.quote.commission)} />
                {b.discount > 0 ? <Line label="360đẹp bù voucher vào ví" value={`+${formatPrice(b.discount)}`} /> : null}
              </>
            ) : (
              <>
                <Line label="Khách đã trả qua 360đẹp" value={formatPrice(b.quote.total)} />
                <Line label={`Phí 360đẹp (${Math.round(b.quote.commissionRate * 100)}%)`} value={`−${formatPrice(b.quote.commission)}`} />
              </>
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingTop: 6 }}>
              <Txt w={700}>Bạn giữ</Txt>
              <Txt v="lead" w={800} tabular color={colors.accentDark}>{formatPrice(b.quote.payout)}</Txt>
            </View>
            {b.paymentMethod === "cash" ? (
              <Txt v="meta" color={colors.muted}>
                Khách trả bạn sau khi làm xong. Phí 360đẹp là {Math.round(b.quote.commissionRate * 100)}% giá dịch vụ, trừ vào ví khi bạn bấm Hoàn thành.
              </Txt>
            ) : null}
          </View>
        ) : (
          <Line
            label={b.paymentMethod === "cash" ? `Bạn trả ${who} sau khi làm xong` : "Bạn đã trả qua 360đẹp"}
            value={formatPrice(b.paymentMethod === "cash" ? Math.max(0, b.quote.total - b.discount) : b.quote.total)}
            strong
          />
        )}
      </Card>

      <BookingPayment key={b.id} id={b.id} customer={!iAmPro} status={b.status} paid={Boolean(b.paidAt)} />
      {voucherOpen && app.uid ? <VoucherCard booking={b} uid={app.uid} onChanged={() => void booking.reload()} /> : null}

      <Card>
        <Txt w={700} style={{ marginBottom: 6 }}>
          Tiến trình
        </Txt>
        <Timeline steps={stepsFor(b, providerIsSpa)} />
        {b.delivery?.url ? <Button label="Mở link file" variant="secondary" size="sm" icon="external" onPress={() => void Linking.openURL(b.delivery!.url!)} /> : null}
      </Card>

      {/* Actions */}
      <View style={{ gap: 10 }}>
        {!iAmPro && job.reportNoShow ? <Button label="Artist không đến" variant="danger" full onPress={() => openSheet("noshow")} /> : null}
        {active && Date.parse(b.startsAt) <= now ? (
          <Txt v="meta" color={colors.muted} center>
            Nếu không ai bấm hoàn thành, lịch tự hoàn thành lúc {at(job.autoCompleteAt)}
            {!iAmPro ? ". Artist không đến thì báo trước lúc đó." : "."}
          </Txt>
        ) : null}
        {noShowOpen && disputed.value === false ? (
          <Card style={{ backgroundColor: colors.warningSoft }}>
            <Txt w={700} color={colors.warning}>
              {b.pro.name} báo bạn vắng mặt
            </Txt>
            <Txt v="meta" color={colors.warning}>
              Nếu không đúng, khiếu nại trước {at(new Date(Date.parse(b.cancelledAt!) + 24 * 3_600_000))}.
              {b.quote.travelFee > 0 ? " Khi bạn khiếu nại, khoản bù phí di chuyển cho Artist được giữ lại tới khi 360đẹp xem xét xong." : ""}
            </Txt>
            <Button label="Khiếu nại" size="sm" variant="secondary" onPress={() => openSheet("dispute")} />
          </Card>
        ) : null}
        {noShowOpen && disputed.value === true ? (
          <Txt v="meta" color={colors.muted} center>
            Bạn đã khiếu nại. 360đẹp sẽ xem xét và liên hệ nếu cần thêm thông tin.
          </Txt>
        ) : null}
        {/* "Thợ đang di chuyển" (20261008100100): the partner says they set off; the customer sees it. */}
        {b.status === "confirmed" && b.atHome && b.departedAt ? (
          <Txt w={700} center>
            {iAmPro ? "Bạn đã báo đang di chuyển" : `${b.pro.name} đang trên đường tới`} · từ {localTime(b.departedAt)}
          </Txt>
        ) : canStart && canDepart ? (
          <Button label="Tôi đang đến" variant="secondary" full busy={busy === "departed"} onPress={() => void run("departed", () => markDeparted(b.id), "Đã báo khách bạn đang đến")} />
        ) : null}
        {/* A new time the other side proposed (20260918040300); the answer re-checks the slot. */}
        {b.rescheduleTo && active && b.rescheduleBy && b.rescheduleBy !== (iAmPro ? "pro" : "customer") ? (
          <Card style={{ backgroundColor: colors.warningSoft, gap: 8 }}>
            <Txt w={700} color={colors.warning}>
              {iAmPro ? b.customer.name : b.pro.name} đề nghị đổi sang {at(b.rescheduleTo)}
            </Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button label="Giữ giờ cũ" size="sm" variant="secondary" full busy={busy === "keep"} onPress={() => void run("keep", () => respondReschedule(b.id, false), "Đã giữ giờ cũ")} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Đồng ý đổi" size="sm" full busy={busy === "move"} onPress={() => void run("move", () => respondReschedule(b.id, true), "Đã đổi giờ hẹn")} />
              </View>
            </View>
          </Card>
        ) : null}
        {/* "Đã nhận tiền": the freelancer's record that the customer paid. */}
        {b.paidAt ? (
          <Txt v="meta" color={colors.success} center>
            {b.paymentMethod === "online" ? "Hệ thống đã nhận QR" : `${iAmPro ? "Bạn" : b.pro.name} đã xác nhận nhận tiền`} lúc {at(b.paidAt)}.
          </Txt>
        ) : iAmPro && (b.status === "in_progress" || b.status === "completed") ? (
          <Button label="Đã nhận tiền" icon="check" variant="secondary" full busy={busy === "paid"} onPress={() => void run("paid", () => confirmPaymentReceived(b.id), "Đã lưu xác nhận nhận tiền")} />
        ) : null}
        {iAmPro && b.status === "cancelled" && b.cancelReason === "Artist không đến" && b.cancelledAt && now <= Date.parse(b.cancelledAt) + 24 * 3_600_000 ? (
          <Card style={{ backgroundColor: colors.warningSoft, gap: 6 }}>
            <Txt w={700} color={colors.warning}>
              Khách báo bạn không đến
            </Txt>
            <Txt v="meta" color={colors.warning}>
              Nếu bạn đã tới, khiếu nại trước {at(new Date(Date.parse(b.cancelledAt) + 24 * 3_600_000))}.
            </Txt>
            <Button label="Khiếu nại" size="sm" variant="secondary" onPress={() => openSheet("proDispute")} />
          </Card>
        ) : null}
        {!iAmPro && b.status === "completed" ? (
          b.reviewed && b.reviewPublishedAt ? (
            <Txt v="meta" color={colors.muted} center>
              Đánh giá của bạn đã hiện trên hồ sơ {b.pro.name}.
            </Txt>
          ) : review.open ? (
            <>
              {b.reviewed ? (
                <Button label="Sửa đánh giá" icon="edit" variant="secondary" full onPress={() => router.push({ pathname: "/danh-gia/[bookingId]", params: { bookingId: b.id } })} />
              ) : null}
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
        {iAmPro && b.status === "completed" && b.delivery && !b.delivery.acceptedAt ? <DeliverCard booking={b} onDone={() => void booking.reload()} /> : null}
        {iAmPro && b.status === "completed" ? <CustomerReviewCard booking={b} now={now} onDone={() => void booking.reload()} /> : null}
        {b.rescheduleTo && b.rescheduleBy === "pro" && iAmPro && b.status === "confirmed" ? (
          <Txt v="meta" color={colors.muted} center>
            Đã đề nghị đổi sang {at(b.rescheduleTo)}, chờ {b.customer.name} trả lời.
          </Txt>
        ) : null}
        {iAmPro && (b.status === "confirmed" || b.status === "in_progress") ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 20 }}>
            {b.status === "confirmed" && hoursToStart > 0 && !b.lines && !(b.rescheduleTo && b.rescheduleBy === "pro") ? (
              <RescheduleButton onSend={(date, time) => run("reschedule", () => requestReschedule(b.id, date, time), "Đã gửi đề nghị đổi giờ")} />
            ) : null}
            {canMarkAbsent ? <ActionRow label="Khách vắng mặt" danger onPress={() => openSheet("absent")} /> : null}
            {canCancel ? <ActionRow label="Huỷ lịch đã nhận" danger last onPress={() => openSheet("cancel")} /> : null}
          </View>
        ) : !iAmPro && (canCancel || (b.status === "confirmed" && hoursToStart > 0 && !b.lines)) ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 20 }}>
            {b.status === "confirmed" && hoursToStart > 0 && !b.lines && !(b.rescheduleTo && b.rescheduleBy === "customer") ? (
              <RescheduleButton other={b.pro.name} onSend={(date, time) => run("reschedule", () => requestReschedule(b.id, date, time), "Đã gửi đề nghị đổi giờ")} />
            ) : null}
            {canCancel ? <ActionRow label="Huỷ lịch" danger last onPress={() => openSheet("cancel")} /> : null}
          </View>
        ) : null}
        {b.rescheduleTo && b.rescheduleBy === "customer" && !iAmPro && b.status === "confirmed" ? (
          <Txt v="meta" color={colors.muted} center>
            Đã đề nghị đổi sang {at(b.rescheduleTo)}, chờ {b.pro.name} trả lời.
          </Txt>
        ) : null}
        {canCancel && !iAmPro ? (
          <Txt v="meta" color={colors.muted} center>
            {hoursToStart >= POLICY.freeCancelHours
              ? "Huỷ trước giờ hẹn không mất phí."
              : "Huỷ vẫn không mất phí, nhưng đã sát giờ: báo Artist sớm. Huỷ sát giờ nhiều lần có thể bị hạn chế tài khoản."}
          </Txt>
        ) : null}
      </View>

      <Sheet
        sheet={reasonSheet}
        title={sheet.title}
        footer={
          <Button
            label={sheet.action}
            variant={reasonFor === "dispute" || reasonFor === "proDispute" ? "primary" : "danger"}
            full
            busy={busy === "reason"}
            disabled={reason.trim().length < sheet.min}
            onPress={async () => {
              reasonSheet.close()
              const text = reason.trim()
              const task =
                reasonFor === "decline"
                  ? () => declineBooking(b.id, text)
                  : reasonFor === "absent"
                    ? () => markNoShow(b.id, text)
                  : reasonFor === "noshow"
                    ? () => reportProNoShow(b.id, text)
                    : reasonFor === "dispute"
                      ? () => disputeNoShow(b.id, text)
                      : reasonFor === "proDispute"
                        ? () => disputeProNoShow(b.id, text)
                      : () => cancelBooking(b.id, text)
              await run("reason", task, sheet.done)
              if (reasonFor === "dispute") void disputed.reload()
            }}
          />
        }
      >
        <Txt color={colors.inkSoft}>
          {reasonFor === "absent"
            ? `Chỉ báo khi bạn đã tới nơi và chờ quá 15 phút. Bạn không mất phí 360đẹp cho lịch này.${b.quote.travelFee > 0 ? ` 360đẹp bù phí di chuyển ${formatPrice(b.quote.travelFee)} vào ví bạn sau 24 giờ nếu khách không khiếu nại.` : ""}`
            : reasonFor === "noshow"
            ? `Lịch hẹn sẽ được huỷ (tính là ${b.pro.name} huỷ) và 360đẹp nhận báo cáo để xem xét. Chỉ báo khi Artist thật sự không đến.`
            : reasonFor === "dispute"
              ? "Kể ngắn gọn chuyện đã xảy ra (ít nhất 10 ký tự). 360đẹp sẽ xem xét và liên hệ nếu cần."
              : reasonFor === "proDispute"
                ? "Kể bạn đã tới lúc mấy giờ và chuyện gì xảy ra (ít nhất 10 ký tự). Ảnh chụp nơi hẹn gửi qua Báo cáo vấn đề nếu cần."
              : iAmPro
                ? `Lý do sẽ gửi cho ${b.customer.name}. Huỷ sát giờ nhiều lần có thể bị hạn chế hoặc khoá hồ sơ.`
                : `Lý do sẽ gửi cho ${b.pro.name}.`}
        </Txt>
        <BottomSheetTextInput
          value={reason}
          onChangeText={setReason}
          placeholder={sheet.placeholder}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={reasonFor === "dispute" || reasonFor === "proDispute" || reasonFor === "noshow" ? 1000 : 300}
          style={{ minHeight: 88, backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 17, color: colors.ink, textAlignVertical: "top" }}
        />
      </Sheet>
    </ScrollView>
    {bar ? (
      <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), gap: 8, backgroundColor: colors.surface, borderTopWidth: hairline, borderTopColor: colors.line }}>
        {bar.note ? (
          <Txt v="meta" w={600} color={bar.primary?.disabled ? colors.warning : colors.inkSoft} center>
            {bar.note}
          </Txt>
        ) : null}
        {bar.primary || bar.secondary ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {bar.secondary ? (
              <View style={{ flex: 1 }}>
                <Button label={bar.secondary.label} variant="secondary" size="lg" full busy={busy === bar.secondary.key} onPress={bar.secondary.onPress} />
              </View>
            ) : null}
            {bar.primary ? (
              <View style={{ flex: bar.secondary ? 2 : 1 }}>
                <Button label={bar.primary.label} icon={bar.primary.icon} size="lg" full busy={busy === bar.primary.key} disabled={bar.primary.disabled} onPress={bar.primary.onPress} />
              </View>
            ) : null}
          </View>
        ) : null}
        {iAmPro && b.status === "pending" && fee.owing ? <Button label="Trả phí ngay" variant="ghost" size="sm" full onPress={() => router.push("/vi")} /> : null}
      </View>
    ) : null}
    {toast.element}
    </View>
  )
}

function RoundAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityLabel={label} style={{ flex: 1, alignItems: "center", gap: 8, minHeight: 44 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} color={colors.accent} />
      </View>
      <Txt v="meta" w={500}>
        {label}
      </Txt>
    </Press>
  )
}
