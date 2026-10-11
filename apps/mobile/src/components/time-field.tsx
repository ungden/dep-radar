import * as React from "react"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { colors, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

/** Pick an exact time without typing HH:mm; 24:00 remains a valid closing time. */
export function TimeField({ label, value, onChange, allowEndOfDay = false }: { label: string; value: string; onChange: (value: string) => void; allowEndOfDay?: boolean }) {
  const sheet = useSheet()
  const { fontScale } = useWindowDimensions()
  const [opened, setOpened] = React.useState(false)
  const [hour, setHour] = React.useState(0)
  const [minute, setMinute] = React.useState(0)
  const close = () => { sheet.close(); setOpened(false) }
  React.useEffect(() => { if (opened) sheet.open() }, [opened, sheet.open])
  const padded = (n: number) => String(n).padStart(2, "0")
  return <View style={{ gap: 6 }}>
    <Txt v="meta" w={600}>{label}</Txt>
    <Press accessibilityLabel={`${label}, ${value}. Chọn giờ`} onPress={() => {
      const [h, m] = value.split(":").map(Number)
      setHour(Number.isFinite(h) ? Math.min(h, allowEndOfDay ? 24 : 23) : 9); setMinute(Number.isFinite(m) ? m : 0); setOpened(true)
    }} style={{ minHeight: 48, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
      <Txt w={600} tabular>{value}</Txt>
    </Press>
    <Sheet sheet={sheet} title={label} onDismiss={() => setOpened(false)} footer={<Button full label={`Chọn ${padded(hour)}:${padded(minute)}`} onPress={() => { onChange(`${padded(hour)}:${padded(minute)}`); close() }} />}>
      {opened && <View style={{ flexDirection: "row", gap: 16 }}>
        {[{ title: "Giờ", count: allowEndOfDay ? 25 : 24, selected: hour, choose: (n: number) => { setHour(n); if (n === 24) setMinute(0) } }, { title: "Phút", count: hour === 24 ? 1 : 60, selected: minute, choose: setMinute }].map((column) => <View key={column.title} style={{ flex: 1, gap: 8 }}>
          <Txt w={700} center>{column.title}</Txt>
          <ScrollView nestedScrollEnabled style={{ height: 220 }} contentOffset={{ x: 0, y: column.selected * (Math.max(48, 26 * fontScale + 24) + 4) }} contentContainerStyle={{ gap: 4 }}>
            {Array.from({ length: column.count }, (_, n) => <Press key={n} accessibilityRole="radio" accessibilityState={{ checked: n === column.selected }} accessibilityLabel={`${column.title} ${n}`} onPress={() => column.choose(n)} style={{ minHeight: 48, padding: 12, borderRadius: radius.md, backgroundColor: n === column.selected ? colors.accentSoft : colors.surface }}><Txt center w={600} color={n === column.selected ? colors.accentDark : colors.ink}>{padded(n)}</Txt></Press>)}
          </ScrollView>
        </View>)}
      </View>}
    </Sheet>
  </View>
}
