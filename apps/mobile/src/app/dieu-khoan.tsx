import * as React from "react"
import { router, useLocalSearchParams } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { webLink } from "@/data/links"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Txt } from "@/ui/text"

const POINTS = [
  "Không đăng hay gửi nội dung khiêu dâm, bạo lực, lừa đảo hoặc xúc phạm người khác.",
  "Không yêu cầu hay chuyển tiền cọc ngoài lịch hẹn. 360dep không bao giờ thu phí hồ sơ.",
  "Báo cáo hoặc chặn bất kỳ ai làm bạn khó chịu; 360dep xử lý báo cáo trong 24 giờ và gỡ nội dung vi phạm.",
  "Tài khoản vi phạm có thể bị khoá.",
]

/**
 * The terms, agreed once per person on this phone (stored in the Keychain).
 * Declining signs out: the app shows nothing that needs an account without them.
 */
export default function Terms() {
  const { next } = useLocalSearchParams<{ next?: string }>()
  const app = useApp()
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = React.useState(false)

  const accept = async () => {
    setBusy(true)
    await app.acceptTerms()
    setBusy(false)
    if (next === "phone") router.replace("/so-dien-thoai")
    else if (router.canGoBack()) router.back()
    else router.replace("/")
  }

  const decline = async () => {
    await app.signOut()
    if (router.canGoBack()) router.back()
    else router.replace("/")
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 16 }}>
        <Txt v="h2">Trước khi bắt đầu</Txt>
        <Txt color={colors.inkSoft}>360dep là nơi khách và người làm gặp nhau. Để ai cũng an toàn, bạn đồng ý với điều khoản sử dụng:</Txt>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 12 }}>
          {POINTS.map((p) => (
            <View key={p} style={{ flexDirection: "row", gap: 10 }}>
              <Icon name="check" size={16} color={colors.accent} style={{ marginTop: 3 }} />
              <Txt style={{ flex: 1 }}>{p}</Txt>
            </View>
          ))}
        </View>
        <Button
          label="Đọc đầy đủ điều khoản và chính sách"
          variant="ghost"
          icon="external"
          onPress={() => void WebBrowser.openBrowserAsync(webLink("/chinh-sach"))}
        />
      </ScrollView>
      <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16), gap: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button label="Tôi đồng ý" full size="lg" busy={busy} onPress={() => void accept()} />
        <Button label="Không đồng ý, đăng xuất" variant="ghost" full onPress={() => void decline()} />
      </View>
    </View>
  )
}
