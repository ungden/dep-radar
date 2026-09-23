import * as React from "react"
import { Alert, View } from "react-native"
import { applyVoucher, removeVoucher, type BookingItem } from "@/data/bookings"
import { formatDateLong, formatPrice, localDate } from "@/data/format"
import { isUsable, listVouchers } from "@/data/referrals"
import { useAsync } from "@/state/use-async"
import { colors } from "@/theme"
import { Button } from "@/ui/button"
import { Card } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Txt } from "@/ui/text"

/**
 * A 360dep voucher on a booking, before it starts: the customer pays the
 * freelancer the total minus the voucher, and 360dep credits the voucher to
 * the freelancer's wallet when the job is completed. Shown only to a customer
 * who has one (or has one on this booking).
 */
export function VoucherCard({ booking: b, uid, onChanged }: { booking: BookingItem; uid: string; onChanged: () => void }) {
  const vouchers = useAsync(() => listVouchers(uid), [uid, b.voucherId])
  const [busy, setBusy] = React.useState<string | null>(null)

  const act = async (key: string, task: () => ReturnType<typeof removeVoucher>) => {
    setBusy(key)
    const res = await task()
    setBusy(null)
    if (!res.ok) {
      haptic.error()
      return Alert.alert("Chưa thực hiện được", res.error)
    }
    haptic.success()
    onChanged()
  }

  if (b.voucherId && b.discount > 0) {
    return (
      <Card>
        <Txt w={700}>Voucher 360dep −{formatPrice(b.discount)}</Txt>
        <Txt v="meta" color={colors.inkSoft}>
          Bạn trả {b.pro.name} {formatPrice(Math.max(0, b.quote.total - b.discount))}; 360dep trả phần voucher cho người làm khi xong. Lịch không diễn ra thì voucher được trả lại.
        </Txt>
        <Button label="Bỏ voucher" size="sm" variant="secondary" busy={busy === "remove"} onPress={() => void act("remove", () => removeVoucher(b.id))} />
      </Card>
    )
  }

  const usable = (vouchers.value ?? []).filter((v) => isUsable(v))
  if (!usable.length) return null
  const fits = usable.filter((v) => b.quote.total >= v.minTotal)
  const tooSmall = usable.filter((v) => b.quote.total < v.minTotal)

  return (
    <Card>
      <Txt w={700}>Voucher của bạn</Txt>
      {fits.map((v) => (
        <View key={v.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt w={600}>−{formatPrice(Math.min(v.amount, b.quote.total))}</Txt>
            <Txt v="meta" color={colors.muted}>
              Hạn {formatDateLong(localDate(v.expiresAt))}
            </Txt>
          </View>
          <Button label="Dùng" size="sm" busy={busy === v.id} disabled={Boolean(busy)} onPress={() => void act(v.id, () => applyVoucher(b.id, v.id))} />
        </View>
      ))}
      {tooSmall.map((v) => (
        <Txt key={v.id} v="meta" color={colors.muted}>
          Voucher {formatPrice(v.amount)} dùng cho lịch hẹn từ {formatPrice(v.minTotal)}.
        </Txt>
      ))}
    </Card>
  )
}
