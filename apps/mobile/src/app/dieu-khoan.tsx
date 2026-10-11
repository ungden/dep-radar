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
  "360dep không dung thứ nội dung phản cảm hay người dùng lạm dụng. Không đăng hay gửi nội dung khiêu dâm, bạo lực, thù ghét, lừa đảo hoặc xúc phạm người khác.",
  "Không yêu cầu hay chuyển tiền cọc ngoài lịch hẹn. 360dep không bao giờ thu phí hồ sơ.",
  "Bấm ⋯ trên hồ sơ, tác phẩm, cuộc trò chuyện, hoặc Báo cáo dưới một đánh giá, để báo cáo hay chặn người làm bạn khó chịu. Người bị chặn biến mất khỏi máy bạn ngay và 360dep được báo.",
  "360dep xử lý mọi báo cáo trong 24 giờ: gỡ nội dung vi phạm và khoá tài khoản đã đăng nội dung đó.",
]

/**
 * The terms. The login screen links here to read them (mode=read) before
 * anyone signs in; people who signed in before that agree here once, per
 * person on this phone (stored in the Keychain). Declining signs out: the app
 * shows nothing that needs an account without them.
 */
export default function Terms() {
  const { next, mode } = useLocalSearchParams<{ next?: string; mode?: string }>()
  const reading = mode === "read"
  const app = useApp()
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = React.useState(false)

  const accept = async () => {
    setBusy(true)
    await app.acceptTerms()
    setBusy(false)
    if (next === "phone") router.replace("/so-dien-thoai")
    else if (next === "email") router.replace({ pathname: "/them-email", params: { first: "1" } })
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
        <Txt v="h2">{reading ? "Điều khoản sử dụng" : "Trước khi bắt đầu"}</Txt>
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
        {reading ? (
          <Button label="Đóng" full size="lg" onPress={() => router.back()} />
        ) : (
          <>
            <Button label="Tôi đồng ý" full size="lg" busy={busy} onPress={() => void accept()} />
            <Button label="Không đồng ý, đăng xuất" variant="ghost" full onPress={() => void decline()} />
          </>
        )}
      </View>
    </View>
  )
}
