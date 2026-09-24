import * as React from "react"
import { Image } from "expo-image"
import { File, Paths } from "expo-file-system"
import { Asset, requestPermissionsAsync } from "expo-media-library"
import * as Sharing from "expo-sharing"
import { Alert, ScrollView, View } from "react-native"
import { formatPrice } from "@/data/format"
import { webLink } from "@/data/links"
import { supabase } from "@/data/supabase"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, Chip, EmptyState, Photo } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

type Format = "story" | "post"

type OwnStats = { rate: number; standardRate: number; visits30d: number; clients: number; completed: number; saved: number }

/** What the partner's own QR and link brought (my_own_client_stats, 20261001100000). */
async function loadOwnStats(): Promise<OwnStats | null> {
  const { data, error } = await supabase.rpc("my_own_client_stats" as never)
  if (error) return null
  return (data as OwnStats | null) ?? null
}

/**
 * Ảnh portfolio: the freelancer's profile, or one of their works, as a picture
 * to post on Facebook, Instagram, TikTok or Zalo. The web draws it
 * (app/pros/[id]/portfolio, app/works/[id]/portfolio) with a QR code to their
 * booking page; here it is previewed, handed to the share sheet as an image
 * file, or saved to the photo library.
 */
export default function PortfolioImages() {
  const app = useApp()
  const pro = app.myPro
  const [format, setFormat] = React.useState<Format>("story")
  const [subject, setSubject] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<"share" | "save" | null>(null)
  const stats = useAsync(app.uid ? loadOwnStats : null, [app.uid])

  if (!pro) return <EmptyState title="Dành cho người làm" text="Ảnh portfolio có khi bạn đã có hồ sơ người làm." />
  if (!pro.published)
    return <EmptyState title="Hồ sơ chưa mở" text="Có ảnh portfolio khi hồ sơ của bạn đã mở với khách. Thêm tác phẩm, dịch vụ và giờ làm để mở hồ sơ." />

  const works = (app.data?.works ?? []).filter((w) => w.proUuid === app.uid && !w.hiddenReason)
  const path = subject ? `/works/${subject}/portfolio/${format}` : `/pros/${pro.id}/portfolio/${format}`
  const url = webLink(path)
  const fileName = `360dep-${subject ?? pro.id}-${format}.jpg`

  const download = () => File.downloadFileAsync(url, new File(Paths.cache, fileName), { idempotent: true })

  const share = async () => {
    setBusy("share")
    try {
      const file = await download()
      await Sharing.shareAsync(file.uri, { mimeType: "image/jpeg", UTI: "public.jpeg", dialogTitle: "Đăng ảnh portfolio" })
    } catch {
      Alert.alert("Chưa chia sẻ được", "Kiểm tra mạng rồi thử lại nhé.")
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    setBusy("save")
    try {
      const permission = await requestPermissionsAsync(true, ["photo"])
      if (!permission.granted) {
        Alert.alert("Cần quyền lưu ảnh", "Cho phép 360dep thêm ảnh vào thư viện trong Cài đặt để lưu ảnh portfolio.")
        return
      }
      const file = await download()
      await Asset.create(file.uri)
      haptic.success()
      Alert.alert("Đã lưu vào thư viện ảnh", "Mở Facebook, Instagram, TikTok hoặc Zalo và đăng từ thư viện.")
    } catch {
      Alert.alert("Chưa lưu được", "Kiểm tra mạng rồi thử lại nhé.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 48 }}>
      <Txt color={colors.inkSoft}>
        Ảnh tự làm từ tác phẩm, đánh giá và bảng giá mới nhất của bạn. Khách quét mã QR trên ảnh là mở ngay trang đặt lịch của bạn.
      </Txt>

      {stats.value ? <OwnClients stats={stats.value} /> : null}

      {works.length > 0 && (
        <View style={{ gap: 10 }}>
          <Txt v="title">Ảnh cho</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            <Subject label="Cả hồ sơ" selected={subject === null} onPress={() => setSubject(null)} uri={pro.avatar} />
            {works.map((w) => (
              <Subject
                key={w.id}
                label={w.title}
                selected={subject === w.id}
                onPress={() => setSubject(w.id)}
                uri={w.kind === "before_after" ? (w.images[1] ?? w.images[0]) : w.images[0]}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label="Story 9:16" selected={format === "story"} onPress={() => setFormat("story")} />
        <Chip label="Bài đăng 4:5" selected={format === "post"} onPress={() => setFormat("post")} />
      </View>

      <View
        style={{
          alignSelf: "center",
          width: format === "story" ? "72%" : "88%",
          aspectRatio: format === "story" ? 9 / 16 : 4 / 5,
          borderRadius: radius.md,
          overflow: "hidden",
          backgroundColor: "#2A1B1E",
        }}
      >
        <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="cover" transition={200} cachePolicy="none" accessibilityLabel="Ảnh xem trước" />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button label="Chia sẻ" icon="share" busy={busy === "share"} disabled={busy !== null} onPress={() => void share()} style={{ flex: 1 }} />
        <Button label="Lưu ảnh" icon="download" variant="secondary" busy={busy === "save"} disabled={busy !== null} onPress={() => void save()} style={{ flex: 1 }} />
      </View>
      <Txt v="meta" color={colors.muted} center>
        {format === "story" ? "Hợp với story Facebook, Instagram, Zalo và ảnh bìa TikTok." : "Hợp với trang cá nhân, fanpage và bảng tin Instagram."}
      </Txt>

    </ScrollView>
  )
}

function Subject({ label, uri, selected, onPress }: { label: string; uri?: string; selected: boolean; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} style={{ width: 92, gap: 6 }}>
      <Photo uri={uri} ratio={1} rounded={radius.md} style={{ borderWidth: 2, borderColor: selected ? colors.accent : "transparent" }} />
      <Txt v="meta" numberOfLines={1} w={selected ? 700 : 400} color={selected ? colors.ink : colors.inkSoft}>
        {label}
      </Txt>
    </Press>
  )
}

function OwnClients({ stats }: { stats: OwnStats }) {
  const pct = (rate: number) => `${Math.round(rate * 100)}%`
  const figures = [
    ["Lượt mở 30 ngày", String(stats.visits30d)],
    ["Khách mang về", String(stats.clients)],
    ["Lịch đã xong", String(stats.completed)],
    ["Tiết kiệm", formatPrice(stats.saved)],
  ]
  return (
    <Card>
      <Txt w={700}>Khách bạn tự mang về</Txt>
      <Txt v="meta" color={colors.inkSoft}>
        Khách mới đến từ mã QR hoặc link của bạn chỉ tính hoa hồng {pct(stats.rate)} (thay vì {pct(stats.standardRate)}), cho mọi lịch của họ với bạn.
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        {figures.map(([label, value]) => (
          <View key={label} style={{ flexBasis: "47%", flexGrow: 1, backgroundColor: colors.subtle, borderRadius: radius.sm, padding: 10 }}>
            <Txt v="meta" color={colors.muted}>
              {label}
            </Txt>
            <Txt w={700} style={{ fontSize: 17 }}>
              {value}
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  )
}
