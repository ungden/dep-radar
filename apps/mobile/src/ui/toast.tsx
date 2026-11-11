import * as React from "react"
import { AccessibilityInfo, View } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { colors, radius } from "@/theme"
import { Icon } from "./icon"
import { Txt } from "./text"

/**
 * A short "done" note that fades away by itself, in place of an alert that
 * has to be dismissed with OK. Render `element` last inside the screen's root
 * view; `bottom` lifts it above a pinned action bar.
 */
export function useToast(bottom = 24) {
  const [text, setText] = React.useState<string | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = React.useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current)
    setText(message)
    AccessibilityInfo.announceForAccessibility(message)
    timer.current = setTimeout(() => setText(null), 2800)
  }, [])
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const element = text ? (
    <View pointerEvents="none" style={{ position: "absolute", left: 20, right: 20, bottom, alignItems: "center" }}>
      <Animated.View
        key={text}
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(220)}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.ink, borderRadius: radius.full, paddingHorizontal: 18, paddingVertical: 12, maxWidth: "100%" }}
      >
        <Icon name="check" size={18} color={colors.surface} />
        <Txt w={600} color={colors.surface} style={{ flexShrink: 1 }}>
          {text}
        </Txt>
      </Animated.View>
    </View>
  ) : null

  return { show, element }
}
