import { router } from "expo-router"
import { View } from "react-native"
import type { BookingStatus } from "@/shared"
import { STATUS_LABEL, type BookingItem } from "@/data/bookings"
import { formatPrice, weekdayShort } from "@/data/format"
import { colors, radius } from "@/theme"
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

export function StatusPill({ status }: { status: BookingStatus }) {
  const tone = TONE[status]
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: tone.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Txt v="meta" w={700} color={tone.fg}>
        {STATUS_LABEL[status]}
      </Txt>
    </View>
  )
}

/** One booking in a list: when, what, with whom, how much. */
export function BookingRow({ booking, as }: { booking: BookingItem; as: "customer" | "pro" }) {
  const other = as === "customer" ? booking.pro.name : booking.customer.name
  return (
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
          <StatusPill status={booking.status} />
          <Txt v="meta" w={700} tabular>
            {formatPrice(as === "pro" ? booking.quote.payout : booking.quote.total)}
          </Txt>
        </View>
      </View>
    </Press>
  )
}
