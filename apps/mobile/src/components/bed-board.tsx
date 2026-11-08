import * as React from "react"
import { router } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { SPA_TINT } from "@/shared"
import type { BookingItem } from "@/data/bookings"
import { colors, hairline, radius } from "@/theme"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const HOUR = 56
const TIME_COL = 52

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

/**
 * A spa's day by bed: one column per bed, one row per hour of opening, each
 * booking a block on the bed it holds (bookings.seat). A booking waiting for
 * an answer is dashed.
 */
export function BedBoard({ beds, bookings, hours }: { beds: number; bookings: BookingItem[]; hours: { startMin: number; endMin: number }[] }) {
  const { width } = useWindowDimensions()
  const live = bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status))
  const opens = Math.min(...(hours.length ? hours.map((h) => h.startMin) : [9 * 60]), ...live.map((b) => minutesOf(b.time)))
  const closes = Math.max(...(hours.length ? hours.map((h) => h.endMin) : [21 * 60]), ...live.map((b) => minutesOf(b.time) + b.durationMin))
  const first = Math.floor(opens / 60) * 60
  const rows = Math.max(1, Math.ceil((closes - first) / 60))
  const column = Math.max(72, Math.floor((width - 40 - TIME_COL) / Math.min(beds, 4)))

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", borderWidth: hairline, borderColor: colors.line }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={beds > 4}>
        <View>
          <View style={{ flexDirection: "row", borderBottomWidth: hairline, borderBottomColor: colors.line }}>
            <View style={{ width: TIME_COL }} />
            {Array.from({ length: beds }, (_, i) => (
              <View key={i} style={{ width: column, paddingVertical: 10, alignItems: "center", borderLeftWidth: hairline, borderLeftColor: colors.line }}>
                <Txt v="meta" w={700}>
                  Giường {i + 1}
                </Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: TIME_COL }}>
              {Array.from({ length: rows }, (_, r) => (
                <View key={r} style={{ height: HOUR, paddingLeft: 10, paddingTop: 4, borderTopWidth: r ? hairline : 0, borderTopColor: colors.line }}>
                  <Txt v="meta" color={colors.muted} tabular>
                    {String(Math.floor((first + r * 60) / 60)).padStart(2, "0")}:00
                  </Txt>
                </View>
              ))}
            </View>
            {Array.from({ length: beds }, (_, bed) => (
              <View key={bed} style={{ width: column, height: rows * HOUR, borderLeftWidth: hairline, borderLeftColor: colors.line }}>
                {Array.from({ length: rows }, (_, r) => (
                  <View key={r} style={{ position: "absolute", top: r * HOUR, left: 0, right: 0, height: HOUR, borderTopWidth: r ? hairline : 0, borderTopColor: colors.line }} />
                ))}
                {live
                  .filter((b) => (b.seat || 1) === bed + 1)
                  .map((b) => {
                    const pending = b.status === "pending"
                    const working = b.status === "in_progress"
                    return (
                      <Press
                        key={b.id}
                        onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: b.id } })}
                        accessibilityLabel={`Giường ${bed + 1}, ${b.time}, ${b.serviceName}, ${b.customer.name}${pending ? ", đang chờ nhận" : ""}`}
                        style={{
                          position: "absolute",
                          top: ((minutesOf(b.time) - first) / 60) * HOUR + 2,
                          left: 4,
                          right: 4,
                          height: Math.max(28, (b.durationMin / 60) * HOUR - 4),
                          borderRadius: radius.sm,
                          padding: 6,
                          backgroundColor: pending ? colors.surface : working ? SPA_TINT.bg : colors.accentSoft,
                          borderWidth: pending ? 1.5 : 0,
                          borderStyle: pending ? "dashed" : "solid",
                          borderColor: colors.accent,
                        }}
                      >
                        <Txt v="meta" w={600} numberOfLines={2} style={{ fontSize: 13, lineHeight: 16 }}>
                          {pending ? `Chờ nhận ${b.time}` : `${b.time} · ${b.customer.name}`}
                        </Txt>
                      </Press>
                    )
                  })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
