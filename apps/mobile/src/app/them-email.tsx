import * as React from "react"
import { router, useLocalSearchParams } from "expo-router"
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { maskEmail, parseIdentifier } from "@/shared"
import { addRecoveryEmail, needsRecoveryEmail, rememberRecoveryEmailAsked } from "@/data/auth"
import { Field, InfoNote } from "@/components/auth-fields"
import { useApp } from "@/state/app"
import { colors, gutter } from "@/theme"
import { Button } from "@/ui/button"
import { ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Txt } from "@/ui/text"

/**
 * An account made with a phone number has no real email, so a forgotten
 * password could not be recovered. Asked once right after signing up
 * (`first`), and kept as a row in Tôi until there is one.
 */
export default function AddEmail() {
  const { first } = useLocalSearchParams<{ first?: string }>()
  const app = useApp()
  const user = app.session?.user ?? null
  const [email, setEmail] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<{ pending: boolean; email: string } | null>(null)
  const pending = user?.new_email ?? null

  React.useEffect(() => {
    if (first && app.uid) void rememberRecoveryEmailAsked(app.uid)
  }, [first, app.uid])

  const leave = () => (router.canGoBack() ? router.back() : router.replace("/"))

  const save = async () => {
    setBusy(true)
    setError(null)
    const res = await addRecoveryEmail(email)
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    setDone({ pending: res.pending, email: res.email })
    void app.refreshMe()
  }

  if (done) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: gutter, gap: 16 }}>
        <Txt v="h2">{done.pending ? "Mở email để xác nhận" : "Đã lưu email"}</Txt>
        <InfoNote
          text={
            done.pending
              ? `360dep đã gửi link xác nhận tới ${done.email}. Bấm link trong thư để hoàn tất; chưa xác nhận thì email chưa dùng được để lấy lại mật khẩu.`
              : `Từ giờ, khi quên mật khẩu, 360dep gửi link đặt lại tới ${done.email}.`
          }
        />
        <Txt color={colors.inkSoft}>Bạn vẫn đăng nhập bằng số điện thoại và mật khẩu như cũ.</Txt>
        <Button label="Xong" full size="lg" onPress={leave} />
      </ScrollView>
    )
  }

  const hasReal = user && !needsRecoveryEmail(user)

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: gutter, gap: 16 }}>
        <Txt v="h2">Thêm email để lấy lại mật khẩu khi quên</Txt>
        <Txt color={colors.inkSoft}>
          Bạn đăng ký bằng số điện thoại nên 360dep chưa có cách gửi link đặt lại mật khẩu cho bạn. Thêm email bạn đang dùng: 360dep gửi một link xác nhận, bấm link là xong.
        </Txt>
        {hasReal && user?.email ? <InfoNote text={`Tài khoản đã có email ${maskEmail(user.email)}.`} /> : null}
        {pending ? <InfoNote text={`Đang chờ xác nhận ${pending}. Mở email và bấm link; không thấy thư thì xem mục Spam, hoặc gửi lại bên dưới.`} /> : null}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus={!pending}
          returnKeyType="send"
          onSubmitEditing={() => void save()}
        />
        {error ? <ErrorNote text={error} /> : null}
        <Button
          label={pending ? "Gửi lại link xác nhận" : "Gửi link xác nhận"}
          full
          size="lg"
          busy={busy}
          disabled={parseIdentifier(email).kind !== "email"}
          onPress={() => void save()}
        />
        {first ? <Button label="Để sau" variant="ghost" full onPress={leave} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
