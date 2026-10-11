import * as React from "react"
import { View } from "react-native"
import { formatDateLong, todayISO } from "@/data/format"
import { colors, radius } from "@/theme"
import { IconButton } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

/** A readable list of dates with month navigation, without requiring an ISO date. */
export function DateField({ label, value, onChange, minDate = todayISO(), maxDate, hideLabel = false }: {
  label: string
  value: string
  onChange: (value: string) => void
  minDate?: string
  maxDate?: string
  hideLabel?: boolean
}) {
  const sheet = useSheet()
  const [opened, setOpened] = React.useState(false)
  const [month, setMonth] = React.useState(minDate.slice(0, 7))
  React.useEffect(() => { if (opened) sheet.open() }, [opened, sheet.open])
  const [year, number] = month.split("-").map(Number)
  const shift = (amount: number) => {
    const date = new Date(year, number - 1 + amount, 1, 12)
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
  }
  const dates = Array.from({ length: new Date(year, number, 0).getDate() }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`).filter(date => date >= minDate && (!maxDate || date <= maxDate))
  return <View style={{ gap: 6 }}>
    {!hideLabel && <Txt v="meta" w={600}>{label}</Txt>}
    <Press
      onPress={() => {
        const initialDate = value && value >= minDate && (!maxDate || value <= maxDate) ? value : minDate
        setMonth(initialDate.slice(0, 7))
        setOpened(true)
      }}
      accessibilityLabel={`${label}, ${value ? formatDateLong(value) : "chưa chọn"}. Chọn ngày`}
      style={{ minHeight: 48, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <Txt style={{ flex: 1 }}>{value ? formatDateLong(value) : "Chọn ngày"}</Txt>
      <Icon name="down" size={20} color={colors.inkSoft} />
    </Press>
    <Sheet sheet={sheet} title={label} size="tall" onDismiss={() => setOpened(false)}>
      {opened && <>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {month > minDate.slice(0, 7) ? <IconButton name="back" label="Tháng trước" onPress={() => shift(-1)} /> : <View style={{ width: 44 }} />}
          <Txt w={700} style={{ flexShrink: 1 }} center>Tháng {number}, {year}</Txt>
          {!maxDate || month < maxDate.slice(0, 7) ? <IconButton name="right" label="Tháng sau" onPress={() => shift(1)} /> : <View style={{ width: 44, height: 44 }} />}
        </View>
        {dates.map(date => <Press key={date} accessibilityRole="radio" accessibilityState={{ checked: date === value }} onPress={() => { onChange(date); sheet.close(); setOpened(false) }} style={{ minHeight: 48, padding: 14, borderRadius: radius.md, backgroundColor: date === value ? colors.accentSoft : colors.subtle }}><Txt w={date === value ? 700 : 400} color={date === value ? colors.accentDark : colors.ink}>{formatDateLong(date)}</Txt></Press>)}
      </>}
    </Sheet>
  </View>
}
