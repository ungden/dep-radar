import * as React from "react"
import * as WebBrowser from "expo-web-browser"
import { View } from "react-native"
import { CHAT_NOTICE, CONDUCT, customerNote, offAppHint } from "@/shared"
import { webLink } from "@/data/links"
import { colors, radius, hairline } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/**
 * "Chỉ dịch vụ lành mạnh": the short rule, the full list one tap away, the
 * binding text in the Quy chế on the web. Same words as the web
 * (lib/conduct.ts), shown where a customer books or posts a request.
 */
export function ConductNote() {
  const [open, setOpen] = React.useState(false)
  return (
    <Press
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${CONDUCT.title}. ${CONDUCT.short}`}
      style={{ flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: hairline, borderColor: colors.line, backgroundColor: colors.surface }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name="verified" size={18} color={colors.success} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt w={700}>{CONDUCT.title}</Txt>
        <Txt v="meta" color={colors.inkSoft}>{CONDUCT.short}</Txt>
        {open ? (
          <View style={{ gap: 4, marginTop: 4 }}>
            {CONDUCT.rules.map((r) => (
              <Txt key={r} v="meta" color={colors.inkSoft}>• {r}</Txt>
            ))}
            <Txt v="meta" color={colors.inkSoft}>{CONDUCT.report}</Txt>
            <Txt v="meta" w={700} color={colors.accentDark} onPress={() => void WebBrowser.openBrowserAsync(webLink("/quy-che#bi-cam"))}>
              Đọc Quy chế, mục IX
            </Txt>
          </View>
        ) : (
          <Txt v="meta" w={700} color={colors.accentDark}>Xem quy định</Txt>
        )}
      </View>
    </Press>
  )
}

/** For the partner, above the conversation: who this customer is, and the two messages worth sending before leaving home. */
export function CustomerNote({ history, spa, onAskLocation, onConfirm }: { history: { withMe: number; overall: number }; spa?: boolean; onAskLocation?: () => void; onConfirm?: () => void }) {
  const note = customerNote({ ...history, spa })
  return (
    <View style={{ marginBottom: 12, padding: 14, gap: 8, borderRadius: radius.lg, backgroundColor: note.regular ? colors.successSoft : colors.highlightSoft }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name={note.regular ? "heart" : "person"} size={16} color={note.regular ? colors.success : colors.ink} />
        <Txt v="meta" w={700} style={{ flex: 1 }}>{note.title}</Txt>
      </View>
      {note.text ? <Txt v="meta" color={colors.inkSoft}>{note.text}</Txt> : null}
      {!note.regular && (onAskLocation || onConfirm) ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
          {onAskLocation ? <AskButton label="Xin vị trí" icon="pin" primary onPress={onAskLocation} /> : null}
          {onConfirm ? <AskButton label="Xác nhận lịch" icon="calendar" onPress={onConfirm} /> : null}
        </View>
      ) : null}
    </View>
  )
}

function AskButton({ label, icon, primary, onPress }: { label: string; icon: "pin" | "calendar"; primary?: boolean; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, điền sẵn vào ô nhắn tin`} style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: radius.full, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: primary ? colors.accent : colors.surface }}>
      <Icon name={icon} size={16} color={primary ? colors.surface : colors.ink} />
      <Txt v="meta" w={600} color={primary ? colors.surface : colors.ink}>{label}</Txt>
    </Press>
  )
}

/** Pinned above every conversation: talk here, or 360đẹp cannot help. */
export function ChatNotice({ defaultOpen }: { defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen))
  return (
    <Press
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={CHAT_NOTICE.title}
      style={{ marginBottom: 12, padding: 12, borderRadius: radius.lg, borderWidth: hairline, borderColor: colors.line, backgroundColor: colors.highlightSoft, gap: 6 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name="verified" size={16} color={colors.ink} />
        <Txt v="meta" w={700} style={{ flex: 1 }}>{CHAT_NOTICE.title}</Txt>
        <Txt v="meta" w={600} color={colors.inkSoft}>{open ? "Thu gọn" : "Xem"}</Txt>
      </View>
      {open ? (
        <>
          <Txt v="meta" color={colors.inkSoft}>{CHAT_NOTICE.text}</Txt>
          {CHAT_NOTICE.points.map((p) => (
            <Txt key={p} v="meta" color={colors.inkSoft}>• {p}</Txt>
          ))}
        </>
      ) : null}
    </Press>
  )
}

/** Above the box to write in, while the draft moves the deal off the app. */
export function OffAppHint({ text }: { text: string }) {
  const hint = offAppHint(text)
  if (!hint) return null
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: radius.md, backgroundColor: colors.warningSoft }}>
      <Icon name="info" size={16} color={colors.warning} />
      <Txt v="meta" color={colors.warning} style={{ flex: 1 }}>{hint}</Txt>
    </View>
  )
}
