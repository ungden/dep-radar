import { Image } from "expo-image"
import * as WebBrowser from "expo-web-browser"
import { Share, View } from "react-native"
import { formatPrice } from "@/data/format"
import { webLink } from "@/data/links"
import { feeMemo, feeQrUrl, loadFee, owes, type FeeInfo } from "@/data/wallet"
import { useAsync } from "@/state/use-async"
import { colors, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, Line } from "@/ui/bits"
import { Txt } from "@/ui/text"

/** The freelancer's wallet, read on focus. `enabled` false skips the read (a customer, or nothing to accept). */
export function useFee(uid: string | null, enabled = true) {
  const fee = useAsync(uid && enabled ? () => loadFee(uid) : null, [uid, enabled])
  return { ...fee, owing: owes(fee.value) }
}

/** Why "Nhận lịch" / "Nhận việc" is off while a fee is owed. */
export const OWING_NOTE = "Thanh toán phí của đơn trước để nhận đơn mới."

/**
 * Shown while the wallet is below zero: the fee of the last completed job,
 * and how to pay it. A transfer with the memo "NAP <code>" is credited by
 * 360dep (staff or the bank's notice) and accepting works again by itself.
 * Nothing is shown when nothing is owed.
 */
export function FeeCard({ fee }: { fee: FeeInfo | undefined }) {
  if (!fee || !owes(fee)) return null
  const amount = -fee.balance
  const memo = feeMemo(fee)
  const qr = feeQrUrl(fee)
  return (
    <Card style={{ backgroundColor: colors.warningSoft, gap: 10 }}>
      <Txt v="lead" w={800} color={colors.warning}>
        Thanh toán phí {formatPrice(amount)} để nhận đơn tiếp
      </Txt>
      <Txt v="meta" color={colors.warning}>
        Phí 360dep của lịch hẹn đã hoàn thành. Chưa thanh toán thì bạn chưa nhận được lịch hay việc mới; ví cập nhật khi 360dep nhận được tiền.
      </Txt>
      {fee.bank && memo ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 4 }}>
          {qr ? (
            <Image
              source={{ uri: qr }}
              style={{ width: 220, height: 260, alignSelf: "center", marginBottom: 6 }}
              contentFit="contain"
              accessibilityLabel={`Mã QR chuyển ${formatPrice(amount)}, nội dung ${memo}`}
            />
          ) : null}
          <Line label="Số tiền" value={formatPrice(amount)} strong />
          <Line label="Số tài khoản" value={fee.bank.accountNo} />
          {fee.bank.accountName ? <Line label="Chủ tài khoản" value={fee.bank.accountName} /> : null}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 4 }}>
            <Txt color={colors.inkSoft}>Nội dung</Txt>
            <Txt w={800} selectable tabular>
              {memo}
            </Txt>
          </View>
          <Txt v="meta" color={colors.muted}>
            Ghi đúng nội dung để tiền vào ví của bạn. Giữ vào nội dung để sao chép.
          </Txt>
          <Button label="Chia sẻ nội dung" icon="send" size="sm" variant="secondary" onPress={() => void Share.share({ message: memo })} />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Txt v="meta" color={colors.warning}>
            Nhân viên 360dep sẽ liên hệ hướng dẫn chuyển khoản.
            {memo ? ` Khi chuyển, ghi nội dung: ${memo}.` : ""}
          </Txt>
          <Button label="Liên hệ hỗ trợ" size="sm" variant="secondary" onPress={() => void WebBrowser.openBrowserAsync(webLink("/tro-giup"))} />
        </View>
      )}
      <Button label="Xem ví (mở trên web)" icon="external" size="sm" variant="ghost" onPress={() => void WebBrowser.openBrowserAsync(webLink("/studio/wallet"))} />
    </Card>
  )
}
