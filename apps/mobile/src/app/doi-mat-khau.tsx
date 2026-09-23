import * as React from "react"
import { Stack, router } from "expo-router"
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/shared"
import { changePassword, hasPassword } from "@/data/auth"
import { PasswordField } from "@/components/auth-fields"
import { useApp } from "@/state/app"
import { colors, gutter } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Txt } from "@/ui/text"

/**
 * Change the password, or set a first one on a Google or Apple account so
 * the phone number (or email) and a password sign in too.
 */
export default function ChangePassword() {
  const app = useApp()
  const had = hasPassword(app.session?.user)
  const [password, setPassword] = React.useState("")
  const [again, setAgain] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const problem = password ? passwordProblem(password) : null
  const mismatch = again.length > 0 && again !== password
  const title = had ? "Đổi mật khẩu" : "Đặt mật khẩu"

  const save = async () => {
    if (mismatch || problem) return
    setBusy(true)
    setError(null)
    const res = await changePassword(password)
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    setDone(true)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <Stack.Screen options={{ title, headerRight: () => <IconButton name="close" label="Đóng" onPress={() => router.back()} /> }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: gutter, gap: 16 }}>
        {done ? (
          <>
            <Txt v="h2">{had ? "Đã đổi mật khẩu" : "Đã đặt mật khẩu"}</Txt>
            <Txt color={colors.inkSoft}>
              {had
                ? "Lần sau đăng nhập bằng mật khẩu mới."
                : "Từ giờ bạn đăng nhập được bằng số điện thoại (hoặc email) và mật khẩu này, ngoài cách đăng nhập cũ."}
            </Txt>
            <Button label="Xong" full size="lg" onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Txt color={colors.inkSoft}>
              {had
                ? `Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự và không chỉ có số.`
                : `Đặt mật khẩu để đăng nhập bằng số điện thoại hoặc email của tài khoản. Ít nhất ${MIN_PASSWORD_LENGTH} ký tự, không chỉ có số.`}
            </Txt>
            <PasswordField label="Mật khẩu mới" value={password} onChangeText={setPassword} isNew autoFocus hint={problem ?? undefined} />
            <PasswordField
              label="Nhập lại mật khẩu mới"
              value={again}
              onChangeText={setAgain}
              isNew
              hint={mismatch ? "Hai mật khẩu chưa giống nhau." : undefined}
              returnKeyType="done"
              onSubmitEditing={() => void save()}
            />
            {error ? <ErrorNote text={error} /> : null}
            <Button label={title} full size="lg" busy={busy} disabled={!password || Boolean(problem) || again !== password} onPress={() => void save()} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
