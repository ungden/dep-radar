import { ScrollView, View } from "react-native"
import { colors, gutter } from "@/theme"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/**
 * A row of text tabs. The selected one is ink and bold with a short accent bar
 * under it; the accent does nothing else here.
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
            quiet
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{ paddingTop: 10, alignItems: "center" }}
          >
            <Txt v={size} w={selected ? 800 : 500} color={selected ? colors.ink : colors.muted}>
              {item.label}
            </Txt>
            <View style={{ height: 3, alignSelf: "stretch", marginTop: 6, borderRadius: 2, backgroundColor: selected ? colors.accent : "transparent" }} />
          </Press>
        )
      })}
    </ScrollView>
  )
}
