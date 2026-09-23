import * as React from "react"
import { FlashList, type FlashListRef } from "@shopify/flash-list"
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import * as WebBrowser from "expo-web-browser"
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { chatState, vnTime } from "@/shared"
import {
  CHAT_MAX_PHOTOS,
  listMessages,
  markThreadRead,
  messageFromRow,
  sendMessage,
  setOpenThread,
  subscribeThread,
  threadHeader,
  uploadChatPhoto,
  type ChatMessage,
  type ThreadHeader,
} from "@/data/chat"
import { formatDay, localDate, localTime } from "@/data/format"
import { webLink } from "@/data/links"
import { reencodePhoto } from "@/data/works"
import { useSafetyMenu } from "@/components/safety"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { ErrorNote } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

type Picked = { uri: string; width: number; height: number }

/**
 * One conversation. New messages arrive over Supabase Realtime; reading marks
 * them read via mark_thread_read. A chat exists only around a match: it opens
 * when the freelancer accepts the booking and closes when the job ends
 * (threads.chat_status). While it is not open, a note replaces the box.
 */
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const uid = app.uid
  const insets = useSafeAreaInsets()
  const list = React.useRef<FlashListRef<ChatMessage>>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [header, setHeader] = React.useState<ThreadHeader | null>(null)
  const [text, setText] = React.useState("")
  const [photos, setPhotos] = React.useState<Picked[]>([])
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
        setLoaded(true)
        void markThreadRead(id).then(() => refreshMe())
      })
      .catch((e: Error) => live && setError(e.message))
    const stop = subscribeThread(id, (row) => {
      void messageFromRow(row, uid).then((m) => {
        if (live) setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      })
      if (row.sender_id !== uid) void markThreadRead(id).then(() => refreshMe())
    })
    return () => {
      live = false
      stop()
    }
  }, [id, uid, refreshMe])

  // Pushes about this conversation stay quiet while it is on screen. Coming
  // back to it re-reads whether it is open: the booking may have been
  // accepted, or the job finished, meanwhile.
  useFocusEffect(
    React.useCallback(() => {
      setOpenThread(id ?? null)
      if (uid && id) void threadHeader(id, uid).then((h) => h && setHeader(h))
      return () => setOpenThread(null)
    }, [id, uid]),
  )

  React.useEffect(() => {
    if (messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50)
  }, [messages.length])

  // A server without chat_status yet: leave the box open, send_message decides.
  const state = header?.chatStatus ? chatState(header.chatStatus) : { open: true, note: undefined }

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: CHAT_MAX_PHOTOS - photos.length,
      quality: 1,
      exif: false,
    })
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))].slice(0, CHAT_MAX_PHOTOS))
  }

  const send = async () => {
    const body = text.trim()
    if ((!body && !photos.length) || sending || !uid) return
    setSending(true)
    setError(null)
    try {
      // Re-encoded first: a JPEG under 5 MB without its EXIF block (and GPS position).
      const paths: string[] = []
      for (const p of photos) paths.push(await uploadChatPhoto(uid, await reencodePhoto(p.uri, p.width, p.height)))
      const res = await sendMessage(id, body, paths)
      if (!res.ok) {
        setError(res.error)
        // The conversation may have closed meanwhile.
        void threadHeader(id, uid).then(setHeader)
        return
      }
      setText("")
      setPhotos([])
      // Realtime delivers our own message too; reload in case it is late.
      void listMessages(id, uid).then(setMessages).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được tin nhắn.")
    } finally {
      setSending(false)
    }
  }

  const support = () => void WebBrowser.openBrowserAsync(webLink("/tro-giup"))
  const bookAgain = () => {
    if (!header) return
    if (header.bookingId) router.push({ pathname: "/book/[proId]", params: header.templateId ? { proId: header.proId, template: header.templateId } : { proId: header.proId } })
    else if (header.proSlug) router.push({ pathname: "/pros/[id]", params: { id: header.proSlug } })
  }

  const barStyle = {
    paddingHorizontal: gutter,
    paddingTop: 10,
    paddingBottom: Math.max(insets.bottom, 12),
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  } as const

  let footer: React.ReactNode
  if (blocked) {
    footer = (
      <View style={barStyle}>
        <Txt color={colors.inkSoft} center>
          Bạn đã chặn {header?.name ?? "người này"}.
        </Txt>
        <Button label="Bỏ chặn" variant="secondary" full onPress={() => header && void app.unblock(header.otherId)} />
      </View>
    )
  } else if (header && !state.open) {
    const closed = header.chatStatus === "closed"
    footer = (
      <View style={barStyle}>
        <Txt color={colors.inkSoft} center>
          {state.note}
        </Txt>
        {closed && header.closesAt ? (
          <Txt v="meta" color={colors.muted} center>
            Đã đóng lúc {vnTime(new Date(header.closesAt))}
          </Txt>
        ) : null}
        {closed ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {!header.iAmPro && (header.bookingId || header.proSlug) ? <Button label="Đặt lại" icon="calendar" full style={{ flex: 1 }} onPress={bookAgain} /> : null}
            <Button label="Liên hệ hỗ trợ" variant="secondary" full style={{ flex: 1 }} onPress={support} />
          </View>
        ) : header.bookingId ? (
          <Button label="Xem lịch hẹn" variant="secondary" full onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: header.bookingId! } })} />
        ) : null}
      </View>
    )
  } else {
    footer = (
      <View style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
        {photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter, paddingTop: 10 }}>
            {photos.map((p, i) => (
              <Press key={p.uri} onPress={() => setPhotos((x) => x.filter((_, j) => j !== i))} accessibilityLabel={`Bỏ ảnh ${i + 1}`}>
                <Image source={{ uri: p.uri }} style={{ width: 64, height: 80, borderRadius: radius.sm }} contentFit="cover" />
                <View style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="close" size={11} />
                </View>
              </Press>
            ))}
          </ScrollView>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            paddingHorizontal: gutter,
            paddingTop: 8,
            // No home-indicator gap while the keyboard is up.
            paddingBottom: keyboard ? 8 : Math.max(insets.bottom, 10),
          }}
        >
          <Press
            onPress={() => void pick()}
            disabled={photos.length >= CHAT_MAX_PHOTOS || sending}
            accessibilityLabel="Gửi ảnh"
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="photos" size={22} color={photos.length >= CHAT_MAX_PHOTOS ? colors.subtleStrong : colors.inkSoft} />
          </Press>
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
            disabled={(!text.trim() && !photos.length) || sending}
            accessibilityLabel="Gửi"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", opacity: sending ? 0.6 : 1 }}
          >
            <Icon name="send" size={20} color={colors.surface} />
          </Press>
        </View>
      </View>
    )
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
                    <Image key={uri} source={{ uri }} style={{ width: 200, height: 250, borderRadius: radius.sm, backgroundColor: colors.subtle }} contentFit="cover" />
                  ))}
                  {item.hasImages && !item.images.length ? (
                    <Txt v="meta" color={item.mine ? colors.subtleStrong : colors.muted}>
                      Không tải được ảnh.
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
            {blocked ? "Tin nhắn đã ẩn vì bạn đã chặn người này." : header && loaded && state.open ? `Bắt đầu trò chuyện với ${header.name}.` : ""}
          </Txt>
        }
      />
      {error ? (
        <View style={{ paddingHorizontal: gutter, paddingBottom: 8 }}>
          <ErrorNote text={error} />
        </View>
      ) : null}
      {footer}
    </KeyboardAvoidingView>
  )
}
