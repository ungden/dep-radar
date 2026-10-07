import * as React from "react"
import * as AppleAuthentication from "expo-apple-authentication"
import { Stack, router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { MIN_PASSWORD_LENGTH, parseIdentifier, passwordProblem } from "@/shared"
import { forgotPassword, loadProviders, needsRecoveryEmail, recoveryEmailAsked } from "@/data/auth"
import { webLink } from "@/data/links"
import { loadSupportZalo } from "@/data/support"
import { hasAcceptedTerms } from "@/data/terms"
import { supabase } from "@/data/supabase"
import { Field, InfoNote, PasswordField } from "@/components/auth-fields"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { ErrorNote, Logo } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

type Mode = "signin" | "signup"
type Busy = "password" | "forgot" | "google" | "apple" | null

/**
 * Phone number or email with a password, Google, and on iOS Apple too (App
 * Store 4.8). After signing in: the terms once, then the phone number once
 * (Google and Apple give none), then, for an account made with a phone number,
 * an email to recover the password through. Closing returns to where the
 * person was, with whatever they had chosen still there.
 */
export default function Login() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const [mode, setMode] = React.useState<Mode>("signin")
  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [busy, setBusy] = React.useState<Busy>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)
  const [appleAvailable, setAppleAvailable] = React.useState(false)
  // null: not known (offline, or still asking). Only a clear "off" hides a button.
  const [providers, setProviders] = React.useState<{ apple: boolean; google: boolean } | null>(null)

  React.useEffect(() => {
    void loadProviders().then(setProviders)
    if (Platform.OS !== "ios") return
    void AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => {})
  }, [])

  const typed = parseIdentifier(identifier)
  const signup = mode === "signup"
  const problem = signup && password ? passwordProblem(password) : null
  const canSubmit = typed.kind !== "invalid" && password.length > 0 && (!signup || (fullName.trim().length > 0 && !problem))

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  /**
   * Terms, then (phone accounts) a recovery email, then back to where they
   * were. No phone step: booking, posting a request and the partner profile
   * ask for it when they need it (owner, 07/10/2026).
   */
  const continueAfterSignIn = async (_needsPhone: boolean) => {
    haptic.success()
    const { data } = await supabase.auth.getUser()
    const user = data.user
    const agreed = user ? await hasAcceptedTerms(user.id) : true
    const needsEmail = Boolean(user && needsRecoveryEmail(user) && !(await recoveryEmailAsked(user.id)))
    const after = needsEmail ? "email" : "back"
    if (!agreed) router.replace({ pathname: "/dieu-khoan", params: { next: after } })
    else if (after === "email") router.replace({ pathname: "/them-email", params: { first: "1" } })
    else router.back()
  }

  const run = async (which: Exclude<Busy, null | "forgot">) => {
    setBusy(which)
    setError(null)
    setInfo(null)
    try {
      const res =
        which === "google"
          ? await app.signInWithGoogle()
          : which === "apple"
            ? await app.signInWithApple()
            : signup
              ? await app.signUpWithPassword(identifier, password, fullName)
              : await app.signInWithPassword(identifier, password)
      if (!res.ok) {
        if (res.error) {
          haptic.error()
          setError(res.error)
        }
        return
      }
      await continueAfterSignIn(res.needsPhone)
    } finally {
      setBusy(null)
    }
  }

  const forgot = async () => {
    setError(null)
    setInfo(null)
    if (typed.kind === "invalid") {
      setError("Nhập số điện thoại hoặc email của bạn ở trên, rồi bấm Quên mật khẩu.")
      return
    }
    setBusy("forgot")
    const res = await forgotPassword(identifier)
    setBusy(null)
    if (res.ok) setInfo(res.message)
    else setError(res.message)
  }

  // A phone account cannot reset its password by e-mail: the support Zalo does it.
  const [zalo, setZalo] = React.useState<string | null>(null)
  React.useEffect(() => {
    void loadSupportZalo().then(setZalo)
  }, [])
  const openSupport = () => void WebBrowser.openBrowserAsync(zalo ? `https://zalo.me/${zalo}` : webLink("/tro-giup"))

  const showApple = appleAvailable && providers?.apple !== false
  const showGoogle = providers?.google !== false
  const locked = busy !== null

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <Stack.Screen options={{ headerRight: () => <IconButton name="close" label="Đóng" onPress={() => router.back()} /> }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 20 }}
      >
        <View style={{ gap: 12 }}>
          <Logo />
          <Txt v="h1">Đặt người giúp bạn lên hình đẹp</Txt>
          <Txt color={colors.inkSoft}>Làm đẹp, chụp ảnh, quay clip, người mẫu. Đăng nhập để đặt lịch, lưu mẫu và nhắn tin.</Txt>
        </View>

        <View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: colors.subtle, borderRadius: radius.full, padding: 4 }}>
          {(
            [
              { value: "signin", label: "Đăng nhập" },
              { value: "signup", label: "Tạo tài khoản" },
            ] as const
          ).map((t) => {
            const selected = mode === t.value
            return (
              <Press
                key={t.value}
                onPress={() => switchMode(t.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                haptic="select"
                style={{ flex: 1, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: selected ? colors.surface : "transparent" }}
              >
                <Txt w={selected ? 700 : 500} color={selected ? colors.ink : colors.muted}>
                  {t.label}
                </Txt>
              </Press>
            )
          })}
        </View>

        {showApple || showGoogle ? (
          <View style={{ gap: 12 }}>
            {showApple ? (
              busy === "apple" ? (
                <Button label="Đang mở Apple…" full size="lg" variant="secondary" busy />
              ) : (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                  cornerRadius={radius.full}
                  style={{ height: 54, width: "100%", opacity: locked ? 0.45 : 1 }}
                  onPress={() => !locked && void run("apple")}
                />
              )
            ) : null}
            {showGoogle ? (
              <Button
                label={busy === "google" ? "Đang mở Google…" : "Tiếp tục với Google"}
                full
                size="lg"
                variant="secondary"
                busy={busy === "google"}
                disabled={locked && busy !== "google"}
                onPress={() => void run("google")}
              />
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
              <Txt v="meta" color={colors.muted}>
                hoặc dùng email
              </Txt>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
            </View>
          </View>
        ) : null}

        <View style={{ gap: 14 }}>
          {signup ? (
            <Field label="Tên của bạn" value={fullName} onChangeText={setFullName} placeholder="Nguyễn Thu Hà" autoComplete="name" textContentType="name" maxLength={80} />
          ) : null}
          <Field
            label="Email hoặc số điện thoại"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="ban@gmail.com hoặc 0968 112 233"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            keyboardType="email-address"
            hint={
              signup && typed.kind === "phone"
                ? "Nên dùng email (hoặc thêm email sau): tài khoản chỉ có số điện thoại thì quên mật khẩu phải nhắn Zalo hỗ trợ."
                : signup
                  ? "Số điện thoại chỉ cần khi bạn đặt lịch hoặc nhận khách."
                  : undefined
            }
          />
          <PasswordField
            value={password}
            onChangeText={setPassword}
            isNew={signup}
            placeholder={signup ? `Ít nhất ${MIN_PASSWORD_LENGTH} ký tự` : undefined}
            hint={problem ?? undefined}
            onSubmitEditing={() => canSubmit && !locked && void run("password")}
            returnKeyType="go"
          />
        </View>

        {error ? <ErrorNote text={error} /> : null}
        {error && !signup && typed.kind === "phone" ? (
          <Press onPress={openSupport} accessibilityRole="link" style={{ alignSelf: "center", paddingVertical: 6 }}>
            <Txt v="meta" color={colors.inkSoft} center>
              Quên mật khẩu của tài khoản số điện thoại?{" "}
              <Txt v="meta" w={700} color={colors.accent}>
                {zalo ? `Nhắn Zalo hỗ trợ ${zalo}` : "Liên hệ hỗ trợ"}
              </Txt>{" "}
              từ chính số đó.
            </Txt>
          </Press>
        ) : null}
        {info ? <InfoNote text={info} /> : null}

        <View style={{ gap: 4 }}>
          <Button
            label={signup ? "Tạo tài khoản" : "Đăng nhập"}
            full
            size="lg"
            busy={busy === "password"}
            disabled={!canSubmit || (locked && busy !== "password")}
            onPress={() => void run("password")}
          />
          {signup ? null : (
            <Press onPress={() => void forgot()} disabled={locked} accessibilityRole="button" style={{ alignSelf: "center", paddingVertical: 10, paddingHorizontal: 12 }}>
              <Txt w={600} color={colors.accentDark}>
                {busy === "forgot" ? "Đang gửi…" : "Quên mật khẩu?"}
              </Txt>
            </Press>
          )}
        </View>

        <Press onPress={() => void WebBrowser.openBrowserAsync(webLink("/chinh-sach"))} accessibilityRole="link">
          <Txt v="meta" color={colors.muted} center>
            Tiếp tục nghĩa là bạn đồng ý với{" "}
            <Txt v="meta" w={600} color={colors.accent}>
              điều khoản và chính sách
            </Txt>{" "}
            của 360dep.
          </Txt>
        </Press>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
