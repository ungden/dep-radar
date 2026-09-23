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
  /** `soon`: nobody offers it here yet; muted, with a "Sắp có" badge. */
  items: { id: CategoryIconId; label: string; soon?: boolean }[]
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
            accessibilityLabel={it.soon ? `${it.label}, sắp có` : it.label}
            style={{ width: "20%", alignItems: "center", gap: 5 }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? colors.accent : it.soon ? colors.subtle : colors.accentSoft,
              }}
            >
              <CategoryIcon id={it.id} size={24} color={active ? colors.surface : it.soon ? colors.muted : colors.accent} />
            </View>
            {it.soon ? (
              <View style={{ position: "absolute", top: -4, right: 2, paddingHorizontal: 5, borderRadius: 999, backgroundColor: colors.surface }}>
                <Txt v="label" w={600} color={colors.muted}>
                  Sắp có
                </Txt>
              </View>
            ) : null}
            <Txt v="meta" w={active ? 600 : 500} color={active ? colors.accentDark : colors.ink} center numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {it.label}
            </Txt>
          </Press>
        )
      })}
    </View>
  )
}
