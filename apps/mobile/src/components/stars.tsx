import { View } from "react-native"
import { colors } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"

export const STAR_WORDS = ["", "Tệ", "Chưa ổn", "Tạm được", "Tốt", "Tuyệt vời"]

/** One to five stars, as a radio group. */
export function StarPicker({ value, onChange, size = 36 }: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Số sao">
      {[1, 2, 3, 4, 5].map((n) => (
        <Press
          key={n}
          haptic="select"
          onPress={() => onChange(n)}
          accessibilityRole="radio"
          accessibilityLabel={`${n} sao`}
          accessibilityState={{ checked: value === n }}
          style={{ padding: 4 }}
        >
          <Icon name={n <= value ? "star" : "starEmpty"} size={size} color={n <= value ? colors.accent : colors.subtleStrong} />
        </Press>
      ))}
    </View>
  )
}
