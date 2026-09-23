import * as React from "react"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BLIND_NOTE, REVIEW_ISSUE_TAGS, reviewTagsFor, reviewWindow } from "@/shared"
import { getBooking } from "@/data/bookings"
import { formatDateLong } from "@/data/format"
import { getMyReview, uploadReviewPhoto, writeReview } from "@/data/reviews"
import { reencodePhoto } from "@/data/works"
import { STAR_WORDS, StarPicker } from "@/components/stars"
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
const MIN_BODY = 10

/** A photo on screen: picked on this phone, or already uploaded with an earlier version of the review. */
type ReviewPhoto = { uri: string; width: number; height: number; url?: string }

/**
 * Review a finished booking: stars, tags, a few words, up to three result
 * photos. Same write_review RPC as the web. Within 14 days of completion; blind
 * (and still editable) until the freelancer has reviewed the customer too, or
 * the 14 days end. Three stars or fewer asks what went wrong. Photos are
 * re-encoded on the phone first, which drops their GPS position.
 */
export default function WriteReview() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const app = useApp()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardVisible()
  const navigation = useNavigation()
  const booking = useAsync(app.uid ? () => getBooking(bookingId, app.uid!) : null, [bookingId, app.uid])
  const existing = useAsync(app.uid ? () => getMyReview(bookingId) : null, [bookingId, app.uid])
  const [rating, setRating] = React.useState(0)
  const [tags, setTags] = React.useState<string[]>([])
  const [text, setText] = React.useState("")
  const [photos, setPhotos] = React.useState<ReviewPhoto[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState<{ published: boolean } | null>(null)
  const leaving = React.useRef(false)
  const initial = React.useRef<string | null>(null)

  // Editing a blind review: start from what was written.
  const mine = existing.value
  React.useEffect(() => {
    if (initial.current !== null || existing.loading) return
    if (mine && !mine.publishedAt) {
      setRating(mine.rating)
      setTags(mine.tags)
      setText(mine.body)
      setPhotos(mine.photos.slice(0, MAX_PHOTOS).map((url) => ({ uri: url, width: 0, height: 0, url })))
      initial.current = JSON.stringify([mine.rating, mine.tags, mine.body, mine.photos.slice(0, MAX_PHOTOS)])
    } else {
      initial.current = JSON.stringify([0, [], "", []])
    }
  }, [mine, existing.loading])

  const snapshot = JSON.stringify([rating, tags, text, photos.map((p) => p.url ?? p.uri)])
  const dirty = initial.current !== null && snapshot !== initial.current && !submitted
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
  const wrap = (node: React.ReactNode) => (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter }}>
      {header}
      {node}
    </View>
  )
  if (!app.uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />
  if ((booking.loading && !b) || (existing.loading && mine === undefined))
    return (
      <View style={{ padding: gutter, gap: 12 }}>
        {header}
        <Skeleton style={{ height: 70, borderRadius: radius.md }} />
        <Skeleton style={{ height: 200, borderRadius: radius.md }} />
      </View>
    )
  if (!b || b.status !== "completed" || b.pro.id === app.uid)
    return wrap(<EmptyState title="Chưa thể đánh giá" text="Chỉ đánh giá được lịch hẹn đã hoàn thành của bạn." action="Đóng" onAction={() => router.back()} />)

  const toProfile = () => router.replace({ pathname: "/pros/[id]", params: { id: b.pro.slug || b.pro.id, tab: "reviews" } })
  if (submitted)
    return wrap(
      submitted.published ? (
        <EmptyState title="Cảm ơn bạn!" text={`Đánh giá đã hiện trên hồ sơ ${b.pro.name}.`} action="Xem hồ sơ" onAction={toProfile} />
      ) : (
        <EmptyState title="Đã lưu đánh giá" text={`${BLIND_NOTE} Trong lúc chờ, bạn vẫn sửa được.`} action="Xong" onAction={() => router.back()} />
      ),
    )
  if (mine?.publishedAt)
    return wrap(<EmptyState title="Đánh giá đã hiện công khai" text="Đánh giá đã hiện thì không sửa được nữa." action="Xem hồ sơ" onAction={toProfile} />)
  const win = reviewWindow(b.completedAt, new Date())
  if (!win.open)
    return wrap(
      mine ? (
        <EmptyState title="Bạn đã đánh giá lịch này" text="Đã hết 14 ngày: đánh giá sẽ sớm hiện công khai và không sửa được nữa." action="Đóng" onAction={() => router.back()} />
      ) : (
        <EmptyState title="Đã hết hạn đánh giá" text="Đánh giá được trong 14 ngày kể từ khi lịch hẹn hoàn thành." action="Đóng" onAction={() => router.back()} />
      ),
    )

  const editing = Boolean(mine)
  const offered = rating ? reviewTagsFor(rating) : []
  const needsIssue = rating > 0 && rating <= 3
  const hasIssue = tags.some((t) => REVIEW_ISSUE_TAGS.includes(t))
  const bodyOk = text.trim().length >= MIN_BODY
  const valid = rating > 0 && bodyOk && (!needsIssue || hasIssue)

  const rate = (n: number) => {
    setRating(n)
    // Good things and bad things are different lists: keep only what the new stars offer.
    const next = reviewTagsFor(n)
    setTags((t) => t.filter((x) => next.includes(x)))
  }

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
      for (const p of photos) urls.push(p.url ?? (await uploadReviewPhoto(uid, await reencodePhoto(p.uri, p.width, p.height))))
      const res = await writeReview({ bookingId: b.id, rating, tags, body: text.trim(), photos: urls })
      if (!res.ok) throw new Error(res.error)
      haptic.success()
      leaving.current = true
      // Published at once when the freelancer has already reviewed the customer.
      const after = await getMyReview(b.id).catch(() => null)
      setSubmitted({ published: Boolean(after?.publishedAt) })
      void app.refresh()
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
          <StarPicker value={rating} onChange={rate} />
          <Txt v="meta" color={colors.inkSoft}>
            {STAR_WORDS[rating] || "Chạm để chấm sao"}
          </Txt>
        </View>

        {rating ? (
          <View style={{ gap: 10 }}>
            <Txt w={700}>{needsIssue ? "Điều chưa tốt (chọn ít nhất một)" : "Điểm bạn thích (không bắt buộc)"}</Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {offered.map((t) => (
                <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
              ))}
            </View>
            {needsIssue && !hasIssue ? (
              <Txt v="meta" color={colors.warning}>
                Từ 3 sao trở xuống, chọn ít nhất một điều chưa tốt để người sau biết.
              </Txt>
            ) : null}
          </View>
        ) : null}

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
          <Txt v="meta" color={bodyOk ? colors.muted : colors.warning}>
            {bodyOk ? "Cảm ơn bạn!" : `Ít nhất ${MIN_BODY} ký tự (còn ${MIN_BODY - text.trim().length})`}
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
          Còn {win.daysLeft} ngày để {editing ? "sửa" : "đánh giá"}. {BLIND_NOTE} Đánh giá được gắn nhãn “Đã đặt qua 360dep”; người làm không xoá được, chỉ trả lời công khai.
        </Txt>
        {error ? <ErrorNote text={error} /> : null}
      </ScrollView>
      <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button label={editing ? "Lưu thay đổi" : "Gửi đánh giá"} full size="lg" disabled={!valid || (editing && !dirty)} busy={busy} onPress={() => void submit()} />
      </View>
    </KeyboardAvoidingView>
  )
}
