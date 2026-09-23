import * as React from "react"
import * as AppleAuthentication from "expo-apple-authentication"
import { Stack, router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { webLink } from "@/data/links"
import { hasAcceptedTerms } from "@/data/terms"
import { supabase } from "@/data/supabase"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { ErrorNote, Logo } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/**
 * Google, and on iOS Apple too (App Store 4.8). The terms are agreed once,
 * then the phone number is asked once. Closing returns to where the person
 * was, with whatever they had chosen still there.
 */
export default function Login() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = React.useState<"google" | "apple" | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [appleAvailable, setAppleAvailable] = React.useState(false)

  React.useEffect(() => {
    if (Platform.OS !== "ios") return
    void AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => {})
  }, [])

  const run = async (which: "google" | "apple") => {
    setBusy(which)
    setError(null)
    try {
      const res = which === "google" ? await app.signInWithGoogle() : await app.signInWithApple()
      if (!res.ok) {
        if (res.error) {
          haptic.error()
          setError(res.error)
        }
        return
      }
      haptic.success()
      const { data } = await supabase.auth.getUser()
      const agreed = data.user ? await hasAcceptedTerms(data.user.id) : true
      if (!agreed) router.replace({ pathname: "/dieu-khoan", params: { next: res.needsPhone ? "phone" : "back" } })
      else if (res.needsPhone) router.replace("/so-dien-thoai")
      else router.back()
    } finally {
      setBusy(null)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter, paddingBottom: insets.bottom + 24, justifyContent: "space-between" }}>
      <Stack.Screen options={{ headerRight: () => <IconButton name="close" label="Đóng" onPress={() => router.back()} /> }} />
      <View style={{ gap: 16, paddingTop: 8 }}>
        <Logo />
        <Txt v="h1">Đặt người giúp bạn lên hình đẹp</Txt>
        <Txt color={colors.inkSoft}>Làm đẹp, chụp ảnh, quay clip, người mẫu. Đăng nhập để đặt lịch, lưu mẫu và nhắn tin.</Txt>
      </View>
      <View style={{ gap: 12 }}>
        {error ? <ErrorNote text={error} /> : null}
        {appleAvailable ? (
          busy === "apple" ? (
            <Button label="Đang mở Apple…" full size="lg" variant="secondary" busy />
          ) : (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
              cornerRadius={radius.full}
              style={{ height: 54, width: "100%" }}
              onPress={() => void run("apple")}
            />
          )
        ) : null}
        <Button
          label={busy === "google" ? "Đang mở Google…" : "Tiếp tục với Google"}
          full
          size="lg"
          busy={busy === "google"}
          disabled={busy === "apple"}
          onPress={() => void run("google")}
        />
        <Press onPress={() => void WebBrowser.openBrowserAsync(webLink("/chinh-sach"))} accessibilityRole="link">
          <Txt v="meta" color={colors.muted} center>
            Tiếp tục nghĩa là bạn đồng ý với{" "}
            <Txt v="meta" w={600} color={colors.accent}>
              điều khoản và chính sách
            </Txt>{" "}
            của 360dep.
          </Txt>
        </Press>
      </View>
    </View>
  )
}
