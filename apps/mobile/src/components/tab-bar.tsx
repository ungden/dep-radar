import type { BottomTabBarProps } from "expo-router/js-tabs"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "@/theme"
import { CountBadge } from "@/ui/button"
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
 * Five tabs, the middle one a black "+". The selected tab gets a short accent
 * bar: one of the three places the accent is allowed.
 */
export function TabBar({ state, navigation, specs }: BottomTabBarProps & { specs: Record<string, TabSpec> }) {
  const insets = useSafeAreaInsets()
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
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
        }
        if (spec.center) {
          return (
            <View key={route.key} style={{ flex: 1, alignItems: "center" }}>
              <Press
                onPress={onPress}
                accessibilityLabel={spec.label}
                style={{ width: 52, height: 40, borderRadius: 20, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="plus" size={22} color={colors.surface} />
              </Press>
              <Txt v="meta" w={600} style={{ marginTop: 2 }} numberOfLines={1}>
                {spec.label}
              </Txt>
            </View>
          )
        }
        return (
          <Press
            key={route.key}
            onPress={onPress}
            quiet
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={spec.badge ? `${spec.label}, ${spec.badge} mới` : spec.label}
            style={{ flex: 1, alignItems: "center", gap: 2 }}
          >
            <View style={{ height: 3, width: 18, borderRadius: 2, backgroundColor: focused ? colors.accent : "transparent", marginBottom: 3 }} />
            <View>
              <Icon name={spec.icon} size={23} color={focused ? colors.ink : colors.muted} />
              {spec.badge ? <CountBadge count={spec.badge} style={{ position: "absolute", top: -6, right: -12 }} /> : null}
            </View>
            <Txt v="meta" w={focused ? 700 : 500} color={focused ? colors.ink : colors.muted} numberOfLines={1}>
              {spec.label}
            </Txt>
          </Press>
        )
      })}
    </View>
  )
}
