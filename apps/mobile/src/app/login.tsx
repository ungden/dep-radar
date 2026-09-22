import * as React from "react"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { webLink } from "@/data/links"
import { useApp } from "@/state/app"
import { colors, gutter } from "@/theme"
import { Button } from "@/ui/button"
import { ErrorNote, Logo } from "@/ui/bits"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** Google only, like the web. The phone number is asked once, right after. */
export default function Login() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const google = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await app.signInWithGoogle()
      if (!res.ok) {
        if (res.error) setError(res.error)
        return
      }
      if (res.needsPhone) router.replace("/so-dien-thoai")
      else router.back()
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter, paddingBottom: insets.bottom + 24, justifyContent: "space-between" }}>
      <View style={{ gap: 16, paddingTop: 24 }}>
        <Logo />
        <Txt v="h1">Đặt người giúp bạn lên hình đẹp</Txt>
        <Txt color={colors.inkSoft}>Làm đẹp, chụp ảnh, quay clip, người mẫu. Đăng nhập để đặt lịch, lưu mẫu và nhắn tin.</Txt>
      </View>
      <View style={{ gap: 12 }}>
        {error ? <ErrorNote text={error} /> : null}
        <Button label={busy ? "Đang mở Google…" : "Tiếp tục với Google"} full size="lg" busy={busy} onPress={() => void google()} />
        <Press onPress={() => void WebBrowser.openBrowserAsync(webLink("/chinh-sach"))} accessibilityRole="link">
          <Txt v="meta" color={colors.muted} center>
            Tiếp tục nghĩa là bạn đồng ý với điều khoản và chính sách của 360dep.
          </Txt>
        </Press>
      </View>
    </View>
  )
}
