import * as React from "react"
import { FlashList, type FlashListRef } from "@shopify/flash-list"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { Image } from "expo-image"
import { KeyboardAvoidingView, Platform, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { listMessages, markThreadRead, sendMessage, subscribeThread, threadHeader, toMessage, type ChatMessage } from "@/data/chat"
import { formatDay, localDate, localTime } from "@/data/format"
import { useSafetyMenu } from "@/components/safety"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { ErrorNote } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** One conversation. New messages arrive over Supabase Realtime; reading marks them read via mark_thread_read. */
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const uid = app.uid
  const insets = useSafeAreaInsets()
  const list = React.useRef<FlashListRef<ChatMessage>>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [header, setHeader] = React.useState<{ name: string; proSlug: string; bookingId: string | null; iAmPro: boolean; otherId: string } | null>(null)
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [sending, setSending] = React.useState(false)
  const { refreshMe } = app
  const keyboard = useKeyboardVisible()
  const blocked = header ? app.blocked.has(header.otherId) : false
  const safety = useSafetyMenu(header ? { accountId: header.otherId, name: header.name, onBlocked: () => router.back() } : null)

  React.useEffect(() => {
    if (!uid || !id) return
    let live = true
    void threadHeader(id, uid).then((h) => live && setHeader(h))
    listMessages(id, uid)
      .then((m) => {
        if (!live) return
        setMessages(m)
        void markThreadRead(id).then(() => refreshMe())
      })
      .catch((e: Error) => live && setError(e.message))
    const stop = subscribeThread(id, (row) => {
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, toMessage(row, uid)]))
      if (row.sender_id !== uid) void markThreadRead(id).then(() => refreshMe())
    })
    return () => {
      live = false
      stop()
    }
  }, [id, uid, refreshMe])

  React.useEffect(() => {
    if (messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50)
  }, [messages.length])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    const res = await sendMessage(id, body)
    setSending(false)
    if (!res.ok) return setError(res.error)
    setText("")
    setError(null)
    // Realtime delivers our own message too; reload in case it is late.
    if (uid) void listMessages(id, uid).then(setMessages).catch(() => {})
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={insets.top + 44}>
      <Stack.Screen
        options={{
          title: header?.name ?? "",
          headerRight: () =>
            header ? (
              <View style={{ flexDirection: "row" }}>
                {header.bookingId ? (
                  <IconButton name="calendar" label="Xem lịch hẹn" onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: header.bookingId! } })} />
                ) : !header.iAmPro && header.proSlug ? (
                  <IconButton name="person" label="Xem hồ sơ" onPress={() => router.push({ pathname: "/pros/[id]", params: { id: header.proSlug } })} />
                ) : null}
                <IconButton name="more" label="Báo cáo hoặc chặn" onPress={safety.open} />
              </View>
            ) : null,
        }}
      />
      {safety.element}
      <FlashList
        ref={list}
        data={blocked ? [] : messages}
        keyExtractor={(m) => m.id}
        keyboardDismissMode="interactive"
        contentContainerStyle={{ padding: gutter }}
        renderItem={({ item, index }) => {
          const day = localDate(item.createdAt)
          const newDay = index === 0 || localDate(messages[index - 1].createdAt) !== day
          return (
            <View>
              {newDay ? (
                <Txt v="meta" color={colors.muted} center style={{ paddingVertical: 10 }}>
                  {formatDay(day)}
                </Txt>
              ) : null}
              <View style={{ alignItems: item.mine ? "flex-end" : "flex-start", paddingBottom: 6 }}>
                <View
                  style={{
                    maxWidth: "80%",
                    backgroundColor: item.mine ? colors.accent : colors.surface,
                    borderRadius: radius.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    gap: 6,
                  }}
                >
                  {item.images.map((uri) => (
                    <Image key={uri} source={{ uri }} style={{ width: 200, height: 250, borderRadius: radius.sm }} contentFit="cover" />
                  ))}
                  {item.hasImages && !item.images.length ? (
                    <Txt v="meta" color={item.mine ? colors.subtleStrong : colors.muted}>
                      Ảnh chỉ xem được trên web.
                    </Txt>
                  ) : null}
                  {item.body ? <Txt color={item.mine ? colors.surface : colors.ink}>{item.body}</Txt> : null}
                  <Txt v="meta" color={item.mine ? colors.subtleStrong : colors.muted} style={{ alignSelf: "flex-end" }}>
                    {localTime(item.createdAt)}
                  </Txt>
                </View>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={
          <Txt color={colors.inkSoft} center style={{ paddingTop: 40 }}>
            {blocked ? "Tin nhắn đã ẩn vì bạn đã chặn người này." : header ? `Bắt đầu trò chuyện với ${header.name}.` : ""}
          </Txt>
        }
      />
      {error ? (
        <View style={{ paddingHorizontal: gutter }}>
          <ErrorNote text={error} />
        </View>
      ) : null}
      {blocked ? (
        <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), gap: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Txt color={colors.inkSoft} center>
            Bạn đã chặn {header?.name ?? "người này"}.
          </Txt>
          <Button label="Bỏ chặn" variant="secondary" full onPress={() => header && void app.unblock(header.otherId)} />
        </View>
      ) : (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          paddingHorizontal: gutter,
          paddingTop: 8,
          // No home-indicator gap while the keyboard is up.
          paddingBottom: keyboard ? 8 : Math.max(insets.bottom, 10),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhắn tin"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          style={{ flex: 1, maxHeight: 120, minHeight: 44, backgroundColor: colors.subtle, borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontFamily: fonts[400], fontSize: 15, color: colors.ink }}
          accessibilityLabel="Nội dung tin nhắn"
        />
        <Press
          onPress={() => void send()}
          disabled={!text.trim() || sending}
          accessibilityLabel="Gửi"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="send" size={20} color={colors.surface} />
        </Press>
      </View>
      )}
    </KeyboardAvoidingView>
  )
}
