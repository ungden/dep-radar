import * as React from "react"
import { View } from "react-native"
import Svg, { Circle, Path, Rect } from "react-native-svg"
import { CATEGORY_ICONS, ICON_SOFT_OPACITY, ICON_STROKE, type CategoryIconId } from "@/shared"
import { colors } from "@/theme"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** The same drawings as the web (lib/design/category-icons.ts). */
export function CategoryIcon({ id, size = 28, color = colors.accent }: { id: CategoryIconId; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
      {CATEGORY_ICONS[id].map((s, i) => {
        const fill = s.fill ? color : "none"
        const fillOpacity = s.fill === "soft" ? ICON_SOFT_OPACITY : 1
        if (s.k === "path") return <Path key={i} d={s.d} fill={fill} fillOpacity={fillOpacity} />
        if (s.k === "circle") return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={fill} fillOpacity={fillOpacity} />
        return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={fill} fillOpacity={fillOpacity} />
      })}
    </Svg>
  )
}

/** Categories as a wrapping grid of icon tiles, four to a row. Nothing to swipe. */
export function CategoryTiles({
  items,
  value,
  onChange,
}: {
  items: { id: CategoryIconId; label: string }[]
  value: CategoryIconId
  onChange: (id: CategoryIconId) => void
}) {
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16 }}>
      {items.map((it) => {
        const active = value === it.id
        return (
          <Press
            key={it.id}
            onPress={() => onChange(it.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={it.label}
            style={{ width: "25%", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? colors.accent : colors.accentSoft,
              }}
            >
              <CategoryIcon id={it.id} color={active ? colors.surface : colors.accent} />
            </View>
            <Txt v="meta" w={active ? 600 : 500} color={active ? colors.accentDark : colors.ink} center numberOfLines={2}>
              {it.label}
            </Txt>
          </Press>
        )
      })}
    </View>
  )
}
