import { router } from "expo-router"
import { View } from "react-native"
import { formatPrice } from "@/data/format"
import { loadFee, owes, type FeeInfo } from "@/data/wallet"
import { useAsync } from "@/state/use-async"
import { colors, radius } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** The freelancer's wallet, read on focus. `enabled` false skips the read (a customer, or nothing to accept). */
export function useFee(uid: string | null, enabled = true) {
  const fee = useAsync(uid && enabled ? () => loadFee(uid) : null, [uid, enabled])
  return { ...fee, owing: owes(fee.value) }
}

/** Why "Nhận lịch" / "Nhận việc" is off while a fee is owed. */
export const OWING_NOTE = "Thanh toán phí của đơn trước để nhận đơn mới."

/**
 * Shown while the wallet is below zero: one line with what is owed and the
 * way to pay it. The QR, memo and history live on the wallet screen (/vi),
 * so a list or a booking is not pushed down by a bank form. Nothing is shown
 * when nothing is owed.
 */
export function FeeCard({ fee }: { fee: FeeInfo | undefined }) {
  if (!fee || !owes(fee)) return null
  return (
    <Press
      onPress={() => router.push("/vi")}
      accessibilityRole="button"
      accessibilityLabel={`Phí cần chuyển ${formatPrice(-fee.balance)}. Trả phí`}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: 16 }}
    >
      <Icon name="wallet" size={22} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Txt w={700} color={colors.warning}>
          Phí cần chuyển {formatPrice(-fee.balance)}
        </Txt>
        <Txt v="meta" color={colors.warning}>
          Chuyển xong mới nhận được đơn mới.
        </Txt>
      </View>
      <View style={{ minHeight: 38, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: colors.surface, justifyContent: "center" }}>
        <Txt v="meta" w={700} color={colors.accentDark}>
          Trả phí
        </Txt>
      </View>
    </Press>
  )
}
