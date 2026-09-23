import * as WebBrowser from "expo-web-browser"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { webLink } from "@/data/links"
import { colors, gutter } from "@/theme"
import { EmptyState } from "@/ui/bits"

/**
 * The "+" tab opens the web form (see (tabs)/_layout.tsx) and never lands here;
 * this is only reached through a deep link.
 */
export default function PostRequest() {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 40, paddingHorizontal: gutter }}>
      <EmptyState
        title="Đăng yêu cầu"
        text="Mô tả bạn cần làm gì, khi nào, ở đâu; người làm gần bạn sẽ gửi báo giá. Mẫu đăng yêu cầu đang mở trên web."
        action="Mở mẫu đăng yêu cầu"
        onAction={() => void WebBrowser.openBrowserAsync(webLink("/requests/new"))}
      />
    </View>
  )
}
