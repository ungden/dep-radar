import * as Haptics from "expo-haptics"
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { motion } from "@/theme"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PressProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>
  /** Skip the haptic tick (e.g. for rapid, repeated taps). */
  quiet?: boolean
}

/** Every tappable thing: scales to 0.98 while held and ticks a light haptic. */
export function Press({ style, onPressIn, onPressOut, onPress, quiet, disabled, ...rest }: PressProps) {
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={[animated, style, disabled ? { opacity: 0.45 } : null]}
      onPressIn={(e: GestureResponderEvent) => {
        scale.value = withTiming(motion.press, { duration: motion.fast })
        onPressIn?.(e)
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = withTiming(1, { duration: motion.fast })
        onPressOut?.(e)
      }}
      onPress={(e: GestureResponderEvent) => {
        if (!quiet) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        onPress?.(e)
      }}
    />
  )
}
