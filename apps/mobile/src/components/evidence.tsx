import * as React from "react"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { ActivityIndicator, View } from "react-native"
import * as WebBrowser from "expo-web-browser"
import { VIDEO_MAX_SECONDS } from "@/shared"
import { EVIDENCE_MAX, removeEvidence, uploadEvidence, type MyReport, type PickedMedia } from "@/data/safety"
import { colors, radius } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

interface Item {
  key: string
  media: PickedMedia
  path?: string
  error?: string
}

const TILE = 72

/**
 * Photos and clips as evidence for a report, each uploaded as soon as it is
 * picked (data/safety.ts uploadEvidence: photos re-encoded, clips stripped of
 * their location). The parent hears the uploaded paths and whether any file is
 * still going. Only the reporter and the staff can open them.
 */
export function EvidencePicker({
  uid,
  max = EVIDENCE_MAX,
  onChange,
  onBusyChange,
}: {
  uid: string
  max?: number
  onChange: (paths: string[]) => void
  onBusyChange?: (busy: boolean) => void
}) {
  const [items, setItems] = React.useState<Item[]>([])

  const paths = items.flatMap((i) => (i.path ? [i.path] : [])).join("|")
  const busy = items.some((i) => !i.path && !i.error)
  React.useEffect(() => onChange(paths ? paths.split("|") : []), [paths])
  React.useEffect(() => onBusyChange?.(busy), [busy])

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: max - items.length,
      videoMaxDuration: VIDEO_MAX_SECONDS,
      quality: 1,
      exif: false,
    })
    if (res.canceled) return
    const added = res.assets.slice(0, max - items.length).map((a) => ({
      key: Math.random().toString(36).slice(2),
      media: { uri: a.uri, width: a.width, height: a.height, video: a.type === "video", duration: a.duration } satisfies PickedMedia,
    }))
    setItems((list) => [...list, ...added])
    for (const item of added) {
      uploadEvidence(uid, item.media).then(
        (path) => setItems((list) => list.map((i) => (i.key === item.key ? { ...i, path } : i))),
        (err: unknown) =>
          setItems((list) => list.map((i) => (i.key === item.key ? { ...i, error: err instanceof Error ? err.message : "Tải lên không thành công." } : i))),
      )
    }
  }

  const remove = (item: Item) => {
    if (item.path) void removeEvidence([item.path])
    setItems((list) => list.filter((i) => i.key !== item.key))
  }

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <View key={item.key} style={{ width: TILE, height: TILE, borderRadius: radius.sm, overflow: "hidden", backgroundColor: colors.subtle }}>
            {item.media.video ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Icon name="film" size={24} color={colors.inkSoft} />
              </View>
            ) : (
              <Image source={{ uri: item.media.uri }} style={{ width: TILE, height: TILE }} contentFit="cover" />
            )}
            {!item.path && !item.error ? (
              <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
            {item.error ? (
              <View style={{ position: "absolute", inset: 0, padding: 4, justifyContent: "center", backgroundColor: "rgba(180,40,40,0.85)" }}>
                <Txt v="meta" color="#fff" numberOfLines={4} style={{ fontSize: 10, lineHeight: 12 }}>
                  {item.error}
                </Txt>
              </View>
            ) : null}
            <Press
              onPress={() => remove(item)}
              accessibilityLabel="Bỏ tệp này"
              style={{ position: "absolute", top: 3, right: 3, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 2 }}
            >
              <Icon name="close" size={12} color="#fff" />
            </Press>
          </View>
        ))}
        {items.length < max ? (
          <Press
            onPress={() => void pick()}
            accessibilityLabel="Thêm ảnh hoặc clip"
            style={{ width: TILE, height: TILE, borderRadius: radius.sm, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, alignItems: "center", justifyContent: "center", gap: 2 }}
          >
            <Icon name="camera" size={20} color={colors.muted} />
            <Txt v="meta" color={colors.muted} style={{ fontSize: 11 }}>
              Ảnh / clip
            </Txt>
          </Press>
        ) : null}
      </View>
      <Txt v="meta" color={colors.muted}>
        Tối đa {max} tệp, clip dài tối đa {VIDEO_MAX_SECONDS} giây. Chỉ bạn và đội ngũ 360dep xem được.
      </Txt>
    </View>
  )
}

/** Evidence already sent, through short-lived signed links. */
export function EvidenceGrid({ items }: { items: MyReport["evidence"] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.map((e) =>
        e.url ? (
          <Press
            key={e.path}
            onPress={() => void WebBrowser.openBrowserAsync(e.url)}
            accessibilityLabel={e.video ? "Mở clip" : "Mở ảnh"}
            style={{ width: TILE, height: TILE, borderRadius: radius.sm, overflow: "hidden", backgroundColor: colors.subtle, alignItems: "center", justifyContent: "center" }}
          >
            {e.video ? <Icon name="film" size={24} color={colors.inkSoft} /> : <Image source={{ uri: e.url }} style={{ width: TILE, height: TILE }} contentFit="cover" />}
          </Press>
        ) : null,
      )}
    </View>
  )
}
