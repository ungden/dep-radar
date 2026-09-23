import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { categoryLabel } from "@/shared"
import { APPLICATION_LABEL, applyCasting, compensationLabel, getCasting, withdrawApplication } from "@/data/castings"
import { formatDateLong } from "@/data/format"
import { useSafetyMenu } from "@/components/safety"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Avatar, Card, EmptyState, ErrorNote, Skeleton, VerifiedMark } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const SAFETY = [
  "Người tuyển không bao giờ được yêu cầu bạn chuyển tiền: không cọc, không phí hồ sơ.",
  "Tin có thù lao và tin tuyển mẫu ảnh chỉ mở cho người đã xác minh danh tính.",
  "360dep không nhận tin chụp nội y, khoả thân hay nội dung nhạy cảm.",
  "Gặp ở nơi công khai hoặc studio có địa chỉ; báo người thân lịch của bạn.",
]

/** One casting call: what, when, where, what the model gets, and "Ứng tuyển" (apply_casting). */
export default function CastingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardVisible()
  const casting = useAsync(() => getCasting(app.uid, id), [app.uid, id])
  const [message, setMessage] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const c = casting.value
  const safety = useSafetyMenu(c && !c.mine ? { accountId: c.proUuid, name: c.pro.name, onBlocked: () => router.back() } : null)

  if (casting.loading && !c)
    return (
      <View style={{ padding: gutter, gap: 12 }}>
        <Skeleton style={{ height: 180, borderRadius: radius.lg }} />
        <Skeleton style={{ height: 120, borderRadius: radius.lg }} />
      </View>
    )
  if (casting.error) return <View style={{ padding: gutter }}><ErrorNote text={casting.error} onRetry={() => void casting.reload()} /></View>
  if (!c || app.blocked.has(c.proUuid)) return <EmptyState title="Không tìm thấy tin tuyển mẫu" text="Có thể tin đã đóng." action="Xem tin khác" onAction={() => router.replace("/tuyen-mau")} />

  const left = Math.max(0, c.slots - c.acceptedCount)
  const application = c.myApplication && c.myApplication.status !== "withdrawn" ? c.myApplication : null

  const apply = async () => {
    setBusy(true)
    setError(null)
    const res = await applyCasting(c.id, message.trim())
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    setMessage("")
    void casting.reload()
  }

  const withdraw = () =>
    application &&
    Alert.alert("Rút ứng tuyển?", undefined, [
      { text: "Thôi", style: "cancel" },
      {
        text: "Rút",
        style: "destructive",
        onPress: async () => {
          const res = await withdrawApplication(application.id)
          if (!res.ok) return Alert.alert("Chưa rút được", res.error)
          void casting.reload()
        },
      },
    ])

  const canApply = !c.mine && !application && c.status === "open" && left > 0

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={insets.top + 44}>
      <Stack.Screen options={{ title: "Tuyển mẫu", headerRight: () => (c.mine ? null : <IconButton name="more" label="Báo cáo hoặc chặn" onPress={safety.open} />) }} />
      {safety.element}
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View style={{ backgroundColor: colors.subtle, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Txt v="meta" w={600} color={colors.inkSoft}>
                {categoryLabel(c.category)}
              </Txt>
            </View>
            <View style={{ backgroundColor: c.compensation === "paid" ? colors.successSoft : colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Txt v="meta" w={700} color={c.compensation === "paid" ? colors.success : colors.accentDark}>
                {compensationLabel(c)}
              </Txt>
            </View>
          </View>
          <Txt v="h2">{c.title}</Txt>
          {c.description ? <Txt color={colors.inkSoft}>{c.description}</Txt> : null}
        </View>

        <Card>
          <Fact icon="calendar" text={`${formatDateLong(c.date)} · ${c.time}`} />
          <Fact icon="pin" text={`${c.district}, ${c.city}`} />
          <Fact icon="person" text={c.status === "open" ? `Cần ${c.slots} mẫu, còn ${left} chỗ` : "Đã đóng"} />
        </Card>

        <Press
          onPress={() => router.push({ pathname: "/pros/[id]", params: { id: c.pro.slug || c.proUuid } })}
          accessibilityLabel={`Xem hồ sơ ${c.pro.name}`}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 }}
        >
          <Avatar name={c.pro.name} uri={c.pro.avatar} size={44} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Txt w={700} numberOfLines={1} style={{ flexShrink: 1 }}>
                {c.pro.name}
              </Txt>
              {c.pro.verified ? <VerifiedMark /> : null}
            </View>
            {c.pro.title ? (
              <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
                {c.pro.title}
              </Txt>
            ) : null}
          </View>
          <Icon name="right" size={14} color={colors.muted} />
        </Press>

        <View style={{ backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, gap: 6 }}>
          <Txt w={700}>Làm mẫu an toàn</Txt>
          {SAFETY.map((s) => (
            <Txt key={s} v="meta" color={colors.inkSoft}>
              • {s}
            </Txt>
          ))}
        </View>

        {application ? (
          <Card>
            <Txt v="meta" color={colors.muted}>
              Trạng thái
            </Txt>
            <Txt v="lead" w={700} color={application.status === "accepted" ? colors.success : colors.ink}>
              {APPLICATION_LABEL[application.status]}
            </Txt>
            {application.status === "accepted" ? <Button label="Mở tin nhắn" icon="chat" onPress={() => router.push("/tin-nhan")} /> : null}
            {application.status === "pending" ? <Button label="Rút ứng tuyển" variant="secondary" size="sm" onPress={withdraw} /> : null}
          </Card>
        ) : c.mine ? (
          <Txt color={colors.inkSoft}>Đây là tin của bạn. Xem người ứng tuyển trong Studio trên web.</Txt>
        ) : !canApply ? (
          <Txt w={700}>Tin đã đủ người hoặc đã đóng.</Txt>
        ) : app.uid ? (
          <View style={{ gap: 8 }}>
            <Txt w={700}>Lời nhắn cho {c.pro.name}</Txt>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              placeholder="VD: Mình rảnh cả buổi, móng tay khoẻ, chưa làm gel 2 tuần nay."
              placeholderTextColor={colors.muted}
              accessibilityLabel={`Lời nhắn cho ${c.pro.name}`}
              style={{ minHeight: 96, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
            />
            <Txt v="meta" color={colors.muted}>
              Người tuyển sẽ thấy tên và lời nhắn của bạn.
            </Txt>
          </View>
        ) : null}
        {error ? <ErrorNote text={error} /> : null}
      </ScrollView>
      {canApply ? (
        <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
          {app.uid ? (
            <Button label="Ứng tuyển" full size="lg" busy={busy} onPress={() => void apply()} />
          ) : (
            <Button label="Đăng nhập để ứng tuyển" full size="lg" onPress={() => router.push("/login")} />
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  )
}

function Fact({ icon, text }: { icon: "calendar" | "pin" | "person"; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Icon name={icon} size={16} color={colors.accent} />
      <Txt style={{ flex: 1 }}>{text}</Txt>
    </View>
  )
}
