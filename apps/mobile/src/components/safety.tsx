import * as React from "react"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { router } from "expo-router"
import { ActionSheetIOS, Alert, Platform, View } from "react-native"
import { REPORT_REASONS, fileReport, removeEvidence } from "@/data/safety"
import { EvidencePicker } from "@/components/evidence"
import { useApp } from "@/state/app"
import { colors, fonts, radius } from "@/theme"
import { Button } from "@/ui/button"
import { ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

interface Target {
  /** The other person's account id (a freelancer's `uuid`); absent for a review, whose author is not shown. */
  accountId?: string | null
  name: string
  bookingId?: string | null
  workId?: string | null
  reviewBookingId?: string | null
  /** After a block: usually leave the screen. */
  onBlocked?: () => void
  /** After a report went through, e.g. to hide what was reported. */
  onReported?: () => void
}

/**
 * "Báo cáo" and "Chặn người này" for a person, from a ⋯ button, or only
 * "Báo cáo" for a review. Returns the function that opens the menu and the
 * report sheet to render once.
 */
export function useSafetyMenu(target: Target | null) {
  const app = useApp()
  const sheet = useSheet()
  const [reason, setReason] = React.useState<string>(REPORT_REASONS[0])
  const [detail, setDetail] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const [evidence, setEvidence] = React.useState<string[]>([])
  const [uploading, setUploading] = React.useState(false)
  // A new picker each time the sheet opens, so it starts empty.
  const [round, setRound] = React.useState(0)

  const report = () => {
    // Files picked for a report that was never sent go before a new one starts.
    if (!sent) void removeEvidence(evidence)
    setReason(REPORT_REASONS[0])
    setDetail("")
    setEvidence([])
    setRound((n) => n + 1)
    setError(null)
    setSent(false)
    sheet.open()
  }

  const confirmBlock = () => {
    const accountId = target?.accountId
    if (!target || !accountId) return
    Alert.alert(`Chặn ${target.name}?`, "Bạn sẽ không thấy hồ sơ, bài đăng và tin nhắn của người này nữa, và 360dep được báo để xem xét. Bỏ chặn được trong Tôi.", [
      { text: "Thôi", style: "cancel" },
      {
        text: "Chặn",
        style: "destructive",
        onPress: async () => {
          const res = await app.block(accountId)
          haptic.success()
          Alert.alert("Đã chặn", res.message)
          target.onBlocked?.()
        },
      },
    ])
  }

  const open = () => {
    if (!target) return
    if (!app.uid) return router.push("/login")
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Báo cáo", "Chặn người này", "Huỷ"], cancelButtonIndex: 2, destructiveButtonIndex: 1, title: target.name },
        (i) => (i === 0 ? report() : i === 1 ? confirmBlock() : undefined),
      )
    } else {
      Alert.alert(target.name, undefined, [
        { text: "Báo cáo", onPress: report },
        { text: "Chặn người này", style: "destructive", onPress: confirmBlock },
        { text: "Huỷ", style: "cancel" },
      ])
    }
  }

  const submit = async () => {
    if (!target) return
    setBusy(true)
    setError(null)
    const res = await fileReport(app.uid, {
      reason,
      detail,
      targetAccountId: target.accountId ?? null,
      bookingId: target.bookingId ?? null,
      workId: target.workId ?? null,
      reviewBookingId: target.reviewBookingId ?? null,
      evidencePaths: evidence,
    })
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    setSent(true)
    target.onReported?.()
  }

  const element = (
    <Sheet
      sheet={sheet}
      title={sent ? "Đã gửi báo cáo" : `Báo cáo ${target?.name ?? ""}`}
      size="tall"
      footer={
        sent ? (
          <Button label="Xong" full onPress={sheet.close} />
        ) : (
          <Button label={uploading ? "Đang tải tệp…" : "Gửi báo cáo"} full busy={busy} disabled={uploading} onPress={() => void submit()} />
        )
      }
    >
      {sent ? (
        <View style={{ gap: 12 }}>
          <Txt color={colors.inkSoft}>Cảm ơn bạn. Đội ngũ 360dep sẽ xem trong 24 giờ và liên hệ nếu cần thêm thông tin.</Txt>
          <Button label="Theo dõi trong Báo cáo của tôi" variant="secondary" onPress={() => {
            sheet.close()
            router.push("/bao-cao")
          }} />
          {target?.accountId ? (
            <Button label={`Chặn ${target.name}`} variant="danger" onPress={() => {
              sheet.close()
              confirmBlock()
            }} />
          ) : null}
        </View>
      ) : (
        <>
          <Txt color={colors.inkSoft}>Báo cáo được gửi riêng cho 360dep, người kia không biết ai báo cáo.</Txt>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            {REPORT_REASONS.map((r) => {
              const selected = r === reason
              return (
                <Press
                  key={r}
                  haptic="select"
                  onPress={() => setReason(r)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.accent : colors.line,
                    backgroundColor: selected ? colors.accentSoft : colors.surface,
                  }}
                >
                  <Txt w={selected ? 700 : 500} style={{ flex: 1 }}>
                    {r}
                  </Txt>
                  {selected ? <Icon name="check" size={16} color={colors.accent} /> : null}
                </Press>
              )
            })}
          </View>
          <BottomSheetTextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="Kể lại chuyện gì đã xảy ra: lúc nào, ở đâu"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            style={{ minHeight: 96, backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
            accessibilityLabel="Chi tiết báo cáo"
          />
          <Txt w={600}>Ảnh, clip làm bằng chứng (nếu có)</Txt>
          {app.uid ? <EvidencePicker key={round} uid={app.uid} onChange={setEvidence} onBusyChange={setUploading} /> : null}
          {error ? <ErrorNote text={error} /> : null}
        </>
      )}
    </Sheet>
  )

  return { open, report, confirmBlock, element }
}
