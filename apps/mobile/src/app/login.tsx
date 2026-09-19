import * as React from "react"
import { router } from "expo-router"
import { Pressable, StyleSheet, Text, TextInput } from "react-native"
import { Card, Screen } from "@/components/screen"
import { requestSmsOtp, verifySmsOtp } from "@/lib/api"

export default function Login() {
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [token, setToken] = React.useState("")
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const send = async () => { setBusy(true); setError(null); try { await requestSmsOtp(phone, name); setSent(true) } catch (e) { setError(e instanceof Error ? e.message : "Không gửi được SMS.") } finally { setBusy(false) } }
  const verify = async () => { setBusy(true); setError(null); try { await verifySmsOtp(phone, token); router.replace("/") } catch (e) { setError(e instanceof Error ? e.message : "Không xác thực được.") } finally { setBusy(false) } }
  return <Screen title="Đăng nhập" subtitle="Chỉ mở phiên sau khi xác thực SMS."><Card>
    {!sent ? <><TextInput value={name} onChangeText={setName} placeholder="Họ và tên" style={styles.input} autoComplete="name" /><TextInput value={phone} onChangeText={setPhone} placeholder="+84 9xx xxx xxx" style={styles.input} inputMode="tel" autoComplete="tel" /><Pressable disabled={busy || name.trim().length < 2} onPress={() => void send()} style={styles.button}><Text style={styles.buttonText}>{busy ? "Đang gửi…" : "Gửi mã SMS"}</Text></Pressable></> : <><Text selectable>Đã gửi mã tới {phone}.</Text><TextInput value={token} onChangeText={setToken} placeholder="Mã xác thực" style={styles.input} inputMode="numeric" autoComplete="one-time-code" /><Pressable disabled={busy || token.length < 4} onPress={() => void verify()} style={styles.button}><Text style={styles.buttonText}>{busy ? "Đang kiểm tra…" : "Xác nhận"}</Text></Pressable></>}
    {error ? <Text selectable style={styles.error}>{error}</Text> : null}
  </Card></Screen>
}
const styles = StyleSheet.create({ input: { borderWidth: 1, borderColor: "#E8DCD9", borderRadius: 12, padding: 13, color: "#2A2020" }, button: { backgroundColor: "#C65E68", padding: 14, borderRadius: 12, alignItems: "center" }, buttonText: { color: "white", fontWeight: "700" }, error: { color: "#B23A48" } })
