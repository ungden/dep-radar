import * as React from "react"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CATALOG, categoryLabel } from "@/shared"
import { reencodePhoto, saveWork, uploadPhoto, uploadVideo, worksSupportVideo } from "@/data/works"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Chip, ErrorNote } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const MAX_PHOTOS = 10

interface Picked {
  uri: string
  width: number
  height: number
}

/**
 * Post a work from the phone. Photos are re-encoded on the device first (which
 * strips EXIF and its GPS position), uploaded to the `works` bucket under the
 * freelancer's own folder, then inserted into `works` the way the web's
 * saveWork() does.
 */
export default function PostWork() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const pro = app.myPro
  const templates = React.useMemo(() => CATALOG.filter((t) => pro?.categories.includes(t.category)), [pro])
  const [templateId, setTemplateId] = React.useState<string | null>(null)
  const [photos, setPhotos] = React.useState<Picked[]>([])
  const [video, setVideo] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [progress, setProgress] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [videoOk, setVideoOk] = React.useState(false)

  React.useEffect(() => {
    void worksSupportVideo().then(setVideoOk)
  }, [])

  const template = templates.find((t) => t.id === templateId) ?? templates[0]
  if (!pro || !app.uid) return null
  const uid = app.uid

  const add = (assets: ImagePicker.ImagePickerAsset[]) =>
    setPhotos((prev) => [...prev, ...assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))].slice(0, MAX_PHOTOS))

  const fromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      orderedSelection: true,
      quality: 1,
      exif: false,
    })
    if (!res.canceled) add(res.assets)
  }

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return Alert.alert("Chưa có quyền camera", "Bật quyền camera cho 360dep trong Cài đặt để chụp ảnh tác phẩm.")
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1, exif: false })
    if (!res.canceled) add(res.assets)
  }

  const pickVideo = async (camera: boolean) => {
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) return Alert.alert("Chưa có quyền camera", "Bật quyền camera cho 360dep trong Cài đặt.")
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["videos"],
      videoMaxDuration: 60,
      // Re-encoded on iOS to 720p: smaller, and a fresh file rather than the original.
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
    }
    const res = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
    if (res.canceled) return
    const asset = res.assets[0]
    if (asset.duration && asset.duration > 61_000) return Alert.alert("Clip dài quá", "Clip tối đa 60 giây.")
    setVideo(asset.uri)
  }

  const submit = async () => {
    if (!template) return
    setError(null)
    try {
      const urls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        setProgress(`Đang xử lý ảnh ${i + 1}/${photos.length}…`)
        const jpeg = await reencodePhoto(photos[i].uri, photos[i].width, photos[i].height)
        urls.push(await uploadPhoto(uid, jpeg))
      }
      let videoUrl: string | undefined
      if (video) {
        setProgress("Đang tải clip…")
        videoUrl = await uploadVideo(uid, video)
      }
      setProgress("Đang đăng…")
      const res = await saveWork(uid, { templateId: template.id, title, description, images: urls, video: videoUrl })
      if (!res.ok) throw new Error(res.error)
      await app.refresh()
      setPhotos([])
      setVideo(null)
      setTitle("")
      setDescription("")
      router.push({ pathname: "/works/[id]", params: { id: res.data } })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa đăng được, thử lại nhé.")
    } finally {
      setProgress(null)
    }
  }

  const ready = Boolean(template) && photos.length > 0 && title.trim().length >= 3 && !progress

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 48, gap: 20 }} keyboardShouldPersistTaps="handled">
        <StudioHeader title="Đăng tác phẩm" subtitle="Ảnh thật bạn làm. Vị trí chụp trong ảnh được xoá trước khi tải lên." />

        <View style={{ paddingHorizontal: gutter, gap: 10 }}>
          <Txt w={700}>Ảnh ({photos.length}/{MAX_PHOTOS})</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {photos.map((p, i) => (
              <View key={`${p.uri}:${i}`}>
                <Image source={{ uri: p.uri }} style={{ width: 96, height: 120, borderRadius: radius.sm, backgroundColor: colors.subtle }} contentFit="cover" />
                <Press
                  onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  accessibilityLabel={`Bỏ ảnh ${i + 1}`}
                  style={{ position: "absolute", top: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" }}
                >
                  <Icon name="close" size={14} />
                </Press>
                {i === 0 ? (
                  <Txt v="meta" w={600} color={colors.inkSoft} style={{ marginTop: 4 }}>
                    Ảnh bìa
                  </Txt>
                ) : null}
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <>
                <MediaButton icon="camera" label="Chụp" onPress={() => void fromCamera()} />
                <MediaButton icon="photos" label="Thư viện" onPress={() => void fromLibrary()} />
              </>
            ) : null}
          </ScrollView>
        </View>

        {videoOk ? (
          <View style={{ paddingHorizontal: gutter, gap: 10 }}>
            <Txt w={700}>Clip (không bắt buộc, tối đa 60 giây)</Txt>
            {video ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Icon name="video" />
                <Txt style={{ flex: 1 }}>Đã chọn 1 clip</Txt>
                <Button label="Bỏ" size="sm" variant="secondary" onPress={() => setVideo(null)} />
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button label="Quay clip" icon="video" size="sm" variant="secondary" onPress={() => void pickVideo(true)} />
                <Button label="Chọn clip" icon="photos" size="sm" variant="secondary" onPress={() => void pickVideo(false)} />
              </View>
            )}
          </View>
        ) : null}

        <View style={{ paddingHorizontal: gutter, gap: 10 }}>
          <Txt w={700}>Dịch vụ</Txt>
          {templates.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {templates.map((t) => (
                <Chip key={t.id} label={t.name} selected={template?.id === t.id} onPress={() => setTemplateId(t.id)} />
              ))}
            </View>
          ) : (
            <Txt color={colors.inkSoft}>Hồ sơ của bạn chưa chọn nghề nào.</Txt>
          )}
          {template ? (
            <Txt v="meta" color={colors.muted}>
              {categoryLabel(template.category)} · khách bấm vào bài sẽ đặt được đúng dịch vụ này
            </Txt>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: gutter, gap: 10 }}>
          <Txt w={700}>Tên mẫu</Txt>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Gel trơn hồng đất"
            placeholderTextColor={colors.muted}
            maxLength={80}
            style={{ height: 50, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts[600], fontSize: 15, color: colors.ink }}
          />
          <Txt w={700}>Mô tả</Txt>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Màu, chất liệu, thời gian làm…"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={600}
            style={{ minHeight: 96, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
          />
        </View>

        <View style={{ paddingHorizontal: gutter, gap: 10 }}>
          {error ? <ErrorNote text={error} /> : null}
          <Button label={progress ?? "Đăng tác phẩm"} full size="lg" busy={Boolean(progress)} disabled={!ready} onPress={() => void submit()} />
          {!photos.length ? (
            <Txt v="meta" color={colors.muted} center>
              Cần ít nhất một ảnh.
            </Txt>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function MediaButton({ icon, label, onPress }: { icon: "camera" | "photos"; label: string; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={label}
      style={{ width: 96, height: 120, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 6 }}
    >
      <Icon name={icon} size={24} />
      <Txt v="meta" w={600}>
        {label}
      </Txt>
    </Press>
  )
}
