import { ScrollView, View } from "react-native"
import { colors, gutter } from "@/theme"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/**
 * A row of text tabs. The selected one is rose with a short rose bar under it.
 */
export function TextTabs<T extends string>({
  items,
  value,
  onChange,
  size = "lead",
}: {
  items: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  size?: "lead" | "body"
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 20 }}>
      {items.map((item) => {
        const selected = item.value === value
        return (
          <Press
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{ paddingTop: 10, alignItems: "center" }}
          >
            <Txt v={size} w={selected ? 600 : 500} color={selected ? colors.accent : colors.muted}>
              {item.label}
            </Txt>
            <View style={{ height: 3, alignSelf: "stretch", marginTop: 6, borderRadius: 2, backgroundColor: selected ? colors.accent : "transparent" }} />
          </Press>
        )
      })}
    </ScrollView>
  )
}
