import type { ReactNode } from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, gutter } from "@/theme"
import { Txt } from "@/ui/text"

/** The top of a tab: the same flat rose bar as Khám phá and Artist, so no page opens plain. */
export function PageBand({ title, children, right }: { title: string; children?: ReactNode; right?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ backgroundColor: colors.accentSoft, paddingTop: insets.top + 8, paddingBottom: children ? 0 : 14, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: gutter, paddingRight: gutter - 8 }}>
        <Txt v="h1">{title}</Txt>
        {right}
      </View>
      {children}
    </View>
  )
}
