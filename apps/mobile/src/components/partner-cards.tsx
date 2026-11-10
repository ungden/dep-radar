import * as React from "react"
import { router } from "expo-router"
import { Alert, Linking, Platform, View } from "react-native"
import { confirmBooking, type BookingItem } from "@/data/bookings"
import { openThread } from "@/data/chat"
import { formatCountdown, formatDay, formatKm, formatPrice, localDate, localTime, todayISO } from "@/data/format"
import { colors, radius } from "@/theme"
import { Button } from "@/ui/button"
import { haptic } from "@/ui/haptics"
import { Icon, type IconName } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** What the customer hands over for a booking paid in cash (after any 360đẹp voucher). */
export const handedOver = (b: BookingItem) => Math.max(0, b.quote.total - b.discount)

/** "14:00 hôm nay", "09:30 ngày mai", "16:00 T6, 13/11". */
export function whenLabel(b: Pick<BookingItem, "date" | "time">) {
  const today = todayISO()
  const tomorrow = localDate(new Date(Date.parse(`${today}T12:00:00+07:00`) + 86_400_000))
  return `${b.time} ${b.date === today ? "hôm nay" : b.date === tomorrow ? "ngày mai" : formatDay(b.date)}`
}

/**
 * A booking a customer sent this partner, waiting for an answer: amber, the
 * clock, where and how far, the money in plain words, and the two answers.
 */
export function PendingBookingCard({
  booking: b,
  now,
  km,
  spa,
  blocked,
  onAccepted,
  onFailed,
}: {
  booking: BookingItem
  now: number
  km: number | null
  spa: boolean
  /** A fee is owed: accepting is refused until it is paid. */
  blocked: boolean
  onAccepted: (b: BookingItem) => void
  onFailed: () => void
}) {
  const [busy, setBusy] = React.useState(false)
  const left = Date.parse(b.confirmBy) - now
  const urgent = left > 0 && left < 30 * 60_000
  const accept = async () => {
    setBusy(true)
    const res = await confirmBooking(b.id)
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      onFailed()
      return Alert.alert("Chưa nhận được lịch", res.error)
    }
    haptic.success()
    onAccepted(b)
  }
  const where = b.atHome ? `${b.district}${km !== null ? ` · cách ${formatKm(km)}` : ""}` : spa ? `Giường ${b.seat ?? 1} tại spa` : "Tại chỗ bạn"
  return (
    <View style={{ backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: 18, gap: 10 }}>
      <Press onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id } })} accessibilityLabel={`${b.serviceName}, ${b.customer.name}. Xem chi tiết`} style={{ gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="clock" size={17} color={urgent || left <= 0 ? colors.danger : colors.warning} />
          <Txt w={700} color={urgent || left <= 0 ? colors.danger : colors.warning}>
            {left > 0 ? `Còn ${formatCountdown(left)} để nhận` : "Quá hạn nhận"}
          </Txt>
        </View>
        <Txt v="lead" w={700}>
          {b.serviceName}
          {b.quantity > 1 ? ` · ${b.quantity} người` : ""}
        </Txt>
        <Txt color={colors.inkSoft}>
          {whenLabel(b)} · {where}
        </Txt>
        <Txt v="meta" color={colors.inkSoft}>
          Khách: {b.customer.name}
        </Txt>
      </Press>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(138,90,18,0.15)" }}>
        <Txt v="meta" color={colors.inkSoft}>
          Khách đưa {formatPrice(handedOver(b))}
        </Txt>
        <Txt w={800} tabular color={colors.accentDark}>
          Bạn giữ {formatPrice(b.quote.payout)}
        </Txt>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 2 }}>
          <Button label="Nhận lịch" full busy={busy} disabled={blocked || left <= 0} onPress={() => void accept()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Từ chối" variant="secondary" full onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id, decline: "1" } })} />
        </View>
      </View>
    </View>
  )
}

/** When the partner's next button on a confirmed booking opens. */
/** "11:00", or "11:00 ngày mai" / "11:00 T5, 12/11" when it is not today. */
function unlockAt(at: number) {
  const d = localDate(new Date(at))
  return d === todayISO() ? localTime(new Date(at)) : `${localTime(new Date(at))} ${d === localDate(new Date(Date.now() + 86_400_000)) ? "ngày mai" : formatDay(d)}`
}

export function nextStepNote(b: BookingItem, now: number): string | null {
  if (b.status === "in_progress") return "Đang làm · bấm Hoàn thành khi xong"
  if (b.status !== "confirmed") return null
  const start = Date.parse(b.startsAt)
  if (b.atHome && !b.departedAt) {
    const at = start - 3 * 3_600_000
    return at <= now ? "Bước tiếp: bấm “Tôi đang đến” khi đi" : `Bước tiếp: bấm “Tôi đang đến” từ ${unlockAt(at)}`
  }
  const at = start - 15 * 60_000
  return at <= now ? "Bước tiếp: bấm “Bắt đầu làm”" : `Bước tiếp: bấm “Bắt đầu làm” từ ${unlockAt(at)}`
}

/** A confirmed booking coming up: when, who, where, the three ways to reach the customer, and what to press next. */
export function UpcomingJobCard({ booking: b, now, spa }: { booking: BookingItem; now: number; spa: boolean }) {
  const [opening, setOpening] = React.useState(false)
  const message = async () => {
    setOpening(true)
    const res = await openThread(b.pro.id, b.id)
    setOpening(false)
    if (res.ok) router.push({ pathname: "/tin-nhan/[id]", params: { id: res.data } })
    else Alert.alert("Chưa mở được hội thoại", res.error)
  }
  const directions = () => {
    const q = encodeURIComponent([b.address, b.district, b.city].filter(Boolean).join(", "))
    void Linking.openURL(Platform.OS === "ios" ? `http://maps.apple.com/?daddr=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${q}`)
  }
  const step = nextStepNote(b, now)
  const [, m, d] = b.date.split("-")
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 }}>
      <Press onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id } })} accessibilityLabel={`${b.time}, ${b.serviceName}, ${b.customer.name}`} style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <View style={{ width: 68, alignItems: "center", paddingRight: 12, borderRightWidth: 1, borderRightColor: colors.line }}>
          <Txt v="lead" w={700} tabular numberOfLines={1}>
            {b.time}
          </Txt>
          <Txt v="meta" color={colors.muted} tabular>
            {Number(d)}/{Number(m)}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt w={700} numberOfLines={1}>
            {b.serviceName}
          </Txt>
          <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
            {b.customer.name} · {b.atHome ? b.district : spa ? `Giường ${b.seat ?? 1}` : "Tại chỗ bạn"}
          </Txt>
        </View>
        <Icon name="right" size={14} color={colors.muted} />
      </Press>
      <View style={{ flexDirection: "row" }}>
        {b.customer.phone ? <Round icon="phone" label="Gọi" onPress={() => void Linking.openURL(`tel:${b.customer.phone}`)} /> : null}
        <Round icon="chat" label={opening ? "Đang mở…" : "Nhắn tin"} onPress={() => void message()} />
        {b.atHome ? <Round icon="directions" label="Chỉ đường" onPress={directions} /> : null}
      </View>
      {step ? (
        <Txt v="meta" color={colors.inkSoft}>
          {step}
        </Txt>
      ) : null}
    </View>
  )
}

function Round({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityLabel={label} style={{ flex: 1, alignItems: "center", gap: 6, minHeight: 44 }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color={colors.accent} />
      </View>
      <Txt v="meta" w={500}>
        {label}
      </Txt>
    </Press>
  )
}
