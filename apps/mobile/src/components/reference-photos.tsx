import * as React from "react"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from "react-native"
import { MAX_REFERENCES, signReferences } from "@/data/references"
import { colors, radius } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

export type PickedPhoto = { uri: string; width: number; height: number }

/**
 * Choosing 1 to 3 reference photos before they are sent: thumbnails with a
 * remove button, and a tile to add more. Uploading is the caller's (after the
 * request or booking exists).
 */
export function ReferencePicker({ value, onChange, disabled }: { value: PickedPhoto[]; onChange: (photos: PickedPhoto[]) => void; disabled?: boolean }) {
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_REFERENCES - value.length,
      quality: 1,
      exif: false,
    })
    if (!res.canceled) onChange([...value, ...res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))].slice(0, MAX_REFERENCES))
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {value.map((p, i) => (
        <Press key={p.uri} onPress={() => onChange(value.filter((_, j) => j !== i))} disabled={disabled} accessibilityLabel={`Bỏ ảnh mẫu ${i + 1}`}>
          <Image source={{ uri: p.uri }} style={{ width: 88, height: 110, borderRadius: radius.md, backgroundColor: colors.subtle }} contentFit="cover" />
          <View style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" size={12} />
          </View>
        </Press>
      ))}
      {value.length < MAX_REFERENCES ? (
        <Press
          onPress={() => void pick()}
          disabled={disabled}
          accessibilityLabel="Thêm ảnh mẫu"
          style={{ width: 88, height: 110, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.subtleStrong, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Icon name="photos" size={22} color={colors.inkSoft} />
          <Txt v="label" color={colors.inkSoft}>
            Thêm ảnh
          </Txt>
        </Press>
      ) : null}
    </ScrollView>
  )
}

/** Sent reference photos, signed for the reader; tap one to see it large. Nothing when there are none. */
export function ReferencePhotos({ paths, title = "Ảnh mẫu khách gửi" }: { paths: string[]; title?: string }) {
  const [urls, setUrls] = React.useState<string[]>([])
  const [open, setOpen] = React.useState<string | null>(null)
  const { width } = useWindowDimensions()
  const key = paths.join("|")
  React.useEffect(() => {
    let live = true
    void signReferences(key ? key.split("|") : []).then((u) => live && setUrls(u)).catch(() => {})
    return () => {
      live = false
    }
  }, [key])
  if (!paths.length) return null
  return (
    <View style={{ gap: 8 }}>
      <Txt v="meta" w={600}>
        {title}
      </Txt>
      {urls.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {urls.map((u, i) => (
            <Press key={u} onPress={() => setOpen(u)} accessibilityLabel={`Xem ảnh mẫu ${i + 1}`}>
              <Image source={{ uri: u }} style={{ width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.subtle }} contentFit="cover" />
            </Press>
          ))}
        </ScrollView>
      ) : (
        <Txt v="meta" color={colors.muted}>
          Đang tải {paths.length} ảnh mẫu…
        </Txt>
      )}
      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable onPress={() => setOpen(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" }} accessibilityLabel="Đóng ảnh">
          {open ? <Image source={{ uri: open }} style={{ width, height: width * 1.25 }} contentFit="contain" /> : null}
        </Pressable>
      </Modal>
    </View>
  )
}
