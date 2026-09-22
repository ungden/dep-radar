import * as React from "react"
import { router } from "expo-router"
import { Pressable, StyleSheet, Text, TextInput } from "react-native"
import { Card, Screen } from "@/components/screen"
import { signInWithEmail, signUpWithEmail } from "@/lib/api"

export default function Login() {
  const [creating, setCreating] = React.useState(false)
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      if (creating) await signUpWithEmail({ fullName: name, phone, email, password })
      else await signInWithEmail(email, password)
      router.replace("/")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đăng nhập được.")
    } finally {
      setBusy(false)
    }
  }

  const ready = email.includes("@") && password.length >= (creating ? 8 : 1) && (!creating || (name.trim().length >= 2 && phone.trim().length >= 9))

  return (
    <Screen title={creating ? "Tạo tài khoản" : "Đăng nhập"} subtitle="Đăng nhập bằng email và mật khẩu. Quên mật khẩu: dùng trang web 360dep.">
      <Card>
        {creating ? (
          <>
            <TextInput value={name} onChangeText={setName} placeholder="Họ và tên" style={styles.input} autoComplete="name" />
            <TextInput value={phone} onChangeText={setPhone} placeholder="0968 112 233" style={styles.input} inputMode="tel" autoComplete="tel" />
          </>
        ) : null}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" style={styles.input} inputMode="email" autoCapitalize="none" autoComplete="email" />
        <TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu" style={styles.input} secureTextEntry autoComplete={creating ? "new-password" : "current-password"} />
        <Pressable disabled={busy || !ready} onPress={() => void submit()} style={styles.button}>
          <Text style={styles.buttonText}>{busy ? "Đang xử lý…" : creating ? "Tạo tài khoản" : "Đăng nhập"}</Text>
        </Pressable>
        <Pressable onPress={() => { setCreating(!creating); setError(null) }}>
          <Text style={styles.link}>{creating ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Tạo tài khoản"}</Text>
        </Pressable>
        {error ? <Text selectable style={styles.error}>{error}</Text> : null}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: "#E8DCD9", borderRadius: 12, padding: 13, color: "#2A2020" },
  button: { backgroundColor: "#C65E68", padding: 14, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "700" },
  link: { color: "#C65E68", textAlign: "center", paddingVertical: 8 },
  error: { color: "#B23A48" },
})
