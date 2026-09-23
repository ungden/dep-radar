import * as React from "react"
import { router } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, TextInput, View } from "react-native"
import { formatDateLong, formatPrice, localDate } from "@/data/format"
import { claimReferral, isUsable, loadReferral, referralLink, type ReferralReward, type ReferralSettings, type Voucher } from "@/data/referrals"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, Divider, EmptyState, ErrorNote, Line, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/**
 * Giới thiệu bạn bè: the caller's code, how the reward works (amounts from
 * platform_settings, never written into the app), what they have earned, their
 * vouchers, and for a new account the box to enter a friend's code.
 */
export default function Referral() {
  const app = useApp()
  const info = useAsync(app.uid ? () => loadReferral(app.uid!) : null, [app.uid])
  const [code, setCode] = React.useState("")
  const [claiming, setClaiming] = React.useState(false)

  if (!app.uid) return <EmptyState title="Cần đăng nhập" text="Đăng nhập để lấy mã giới thiệu của bạn." action="Đăng nhập" onAction={() => router.push("/login")} />
  if (info.loading && !info.value)
    return (
      <View style={{ padding: gutter, gap: 12 }}>
        <Skeleton style={{ height: 120, borderRadius: radius.md }} />
        <Skeleton style={{ height: 180, borderRadius: radius.md }} />
      </View>
    )
  if (info.error || !info.value)
    return (
      <View style={{ padding: gutter }}>
        <ErrorNote text={info.error ?? "Không tải được chương trình giới thiệu."} onRetry={() => void info.reload()} />
      </View>
    )

  const r = info.value
  const s = r.settings
  const enabled = Boolean(s?.enabled)

  const share = async () => {
    if (!r.code || !s) return
    const link = referralLink(r.code)
    // The link is in the message; passing it as `url` too makes iOS show it twice.
    await Share.share({
      message: `Mình đặt làm đẹp, chụp ảnh qua 360dep. Nhập mã ${r.code} khi đăng ký, lần đầu dùng dịch vụ từ ${formatPrice(s.minTotal)} cả hai được voucher ${formatPrice(s.customerAmount)}: ${link}`,
    }).catch(() => {})
  }

  const claim = async () => {
    setClaiming(true)
    const res = await claimReferral(code)
    setClaiming(false)
    if (!res.ok) {
      haptic.error()
      return Alert.alert("Chưa nhập được mã", res.error)
    }
    haptic.success()
    setCode("")
    Alert.alert("Đã nhập mã", `Bạn được ${res.data} giới thiệu. Khi bạn dùng dịch vụ lần đầu, cả hai nhận ưu đãi.`)
    void info.reload()
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <ScrollView
        contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl(info.refreshing, () => void info.refresh())}
      >
        {!s ? (
          <Card>
            <Txt w={700}>Chương trình giới thiệu chưa sẵn sàng</Txt>
            <Txt color={colors.inkSoft}>Bạn thử lại sau nhé.</Txt>
          </Card>
        ) : !enabled ? (
          <Card style={{ backgroundColor: colors.warningSoft }}>
            <Txt w={700} color={colors.warning}>
              Chương trình giới thiệu đang tạm dừng
            </Txt>
            <Txt v="meta" color={colors.warning}>
              Voucher bạn đã nhận vẫn dùng được tới hạn.
            </Txt>
          </Card>
        ) : (
          <>
            <Card style={{ alignItems: "center", paddingVertical: 20 }}>
              <Txt v="meta" color={colors.inkSoft}>
                Mã giới thiệu của bạn
              </Txt>
              {r.code ? (
                <Txt v="h1" selectable accessibilityLabel={`Mã ${r.code.split("").join(" ")}`} style={{ letterSpacing: 4 }}>
                  {r.code}
                </Txt>
              ) : (
                <Txt color={colors.muted}>Chưa lấy được mã. Kéo xuống để thử lại.</Txt>
              )}
              {r.code ? <Button label="Chia sẻ cho bạn bè" icon="send" onPress={() => void share()} style={{ alignSelf: "center", marginTop: 4 }} /> : null}
            </Card>
            <Rules s={s} />
          </>
        )}

        {enabled && r.canClaim ? (
          <Card>
            <Txt w={700}>Bạn được bạn bè giới thiệu?</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              Nhập mã của họ trong 30 ngày đầu, trước lần đầu dùng dịch vụ. Chỉ nhập được một lần.
            </Txt>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="Mã 6 ký tự"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Mã giới thiệu của bạn bè"
                style={{ flex: 1, height: 46, backgroundColor: colors.subtle, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts[600], fontSize: 16, letterSpacing: 2, color: colors.ink }}
              />
              <Button label="Nhập mã" disabled={code.length !== 6} busy={claiming} onPress={() => void claim()} />
            </View>
          </Card>
        ) : null}
        {r.claimed ? (
          <Txt v="meta" color={colors.muted} center>
            Bạn đã nhập mã giới thiệu của một người bạn.
          </Txt>
        ) : null}

        <View style={{ gap: 8 }}>
          <Txt v="title">Phần thưởng</Txt>
          {r.rewards.length ? (
            <Card style={{ gap: 0, paddingVertical: 4 }}>
              {r.rewards.map((w, i) => (
                <React.Fragment key={`${w.createdAt}-${i}`}>
                  {i ? <Divider /> : null}
                  <RewardRow reward={w} isPro={Boolean(app.myPro)} />
                </React.Fragment>
              ))}
            </Card>
          ) : (
            <Txt color={colors.inkSoft}>Chưa có phần thưởng nào. Phần thưởng đến khi bạn bè dùng dịch vụ, không phải khi họ đăng ký.</Txt>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Txt v="title">Voucher của bạn</Txt>
          {r.vouchers.length ? (
            <Card style={{ gap: 0, paddingVertical: 4 }}>
              {[...r.vouchers]
                .sort((a, b) => Number(isUsable(b)) - Number(isUsable(a)))
                .map((v, i) => (
                  <React.Fragment key={v.id}>
                    {i ? <Divider /> : null}
                    <VoucherRow voucher={v} />
                  </React.Fragment>
                ))}
            </Card>
          ) : (
            <Txt color={colors.inkSoft}>Chưa có voucher.</Txt>
          )}
          {r.vouchers.some((v) => isUsable(v)) ? (
            <Txt v="meta" color={colors.muted}>
              Chọn voucher trong trang lịch hẹn, trước giờ hẹn. Bạn trả người làm số tiền đã trừ voucher; 360dep trả phần voucher cho người làm.
            </Txt>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Rules({ s }: { s: ReferralSettings }) {
  return (
    <Card>
      <Txt w={700}>Cách nhận thưởng</Txt>
      <Rule n={1} text="Bạn bè đăng ký 360dep và nhập mã của bạn trong 30 ngày đầu." />
      <Rule
        n={2}
        text={`Khi họ hoàn thành lịch hẹn đầu tiên từ ${formatPrice(s.minTotal)} (với người làm khác bạn), cả hai nhận voucher ${formatPrice(s.customerAmount)}, dùng trong ${s.voucherDays} ngày.`}
      />
      <Rule
        n={3}
        text={`Bạn bè là người làm: khi họ xong 3 job cho 3 khách khác nhau, cả hai nhận ${formatPrice(s.proAmount)}, cộng vào ví nếu là người làm, hoặc thành voucher.`}
      />
      <Txt v="meta" color={colors.muted}>
        Mỗi người bạn được tính một lần, trong 90 ngày kể từ khi nhập mã. Mỗi tháng nhận tối đa {s.monthlyCap} phần thưởng giới thiệu. Voucher dùng cho lịch hẹn từ {formatPrice(s.minTotal)}.
      </Txt>
    </Card>
  )
}

function Rule({ n, text }: { n: number; text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.subtle, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
        <Txt v="meta" w={700}>
          {n}
        </Txt>
      </View>
      <Txt color={colors.inkSoft} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  )
}

function RewardRow({ reward: w, isPro }: { reward: ReferralReward; isPro: boolean }) {
  const label = w.asReferrer
    ? w.kind === "pro"
      ? "Người làm bạn giới thiệu đã xong 3 job"
      : "Bạn bè bạn giới thiệu đã dùng dịch vụ lần đầu"
    : w.kind === "pro"
      ? "Quà giới thiệu: bạn đã xong 3 job đầu tiên"
      : "Quà cho lần đầu dùng 360dep qua lời giới thiệu"
  // A freelancer's "3 jobs" reward goes to the wallet; everything else is a voucher.
  const form = w.kind === "pro" && isPro ? "cộng vào ví" : "voucher"
  return (
    <View style={{ paddingVertical: 10, gap: 2 }}>
      <Line label={label} value={`+${formatPrice(w.amount)}`} />
      <Txt v="meta" color={colors.muted}>
        {formatDateLong(localDate(w.createdAt))} · {form}
      </Txt>
    </View>
  )
}

function VoucherRow({ voucher: v }: { voucher: Voucher }) {
  const now = Date.now()
  const status = v.usedAt
    ? "Đã dùng"
    : v.bookingId
      ? "Đang dùng cho một lịch hẹn"
      : Date.parse(v.expiresAt) <= now
        ? "Hết hạn"
        : `Hạn ${formatDateLong(localDate(v.expiresAt))} · lịch từ ${formatPrice(v.minTotal)}`
  const usable = isUsable(v, now)
  return (
    <View style={{ paddingVertical: 10, gap: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Txt w={700} color={usable ? colors.ink : colors.muted}>
          Voucher {formatPrice(v.amount)}
        </Txt>
        {v.bookingId && !v.usedAt ? (
          <Txt v="meta" w={600} color={colors.accent} onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: v.bookingId! } })}>
            Xem lịch hẹn
          </Txt>
        ) : null}
      </View>
      <Txt v="meta" color={colors.muted}>
        {status}
      </Txt>
      {v.note ? (
        <Txt v="meta" color={colors.inkSoft}>
          {v.note}
        </Txt>
      ) : null}
    </View>
  )
}
