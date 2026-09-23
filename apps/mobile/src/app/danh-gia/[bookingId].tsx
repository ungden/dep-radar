import * as React from "react"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { REVIEW_TAGS } from "@/shared"
import { getBooking } from "@/data/bookings"
import { formatDateLong } from "@/data/format"
import { uploadReviewPhoto, writeReview } from "@/data/reviews"
import { reencodePhoto } from "@/data/works"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Avatar, Chip, EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const MAX_PHOTOS = 3
const STAR_WORDS = ["", "Tệ", "Chưa ổn", "Tạm được", "Tốt", "Tuyệt vời"]

/**
 * Review a finished booking: stars, what went well, a few words, up to three
 * result photos. Same write_review RPC as the web; photos are re-encoded on
 * the phone first, which drops their GPS position.
 */
export default function WriteReview() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const app = useApp()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardVisible()
  const navigation = useNavigation()
  const booking = useAsync(app.uid ? () => getBooking(bookingId, app.uid!) : null, [bookingId, app.uid])
  const [rating, setRating] = React.useState(0)
  const [tags, setTags] = React.useState<string[]>([])
  const [text, setText] = React.useState("")
  const [photos, setPhotos] = React.useState<{ uri: string; width: number; height: number }[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const leaving = React.useRef(false)

  const dirty = rating > 0 || Boolean(text.trim()) || photos.length > 0
  React.useEffect(() => {
    if (!dirty) return
    return navigation.addListener("beforeRemove", (e) => {
      if (leaving.current) return
      e.preventDefault()
      Alert.alert("Bỏ đánh giá đang viết?", undefined, [
        { text: "Ở lại", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ])
    })
  }, [dirty, navigation])

  const header = <Stack.Screen options={{ gestureEnabled: !dirty, headerRight: () => <IconButton name="close" label="Đóng" onPress={() => router.back()} /> }} />
  const b = booking.value
  if (!app.uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />
  if (booking.loading && !b)
    return (
      <View style={{ padding: gutter, gap: 12 }}>
        {header}
        <Skeleton style={{ height: 70, borderRadius: radius.md }} />
        <Skeleton style={{ height: 200, borderRadius: radius.md }} />
      </View>
    )
  if (!b || b.status !== "completed" || b.pro.id === app.uid)
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter }}>
        {header}
        <EmptyState title="Chưa thể đánh giá" text="Chỉ đánh giá được lịch hẹn đã hoàn thành của bạn." action="Đóng" onAction={() => router.back()} />
      </View>
    )
  if (b.reviewed)
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter }}>
        {header}
        <EmptyState title="Bạn đã đánh giá lịch này" action="Xem hồ sơ" onAction={() => router.replace({ pathname: "/pros/[id]", params: { id: b.pro.slug || b.pro.id, tab: "reviews" } })} />
      </View>
    )

  const valid = rating > 0 && text.trim().length >= 10

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1,
      exif: false,
    })
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))].slice(0, MAX_PHOTOS))
  }

  const submit = async () => {
    const uid = app.uid!
    setBusy(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const p of photos) urls.push(await uploadReviewPhoto(uid, await reencodePhoto(p.uri, p.width, p.height)))
      const res = await writeReview({ bookingId: b.id, rating, tags, body: text.trim(), photos: urls })
      if (!res.ok) throw new Error(res.error)
      haptic.success()
      leaving.current = true
      void app.refresh()
      router.replace({ pathname: "/pros/[id]", params: { id: b.pro.slug || b.pro.id, tab: "reviews" } })
    } catch (e) {
      haptic.error()
      setError(e instanceof Error ? e.message : "Chưa gửi được đánh giá.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      {header}
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 20 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 }}>
          <Avatar name={b.pro.name} uri={b.pro.avatar} size={44} />
          <View style={{ flex: 1 }}>
            <Txt w={700}>{b.pro.name}</Txt>
            <Txt v="meta" color={colors.muted}>
              {b.serviceName} · {b.variantLabel} · {formatDateLong(b.date)}
            </Txt>
          </View>
        </View>

        <View style={{ alignItems: "center", gap: 8 }}>
          <Txt w={700}>Trải nghiệm của bạn thế nào?</Txt>
          <View style={{ flexDirection: "row", gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Số sao">
            {[1, 2, 3, 4, 5].map((n) => (
              <Press
                key={n}
                haptic="select"
                onPress={() => setRating(n)}
                accessibilityRole="radio"
                accessibilityLabel={`${n} sao`}
                accessibilityState={{ checked: rating === n }}
                style={{ padding: 4 }}
              >
                <Icon name={n <= rating ? "star" : "starEmpty"} size={36} color={n <= rating ? colors.accent : colors.subtleStrong} />
              </Press>
            ))}
          </View>
          <Txt v="meta" color={colors.inkSoft}>
            {STAR_WORDS[rating] || "Chạm để chấm sao"}
          </Txt>
        </View>

        <View style={{ gap: 10 }}>
          <Txt w={700}>Điểm bạn thích (không bắt buộc)</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {REVIEW_TAGS.map((t) => (
              <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Txt w={700}>Chia sẻ chi tiết</Txt>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            placeholder="Kết quả có giống mẫu không, có đến đúng giờ, dụng cụ có sạch không…"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Nội dung đánh giá"
            style={{ minHeight: 110, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
          />
          <Txt v="meta" color={text.trim().length >= 10 ? colors.muted : colors.warning}>
            {text.trim().length >= 10 ? "Cảm ơn bạn!" : `Ít nhất 10 ký tự (còn ${10 - text.trim().length})`}
          </Txt>
        </View>

        <View style={{ gap: 8 }}>
          <Txt w={700}>Ảnh kết quả (không bắt buộc)</Txt>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {photos.map((p, i) => (
              <Press key={p.uri} onPress={() => setPhotos((x) => x.filter((_, j) => j !== i))} accessibilityLabel={`Bỏ ảnh ${i + 1}`}>
                <Image source={{ uri: p.uri }} style={{ width: 80, height: 100, borderRadius: radius.sm }} contentFit="cover" />
                <View style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="close" size={12} />
                </View>
              </Press>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <Press
                onPress={() => void pick()}
                accessibilityLabel="Thêm ảnh"
                style={{ width: 80, height: 100, borderRadius: radius.sm, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.subtleStrong, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="photos" size={22} color={colors.accent} />
              </Press>
            ) : null}
          </View>
          <Txt v="meta" color={colors.muted}>
            Ảnh được nén và xoá vị trí trước khi tải lên. Đừng đăng ảnh có mặt người khác khi chưa hỏi.
          </Txt>
        </View>

        <Txt v="meta" color={colors.muted}>
          Đánh giá được gắn nhãn “Đã đặt qua 360dep”; người làm không xoá được, chỉ trả lời công khai.
        </Txt>
        {error ? <ErrorNote text={error} /> : null}
      </ScrollView>
      <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button label="Gửi đánh giá" full size="lg" disabled={!valid} busy={busy} onPress={() => void submit()} />
      </View>
    </KeyboardAvoidingView>
  )
}
