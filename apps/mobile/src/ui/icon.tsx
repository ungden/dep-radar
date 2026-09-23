import { SymbolView } from "expo-symbols"
import type { StyleProp, ViewStyle } from "react-native"
import { colors } from "@/theme"

/** SF Symbols on iOS, Material Symbols on Android, one name for both. */
const ICONS = {
  search: { ios: "magnifyingglass", android: "search" },
  chat: { ios: "bubble.left", android: "chat_bubble" },
  bell: { ios: "bell", android: "notifications" },
  heart: { ios: "heart", android: "favorite" },
  heartFill: { ios: "heart.fill", android: "favorite" },
  explore: { ios: "sparkles", android: "explore" },
  calendar: { ios: "calendar", android: "calendar_month" },
  plus: { ios: "plus", android: "add" },
  person: { ios: "person", android: "person" },
  down: { ios: "chevron.down", android: "expand_more" },
  right: { ios: "chevron.right", android: "chevron_right" },
  back: { ios: "chevron.left", android: "arrow_back" },
  close: { ios: "xmark", android: "close" },
  star: { ios: "star.fill", android: "star" },
  verified: { ios: "checkmark.seal.fill", android: "verified" },
  // Plain pin: "mappin.and.ellipse" reads as an anchor at 16pt.
  pin: { ios: "mappin", android: "location_on" },
  play: { ios: "play.fill", android: "play_arrow" },
  phone: { ios: "phone.fill", android: "call" },
  filter: { ios: "slider.horizontal.3", android: "tune" },
  camera: { ios: "camera", android: "photo_camera" },
  photos: { ios: "photo.on.rectangle", android: "photo_library" },
  video: { ios: "video", android: "videocam" },
  briefcase: { ios: "briefcase", android: "work" },
  today: { ios: "sun.max", android: "today" },
  send: { ios: "arrow.up", android: "send" },
  directions: { ios: "arrow.triangle.turn.up.right.diamond", android: "directions" },
  clock: { ios: "clock", android: "schedule" },
  logout: { ios: "rectangle.portrait.and.arrow.right", android: "logout" },
  swap: { ios: "arrow.left.arrow.right", android: "swap_horiz" },
  external: { ios: "arrow.up.right.square", android: "open_in_new" },
  home: { ios: "house", android: "home" },
  check: { ios: "checkmark", android: "check" },
  shop: { ios: "storefront", android: "storefront" },
  info: { ios: "info.circle", android: "info" },
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 22,
  color = colors.ink,
  style,
}: {
  name: IconName
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}) {
  const icon = ICONS[name]
  return (
    <SymbolView
      name={{ ios: icon.ios, android: icon.android, web: icon.android }}
      size={size}
      tintColor={color}
      weight="medium"
      style={[{ width: size, height: size }, style]}
      accessible={false}
    />
  )
}
