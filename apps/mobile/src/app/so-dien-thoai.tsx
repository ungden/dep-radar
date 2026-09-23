import * as React from "react"
import { router } from "expo-router"
import { TextInput, View } from "react-native"
import { setMyPhone } from "@/data/actions"
import { toE164 } from "@/data/format"
import { useApp } from "@/state/app"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { ErrorNote } from "@/ui/bits"
import { Txt } from "@/ui/text"

/**
 * Google, Apple and email sign-ups give no phone number, and the two sides of
 * a booking can call each other while it is active. The database refuses a booking without one (require_phone), so it
 * is asked once, set through set_my_phone(), and changed only through support.
 */
export default function Phone() {
  const app = useApp()
  const [phone, setPhone] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const valid = toE164(phone) !== null

  const save = async () => {
    setBusy(true)
    setError(null)
    const res = await setMyPhone(phone)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    await app.refreshMe()
    if (router.canGoBack()) router.back()
    else router.replace("/")
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, padding: gutter, gap: 16 }}>
      <Txt v="h2">Số điện thoại của bạn</Txt>
      <Txt color={colors.inkSoft}>
        Cần để đặt lịch. Người làm chỉ thấy số này khi đang có lịch hẹn với bạn (từ lúc họ nhận lịch tới khi xong), để liên lạc. Số không hiện công khai ở đâu cả.
      </Txt>
      <Txt color={colors.inkSoft}>
        Nếu đặt mật khẩu (trong Tôi), bạn cũng đăng nhập được bằng số này. Mỗi số chỉ dùng cho một tài khoản; muốn đổi sau này, liên hệ hỗ trợ.
      </Txt>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="0968 112 233"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        autoFocus
        style={{ height: 54, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, fontFamily: fonts[600], fontSize: 20, color: colors.ink }}
        accessibilityLabel="Số điện thoại"
      />
      {error ? <ErrorNote text={error} /> : null}
      <Button label="Lưu và tiếp tục" full size="lg" disabled={!valid} busy={busy} onPress={() => void save()} />
      <Button label="Để sau" variant="ghost" full onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
      <View />
    </View>
  )
}
