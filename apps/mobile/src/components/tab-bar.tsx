import type { BottomTabBarProps } from "expo-router/js-tabs"
import { View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "@/theme"
import { Button, CountBadge } from "@/ui/button"
import { Sheet, useSheet } from "@/ui/sheet"
import { Icon, type IconName } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

export interface TabSpec {
  label: string
  icon: IconName
  /** The big middle button. */
  center?: boolean
  badge?: number
}

/**
 * Five tabs, the middle one a rose "+". The selected tab is rose.
 */
export function TabBar({ state, navigation, specs }: BottomTabBarProps & { specs: Record<string, TabSpec> }) {
  const insets = useSafeAreaInsets()
  const { fontScale } = useWindowDimensions()
  const sheet = useSheet()
  const choose = (index: number) => {
    const route = state.routes[index]
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
    if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name, route.params)
  }
  // Five columns cannot fit fully scaled accessibility labels. A full-width
  // menu keeps every destination readable, with the same routes and actions.
  if (fontScale > 1.6) return <View style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
    <Txt v="meta" w={700} style={{ flex: 1 }}>{specs[state.routes[state.index].name]?.label}</Txt>
    <Button label="Các mục" variant="secondary" size="sm" onPress={sheet.open} />
    <Sheet sheet={sheet} title="Đi đến" size="tall">
      {state.routes.map((route, index) => {
        const spec = specs[route.name]
        if (!spec) return null
        return <Press key={route.key} accessibilityRole="tab" accessibilityState={{ selected: state.index === index }} onPress={() => { sheet.close(); choose(index) }} style={{ flexDirection: "row", alignItems: "center", gap: 16, minHeight: 48, paddingVertical: 14 }}>
          <Icon name={spec.icon} size={24} color={state.index === index ? colors.accent : colors.ink} />
          <Txt style={{ flex: 1 }} w={state.index === index ? 700 : 400}>{spec.label}</Txt>
        </Press>
      })}
    </Sheet>
  </View>
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
      }}
    >
      {state.routes.map((route, index) => {
        const spec = specs[route.name]
        if (!spec) return null
        const focused = state.index === index
        const onPress = () => choose(index)
        if (spec.center) {
          return (
            <Press key={route.key} onPress={onPress} accessibilityLabel={spec.label} style={{ flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 2 }}>
              <View style={{ width: 40, height: 36, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={22} color={colors.surface} /></View>
              <Txt v="meta" w={600} center>{spec.label}</Txt>
            </Press>
          )
        }
        return (
          <Press
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={spec.badge ? `${spec.label}, ${spec.badge} mới` : spec.label}
            style={{ flex: 1, minHeight: 56, alignItems: "center", gap: 2, paddingHorizontal: 2 }}
          >
            <View style={{ height: 3, width: 18, borderRadius: 2, backgroundColor: focused ? colors.accent : "transparent", marginBottom: 3 }} />
            <View>
              <Icon name={spec.icon} size={23} color={focused ? colors.accent : colors.muted} />
              {spec.badge ? <CountBadge count={spec.badge} style={{ position: "absolute", top: -6, right: -12 }} /> : null}
            </View>
            <Txt v="meta" w={focused ? 600 : 500} color={focused ? colors.accent : colors.muted} center>
              {spec.label}
            </Txt>
          </Press>
        )
      })}
    </View>
  )
}
