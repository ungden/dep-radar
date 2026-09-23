import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { motion } from "@/theme"
import { haptic as tick } from "./haptics"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PressProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>
  /** A selection tick for picking an option (a chip, a day, a time). Silent by default. */
  haptic?: "select"
}

/** Every tappable thing: scales to 0.98 while held. Haptics only when asked for. */
export function Press({ style, onPressIn, onPressOut, onPress, haptic, disabled, ...rest }: PressProps) {
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
        if (haptic === "select") tick.select()
        onPress?.(e)
      }}
    />
  )
}
