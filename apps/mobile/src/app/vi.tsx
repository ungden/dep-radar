import * as React from "react"
import { Image } from "expo-image"
import { File, Paths } from "expo-file-system"
import { Asset, requestPermissionsAsync } from "expo-media-library"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { Alert, Clipboard, ScrollView, View } from "react-native"
import { formatPrice, localDate } from "@/data/format"
import {
  feeMemo,
  feeQrUrl,
  loadFee,
  loadPayoutAccount,
  loadWalletEntries,
  owes,
  savePayoutAccount,
  walletLabel,
  type PayoutAccount,
} from "@/data/wallet"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, hairline, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, EmptyState, ErrorNote, Line, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"
import { useToast } from "@/ui/toast"

const day = (iso: string) => localDate(iso).split("-").reverse().slice(0, 2).join("/")

/**
 * The partner's wallet, in the app: what is owed and how to pay it (QR with
 * the amount and memo filled in), what came in and out, and the account
 * 360đẹp pays them back to. Replaces /studio/wallet on the web for the app.
 */
export default function Wallet() {
  const app = useApp()
  const uid = app.uid
  const fee = useAsync(uid ? () => loadFee(uid) : null, [uid])
  const entries = useAsync(uid ? () => loadWalletEntries(uid) : null, [uid])
  const payout = useAsync(uid ? () => loadPayoutAccount(uid) : null, [uid])
  const toast = useToast(40)
  const [saving, setSaving] = React.useState(false)

  if (!uid || !app.myPro) return <EmptyState title="Ví dành cho đối tác" text="Mở hồ sơ đối tác để có ví." />

  const wallet = fee.value
  const owing = owes(wallet)
  const memo = wallet ? feeMemo(wallet) : null
  const qr = wallet ? feeQrUrl(wallet) : null

  const saveQr = async () => {
    if (!qr) return
    setSaving(true)
    try {
      const permission = await requestPermissionsAsync(true, ["photo"])
      if (!permission.granted) return Alert.alert("Cần quyền lưu ảnh", "Cho phép 360đẹp thêm ảnh vào thư viện trong Cài đặt.")
      const file = await File.downloadFileAsync(qr, new File(Paths.cache, `360dep-phi-${Date.now()}.png`), { idempotent: true })
      await Asset.create(file.uri)
      haptic.success()
      toast.show("Đã lưu mã QR. Mở app ngân hàng, chọn quét ảnh.")
    } catch {
      Alert.alert("Chưa lưu được", "Kiểm tra mạng rồi thử lại nhé.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: gutter, gap: 24, paddingBottom: 48 }}
        refreshControl={refreshControl(fee.refreshing || entries.refreshing, () => {
          void fee.refresh()
          void entries.refresh()
        })}
      >
        {fee.error ? <ErrorNote text={fee.error} onRetry={() => void fee.reload()} /> : null}
        {fee.loading && !wallet ? <Skeleton style={{ height: 120, borderRadius: radius.lg }} /> : null}

        {wallet ? (
          owing ? (
            <Card style={{ backgroundColor: colors.warningSoft }}>
              <Txt v="title" color={colors.warning}>
                Phí cần chuyển: {formatPrice(-wallet.balance)}
              </Txt>
              <Txt color={colors.warning}>Chuyển xong là nhận đơn tiếp được ngay.</Txt>
            </Card>
          ) : (
            <Card>
              <Txt v="meta" color={colors.muted}>
                Số dư ví
              </Txt>
              <Txt v="hero" tabular>
                {formatPrice(wallet.balance)}
              </Txt>
              <Txt v="meta" color={colors.inkSoft}>
                Không nợ phí. Phí mỗi đơn trừ vào đây khi bạn bấm Hoàn thành.
              </Txt>
            </Card>
          )
        ) : null}

        {wallet ? (
          <Card style={{ gap: 12 }}>
            <Txt v="title">{owing ? "Chuyển khoản" : "Nạp trước vào ví"}</Txt>
            {wallet.bank && memo ? (
              <>
                {qr ? (
                  <Image source={{ uri: qr }} style={{ width: 220, height: 260, alignSelf: "center" }} contentFit="contain" accessibilityLabel={`Mã QR chuyển ${formatPrice(-wallet.balance)}, nội dung ${memo}`} />
                ) : null}
                {owing ? <Line label="Số tiền" value={formatPrice(-wallet.balance)} strong /> : null}
                <Line label="Chủ tài khoản" value={wallet.bank.accountName || "360đẹp"} />
                <Line label="Số tài khoản" value={wallet.bank.accountNo} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 4 }}>
                  <Txt color={colors.inkSoft}>Nội dung</Txt>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Txt w={800} selectable tabular>
                      {memo}
                    </Txt>
                    <Press onPress={() => { Clipboard.setString(memo); haptic.success(); toast.show("Đã chép nội dung chuyển khoản") }} accessibilityLabel={`Sao chép nội dung ${memo}`} style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: colors.accentSoft, justifyContent: "center" }}>
                      <Txt v="meta" w={700} color={colors.accentDark}>
                        Sao chép
                      </Txt>
                    </Press>
                  </View>
                </View>
                {!owing ? (
                  <Txt v="meta" color={colors.muted}>
                    Chuyển số tiền bạn muốn với nội dung trên. Tiền nạp trước dùng để trả phí các đơn sau.
                  </Txt>
                ) : null}
                {qr ? <Button label="Lưu mã QR" icon="download" variant="secondary" full busy={saving} onPress={() => void saveQr()} /> : null}
              </>
            ) : (
              <Txt color={colors.inkSoft}>
                360đẹp chưa đặt tài khoản nhận phí. Nhân viên sẽ liên hệ hướng dẫn.{memo ? ` Khi chuyển, ghi nội dung: ${memo}.` : ""}
              </Txt>
            )}
          </Card>
        ) : null}

        {wallet ? (
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: -8 }}>
            <Icon name="clock" size={16} color={colors.muted} />
            <Txt v="meta" color={colors.muted} style={{ flex: 1 }}>
              Ví tự cập nhật sau 1–2 phút khi ghi đúng nội dung. Không cần gửi ảnh chụp. Kéo xuống để tải lại.
            </Txt>
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          <Txt v="title">Lịch sử</Txt>
          {entries.error ? <ErrorNote text={entries.error} onRetry={() => void entries.reload()} /> : null}
          {entries.loading && !entries.value ? <Skeleton style={{ height: 160, borderRadius: radius.lg }} /> : null}
          {entries.value && !entries.value.length ? <Txt color={colors.inkSoft}>Chưa có khoản nào.</Txt> : null}
          {entries.value?.length ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 18 }}>
              {entries.value.map((e, i) => (
                <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderTopWidth: i ? hairline : 0, borderTopColor: colors.line }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt w={600} numberOfLines={2}>
                      {walletLabel(e)}
                    </Txt>
                    <Txt v="meta" color={colors.muted}>
                      {day(e.createdAt)}
                    </Txt>
                  </View>
                  <Txt w={700} tabular color={e.amount > 0 ? colors.success : colors.ink}>
                    {e.amount > 0 ? "+" : "−"}
                    {formatPrice(Math.abs(e.amount))}
                  </Txt>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <PayoutRow uid={uid} account={payout.value ?? null} loading={payout.loading} onSaved={() => { void payout.reload(); toast.show("Đã lưu tài khoản nhận tiền") }} />
      </ScrollView>
      {toast.element}
    </View>
  )
}

/** The account 360đẹp pays the partner back to (voucher refunds, QR payouts). */
function PayoutRow({ uid, account, loading, onSaved }: { uid: string; account: PayoutAccount | null; loading: boolean; onSaved: () => void }) {
  const sheet = useSheet()
  const [form, setForm] = React.useState<PayoutAccount>({ bankName: "", accountNumber: "", accountHolder: "" })
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const open = () => {
    setForm(account ?? { bankName: "", accountNumber: "", accountHolder: "" })
    setError(null)
    sheet.open()
  }
  const input = { minHeight: 52, backgroundColor: colors.subtle, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts[400], fontSize: 17, color: colors.ink }
  return (
    <>
      <Press onPress={open} accessibilityLabel="Tài khoản nhận tiền của bạn" style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt w={700}>Tài khoản nhận tiền của bạn</Txt>
          <Txt v="meta" color={colors.inkSoft}>
            {loading ? "Đang tải…" : account ? `${account.bankName} · ${account.accountNumber.replace(/.(?=.{4})/g, "•")}` : "Chưa có · Thêm"}
          </Txt>
        </View>
        <Icon name="right" size={14} color={colors.muted} />
      </Press>
      <Sheet
        sheet={sheet}
        title="Tài khoản nhận tiền"
        size="tall"
        footer={
          <Button
            label="Lưu tài khoản"
            full
            busy={busy}
            onPress={async () => {
              setBusy(true)
              const res = await savePayoutAccount(uid, form)
              setBusy(false)
              if (!res.ok) return setError(res.error)
              haptic.success()
              sheet.close()
              onSaved()
            }}
          />
        }
      >
        <Txt color={colors.inkSoft}>360đẹp chuyển tiền bù voucher và tiền khách trả qua QR về tài khoản này.</Txt>
        <BottomSheetTextInput value={form.bankName} onChangeText={(bankName) => setForm((f) => ({ ...f, bankName }))} placeholder="Ngân hàng (vd. Vietcombank)" placeholderTextColor={colors.muted} style={input} />
        <BottomSheetTextInput value={form.accountNumber} onChangeText={(accountNumber) => setForm((f) => ({ ...f, accountNumber }))} placeholder="Số tài khoản" keyboardType="number-pad" placeholderTextColor={colors.muted} style={input} />
        <BottomSheetTextInput value={form.accountHolder} onChangeText={(accountHolder) => setForm((f) => ({ ...f, accountHolder }))} placeholder="Tên chủ tài khoản" autoCapitalize="characters" placeholderTextColor={colors.muted} style={input} />
        {error ? <Txt v="meta" color={colors.danger}>{error}</Txt> : null}
      </Sheet>
    </>
  )
}
