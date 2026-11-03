import * as React from "react"
import { Alert, ScrollView, TextInput, View } from "react-native"
import { deliverBooking, type BookingItem } from "@/data/bookings"
import { addDays, formatDateLong, localDate, todayISO, weekdayShort } from "@/data/format"
import { colors, fonts, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, Chip } from "@/ui/bits"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

const TIMES = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

/** A new time for a confirmed booking. The customer answers on their booking; request_reschedule checks the slot. */
export function RescheduleButton({ onSend }: { onSend: (date: string, time: string) => Promise<unknown> }) {
  const sheet = useSheet()
  const [date, setDate] = React.useState(addDays(todayISO(), 1))
  const [time, setTime] = React.useState("10:00")
  const [busy, setBusy] = React.useState(false)
  const days = Array.from({ length: 21 }, (_, i) => addDays(todayISO(), i))
  return (
    <>
      <Button label="Đề nghị đổi giờ" variant="secondary" full onPress={sheet.open} />
      <Sheet
        sheet={sheet}
        title="Đề nghị đổi giờ"
        footer={
          <Button
            label="Gửi đề nghị"
            full
            busy={busy}
            onPress={async () => {
              setBusy(true)
              await onSend(date, time)
              setBusy(false)
              sheet.close()
            }}
          />
        }
      >
        <Txt color={colors.inkSoft}>Khách đồng ý thì lịch mới có hiệu lực. Chưa trả lời thì giữ giờ cũ.</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((d) => {
            const selected = d === date
            return (
              <Press
                key={d}
                haptic="select"
                onPress={() => setDate(d)}
                accessibilityState={{ selected }}
                accessibilityLabel={formatDateLong(d)}
                style={{ width: 64, paddingVertical: 8, borderRadius: radius.md, alignItems: "center", backgroundColor: selected ? colors.accent : colors.surface, borderWidth: 1, borderColor: selected ? colors.accent : colors.line }}
              >
                <Txt v="meta" color={selected ? colors.surface : colors.muted}>
                  {d === todayISO() ? "Nay" : weekdayShort(d)}
                </Txt>
                <Txt v="lead" w={600} tabular color={selected ? colors.surface : colors.ink}>
                  {Number(d.slice(8))}/{Number(d.slice(5, 7))}
                </Txt>
              </Press>
            )
          })}
        </ScrollView>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TIMES.map((t) => (
            <Chip key={t} label={t} selected={t === time} onPress={() => setTime(t)} />
          ))}
        </View>
      </Sheet>
    </>
  )
}

/** Photo and video: the link to the files, replaceable until the customer confirms (deliver_booking). */
export function DeliverCard({ booking: b, onDone }: { booking: BookingItem; onDone: () => void }) {
  const delivery = b.delivery
  const [url, setUrl] = React.useState(delivery?.url ?? "")
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const send = async () => {
    setBusy(true)
    const res = await deliverBooking(b.id, url.trim(), note.trim())
    setBusy(false)
    if (!res.ok) return Alert.alert("Chưa giao được", res.error)
    Alert.alert("Đã giao file cho khách")
    onDone()
  }
  const input = { backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink } as const
  return (
    <Card>
      <Txt w={700}>{delivery?.deliveredAt ? "Đã giao file, có thể đổi link" : "Giao file cho khách"}</Txt>
      <Txt v="meta" color={colors.inkSoft}>
        Dán link Google Drive, Google Photos hoặc iCloud đã mở quyền xem.
        {delivery?.dueAt ? ` Hạn: ${formatDateLong(localDate(delivery.dueAt))}.` : ""}
      </Txt>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="https://drive.google.com/…"
        placeholderTextColor={colors.muted}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Link giao file"
        style={input}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Ghi chú cho khách (không bắt buộc)"
        placeholderTextColor={colors.muted}
        maxLength={500}
        accessibilityLabel="Ghi chú cho khách"
        style={input}
      />
      <Button label={delivery?.deliveredAt ? "Cập nhật link" : "Giao file"} full busy={busy} disabled={!url.trim()} onPress={() => void send()} />
    </Card>
  )
}
