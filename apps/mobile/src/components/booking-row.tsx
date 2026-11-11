import { router } from "expo-router"
import { View } from "react-native"
import type { BookingStatus } from "@/shared"
import { STATUS_LABEL, type BookingItem } from "@/data/bookings"
import { formatPrice, weekdayShort } from "@/data/format"
import { colors, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const TONE: Record<BookingStatus, { bg: string; fg: string }> = {
  pending: { bg: colors.warningSoft, fg: colors.warning },
  confirmed: { bg: colors.successSoft, fg: colors.success },
  in_progress: { bg: colors.successSoft, fg: colors.success },
  completed: { bg: colors.subtle, fg: colors.inkSoft },
  declined: { bg: colors.dangerSoft, fg: colors.danger },
  cancelled: { bg: colors.subtle, fg: colors.inkSoft },
  expired: { bg: colors.subtle, fg: colors.inkSoft },
  no_show: { bg: colors.dangerSoft, fg: colors.danger },
}

/** "Chờ xác nhận" says who is waiting: the partner is asked, the customer waits. */
const pendingLabel = { customer: "Chờ Artist nhận", pro: "Chờ bạn nhận" } as const

export function StatusPill({ status, as }: { status: BookingStatus; as?: "customer" | "pro" }) {
  const tone = TONE[status]
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: tone.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Txt v="meta" w={700} color={tone.fg}>
        {status === "pending" && as ? pendingLabel[as] : STATUS_LABEL[status]}
      </Txt>
    </View>
  )
}

/** One booking in a list: when, what, with whom, how much. */
export function BookingRow({ booking, as, todo }: { booking: BookingItem; as: "customer" | "pro"; todo?: ToDo | null }) {
  const other = as === "customer" ? booking.pro.name : booking.customer.name
  const row = (
    <Press
      onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: booking.id } })}
      accessibilityLabel={`${booking.serviceName} với ${other}, ${booking.date} ${booking.time}, ${STATUS_LABEL[booking.status]}`}
      style={{ flexDirection: "row", gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}
    >
      <View style={{ width: 52, alignItems: "center", paddingTop: 2 }}>
        <Txt v="meta" color={colors.muted}>
          {weekdayShort(booking.date)}
        </Txt>
        <Txt v="h2" style={{ lineHeight: 30 }}>
          {Number(booking.date.slice(8))}
        </Txt>
        <Txt v="meta" color={colors.muted}>
          th{Number(booking.date.slice(5, 7))}
        </Txt>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt w={700} numberOfLines={1}>
          {booking.serviceName}
        </Txt>
        <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
          {booking.time} · {other}
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <StatusPill status={booking.status} as={as} />
          {booking.status === "completed" && booking.delivery && !booking.delivery.acceptedAt && <Txt v="meta" color={colors.warning}>{booking.delivery.deliveredAt ? "Chờ xác nhận sản phẩm" : "Chờ giao sản phẩm"}</Txt>}
          <Txt v="meta" w={700} tabular>
            {formatPrice(as === "pro" ? booking.quote.payout : Math.max(0, booking.quote.total - booking.discount))}
          </Txt>
        </View>
      </View>
    </Press>
  )
  if (!todo) return row
  // Something the customer has to do: said on top of the booking, with the button when it is one tap.
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden" }}>
      <View style={{ backgroundColor: colors.warningSoft, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Txt v="meta" w={700} color={colors.warning}>
          {todo.text.charAt(0).toUpperCase() + todo.text.slice(1)}
        </Txt>
      </View>
      {row}
      {todo.button ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <Button label={todo.button.label} variant={todo.soft ? "secondary" : "primary"} full busy={todo.button.busy} onPress={todo.button.onPress} />
        </View>
      ) : null}
    </View>
  )
}

/** `soft`: worth doing, not urgent (a review); its button is tinted, not filled. */
export type ToDo = { text: string; soft?: boolean; button?: { label: string; onPress: () => void; busy?: boolean } }
