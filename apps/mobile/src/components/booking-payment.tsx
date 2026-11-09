import * as React from "react"
import { Alert, StyleSheet, TextInput, View } from "react-native"
import { Image } from "expo-image"
import { bookingQrPath, type BookingCheckout } from "@/shared"
import { formatPrice } from "@/data/format"
import { webLink } from "@/data/links"
import { rpcOptional } from "@/data/supabase"
import { colors, fonts, radius } from "@/theme"
import { Card } from "@/ui/bits"
import { Button } from "@/ui/button"
import { Txt } from "@/ui/text"

export function BookingPayment({ id, customer, status, paid }: { id: string; customer: boolean; status: string; paid: boolean }) {
  const [data, setData] = React.useState<BookingCheckout | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [bank, setBank] = React.useState("")
  const [account, setAccount] = React.useState("")
  const [holder, setHolder] = React.useState("")
  const read = React.useCallback(() => rpcOptional<BookingCheckout>("booking_checkout", { p_booking: id, p_action: "read" }), [id])

  React.useEffect(() => {
    let current = true
    void read().then((r) => { if (current && r.ok) setData(r.data) })
    return () => { current = false }
  }, [read, status, paid])

  const invoice = data?.invoice
  React.useEffect(() => {
    if (!invoice?.payable) return
    let current = true
    const timer = setInterval(() => {
      void read().then((r) => { if (current && r.ok) setData(r.data) })
    }, 8000)
    return () => { current = false; clearInterval(timer) }
  }, [invoice?.payable, read])

  if (!data || (!invoice && !data.canIssue && !data.cashout)) return null
  async function run(action: "issue" | "cancel" | "read" | "cashout") {
    setBusy(true)
    try {
      if (action === "cashout") {
        const r = await rpcOptional("request_booking_cashout", { p_booking: id, p_bank: bank, p_account: account, p_holder: holder })
        if (!r.ok) { Alert.alert("Chưa gửi được yêu cầu", r.error); return }
      }
      const next = action === "cashout" ? await read() : await rpcOptional<BookingCheckout>("booking_checkout", { p_booking: id, p_action: action })
      if (next.ok) setData(next.data)
      else Alert.alert("Chưa xử lý được", next.error)
    } catch { Alert.alert("Mất kết nối", "Vui lòng thử lại.") }
    finally { setBusy(false) }
  }
  return <Card style={{ gap: 10 }}>
    <Txt v="title">Thanh toán QR</Txt>
    {invoice?.paidAt ? <Txt color={colors.success}>Đã nhận {formatPrice(invoice.amount)} qua QR.</Txt>
    : invoice?.payable ? customer ? <View style={{ gap: 8 }}>
      <Image source={{ uri: webLink(bookingQrPath(invoice)) }} accessibilityLabel="Mã QR thanh toán lịch hẹn"
        style={{ width: 208, height: 208, alignSelf: "center", backgroundColor: "white", borderRadius: radius.md }} contentFit="contain" cachePolicy="none" />
      <Txt v="title" center>{formatPrice(invoice.amount)}</Txt>
      <Txt selectable v="meta">Tài khoản {invoice.account} · {invoice.holder}</Txt>
      <Txt selectable v="meta">Nội dung: {invoice.memo}. Chuyển đúng số tiền trước {new Date(invoice.expiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}.</Txt>
    </View> : <Txt v="meta">Khách chọn QR. Chờ báo đã nhận tiền trước khi làm hoặc để khách huỷ QR và trả trực tiếp.</Txt>
    : invoice ? <Txt v="meta">QR đã hết hạn. Nếu đã chuyển, liên hệ hỗ trợ để đối soát trước khi trả thêm.</Txt>
    : <Button label="Tạo QR thanh toán" onPress={() => void run("issue")} busy={busy} />}
    {customer && invoice && !invoice.paidAt ? <View style={{ gap: 8 }}>
      <Button label="Kiểm tra giao dịch" variant="secondary" onPress={() => void run("read")} disabled={busy} />
      <Button label="Huỷ QR chưa trả" variant="secondary" disabled={busy} onPress={() => Alert.alert("Huỷ QR?", "Chỉ huỷ nếu bạn chưa chuyển tiền.", [
        { text: "Giữ QR", style: "cancel" }, { text: "Huỷ QR", onPress: () => void run("cancel") },
      ])} />
    </View> : null}
    {data.cashout ? <Txt v="meta">Khoản {data.cashout.kind === "refund" ? "hoàn" : "chi"} {formatPrice(data.cashout.amount)}: {
      data.cashout.state === "sent" ? "đã ghi nhận chuyển" : data.cashout.state === "processing" ? "đang xử lý" : "đã gửi yêu cầu"}.</Txt>
    : data.refundDue ? <View style={{ gap: 8 }}>
      <TextInput style={styles.input} accessibilityLabel="Ngân hàng nhận hoàn" placeholder="Ngân hàng nhận hoàn" value={bank} onChangeText={setBank} />
      <TextInput style={styles.input} accessibilityLabel="Số tài khoản" placeholder="Số tài khoản" keyboardType="number-pad" value={account} onChangeText={setAccount} />
      <TextInput style={styles.input} accessibilityLabel="Chủ tài khoản" placeholder="Chủ tài khoản" value={holder} onChangeText={setHolder} />
      <Button label="Yêu cầu hoàn tiền" onPress={() => void run("cashout")} busy={busy} disabled={bank.trim().length < 2 || !/^\d{6,20}$/.test(account.trim()) || holder.trim().length < 2} />
    </View> : data.artistDue ? <Button label="Yêu cầu chi về tài khoản đã lưu" variant="secondary" onPress={() => void run("cashout")} busy={busy} /> : null}
  </Card>
}
const styles = StyleSheet.create({
  input: { minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, fontFamily: fonts[400], color: colors.ink, fontSize: 17 },
})
