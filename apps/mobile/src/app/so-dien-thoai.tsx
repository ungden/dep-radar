import * as React from "react"
import { router } from "expo-router"
import { TextInput, View } from "react-native"
import { setMyPhone } from "@/data/actions"
import { formatPhone, toE164 } from "@/data/format"
import { useApp } from "@/state/app"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { ErrorNote } from "@/ui/bits"
import { Txt } from "@/ui/text"

/**
 * Google, Apple and email sign-ups give no phone number, and the two sides of
 * a booking can call each other while it is active. The database refuses a booking without one (require_phone), so it
 * is added or changed through set_my_phone() by its account owner.
 */
export default function Phone() {
  const app = useApp()
  const currentPhone = app.me.account?.phone ?? ""
  const [phone, setPhone] = React.useState(currentPhone ? formatPhone(currentPhone) : "")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const saving = React.useRef(false)
  const valid = toE164(phone) !== null && (!currentPhone || toE164(phone) !== toE164(currentPhone))

  const save = async () => {
    if (saving.current || !valid) return
    saving.current = true
    setBusy(true)
    setError(null)
    try {
      const res = await setMyPhone(phone)
      if (!res.ok) {
        setError(res.error)
        return
      }
      await app.refreshMe()
      if (router.canGoBack()) router.back()
      else router.replace("/")
    } catch {
      setError("Không lưu được số điện thoại. Kiểm tra kết nối rồi thử lại.")
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, padding: gutter, gap: 16 }}>
      <Txt v="h2">{currentPhone ? "Đổi số điện thoại" : "Số điện thoại của bạn"}</Txt>
      <Txt color={colors.inkSoft}>
        Cần để đặt lịch. Người làm chỉ thấy số này khi đang có lịch hẹn với bạn (từ lúc họ nhận lịch tới khi xong), để liên lạc. Số không hiện công khai ở đâu cả.
      </Txt>
      <Txt color={colors.inkSoft}>
        Nếu đặt mật khẩu (trong Tôi), bạn cũng đăng nhập được bằng số này. Mỗi số chỉ dùng cho một tài khoản. Bạn có thể tự đổi số trong Tôi.
      </Txt>
      {currentPhone ? <Txt color={colors.inkSoft}>Sau khi lưu, dùng số mới để đăng nhập bằng mật khẩu. Số cũ sẽ không còn đăng nhập tài khoản này.</Txt> : null}
      <TextInput
        value={phone}
        onChangeText={(value) => {
          setPhone(value)
          setError(null)
        }}
        editable={!busy}
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
      <Button label={currentPhone ? "Lưu số mới" : "Lưu và tiếp tục"} full size="lg" disabled={!valid} busy={busy} onPress={() => void save()} />
      <Button label={currentPhone ? "Huỷ" : "Để sau"} variant="ghost" full disabled={busy} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
      <View />
    </View>
  )
}
