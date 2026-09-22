import * as React from "react"
import { router } from "expo-router"
import { Pressable, StyleSheet, Text, TextInput } from "react-native"
import { Card, Screen } from "@/components/screen"
import { myPhone, setMyPhone, signInWithGoogle } from "@/lib/api"

export default function Login() {
  const [needsPhone, setNeedsPhone] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await task()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.")
    } finally {
      setBusy(false)
    }
  }

  const google = () =>
    run(async () => {
      await signInWithGoogle()
      // Google never provides a phone number; ask once, then carry on.
      if (await myPhone()) router.replace("/")
      else setNeedsPhone(true)
    })

  const savePhone = () =>
    run(async () => {
      await setMyPhone(phone)
      router.replace("/")
    })

  if (needsPhone) {
    return (
      <Screen title="Thêm số điện thoại" subtitle="Chuyên viên gọi số này để xác nhận lịch hẹn. Mỗi số một tài khoản.">
        <Card>
          <TextInput value={phone} onChangeText={setPhone} placeholder="0968 112 233" style={styles.input} inputMode="tel" autoComplete="tel" />
          <Pressable disabled={busy || phone.replace(/\D/g, "").length < 9} onPress={() => void savePhone()} style={styles.button}>
            <Text style={styles.buttonText}>{busy ? "Đang lưu…" : "Lưu và tiếp tục"}</Text>
          </Pressable>
          {error ? <Text selectable style={styles.error}>{error}</Text> : null}
        </Card>
      </Screen>
    )
  }

  return (
    <Screen title="Đăng nhập" subtitle="Dùng tài khoản Google của bạn.">
      <Card>
        <Pressable disabled={busy} onPress={() => void google()} style={styles.google}>
          <Text style={styles.googleText}>{busy ? "Đang mở Google…" : "Tiếp tục với Google"}</Text>
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
  google: { borderWidth: 1, borderColor: "#E8DCD9", backgroundColor: "white", padding: 14, borderRadius: 12, alignItems: "center" },
  googleText: { color: "#2A2020", fontWeight: "600" },
  error: { color: "#B23A48" },
})
