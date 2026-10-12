import * as React from "react"
import { View } from "react-native"
import Svg, { Circle, Path, Rect } from "react-native-svg"
import { CATEGORY_ICONS, CATEGORY_TINTS, ICON_SOFT_OPACITY, ICON_STROKE, type CategoryIconId } from "@/shared"
import { colors } from "@/theme"
import { Icon } from "@/ui/icon"
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

/**
 * Categories as a wrapping grid of icon tiles, four to a row. Nothing to
 * swipe. `more` adds a last tile that opens or closes the rest (the home
 * screen keeps one row).
 */
export function CategoryTiles({
  items,
  value,
  onChange,
  more,
}: {
  /** `soon`: nobody offers it here yet; muted, with a "Sắp có" badge. */
  items: { id: CategoryIconId; label: string; soon?: boolean }[]
  value: CategoryIconId
  onChange: (id: CategoryIconId) => void
  more?: { open: boolean; onToggle: () => void }
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
            accessibilityLabel={it.soon ? `${it.label}, chưa có người nhận lịch` : it.label}
            style={{ width: "25%", alignItems: "center", gap: 5 }}
          >
            <View
              // Each category keeps its own colour (lib/design/category-icons.ts); the chosen one gets an ink ring.
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: CATEGORY_TINTS[it.id].bg,
                borderWidth: active ? 2.5 : 0,
                borderColor: colors.ink,
                opacity: it.soon && !active ? 0.6 : 1,
              }}
            >
              <CategoryIcon id={it.id} size={24} color={CATEGORY_TINTS[it.id].fg} />
            </View>
            <Txt v="meta" w={active ? 700 : 600} color={active ? colors.ink : colors.inkSoft} center style={{ paddingHorizontal: 4 }}>
              {it.label}
            </Txt>
          </Press>
        )
      })}
      {more ? (
        <Press
          onPress={more.onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: more.open }}
          accessibilityLabel={more.open ? "Thu gọn danh mục" : "Xem thêm danh mục"}
          style={{ width: "25%", alignItems: "center", gap: 5 }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            {more.open ? <Icon name="up" size={20} color={colors.ink} /> : <CategoryIcon id="all" size={24} color={colors.ink} />}
          </View>
          <Txt v="meta" w={500} center style={{ paddingHorizontal: 4 }}>
            {more.open ? "Thu gọn" : "Xem thêm"}
          </Txt>
        </Press>
      ) : null}
    </View>
  )
}
