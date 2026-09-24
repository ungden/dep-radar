import * as React from "react"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { Alert, ScrollView, Switch, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { setAcceptingJobs } from "@/data/actions"
import { webLink } from "@/data/links"
import { supabase } from "@/data/supabase"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Avatar, Divider, VerifiedMark } from "@/ui/bits"
import { Icon, type IconName } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/**
 * Where the profile's review stands (20260929100000). Publishing itself is on
 * the web; the app only says whether it is waiting or what to fix. Null while
 * loading, and on a database without the review columns.
 */
function useReview(uid: string | null) {
  const [review, setReview] = React.useState<{ status: string; note: string } | null>(null)
  React.useEffect(() => {
    if (!uid) return
    let live = true
    void supabase
      .from("pros")
      .select("review_status, review_note")
      .eq("id", uid)
      .maybeSingle()
      .then(({ data }) => {
        if (live && data) setReview({ status: String(data.review_status ?? ""), note: String(data.review_note ?? "") })
      })
    return () => {
      live = false
    }
  }, [uid])
  return review
}

export default function StudioMe() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const pro = app.myPro
  const [accepting, setAccepting] = React.useState(pro?.acceptingJobs ?? true)
  const review = useReview(app.uid ?? null)
  if (!pro || !app.uid) return null
  const pending = !pro.published && review?.status === "pending"
  const refused = !pro.published && (review?.status === "changes_requested" || review?.status === "rejected")
  const uid = app.uid

  const toggle = async (value: boolean) => {
    setAccepting(value)
    const res = await setAcceptingJobs(uid, value)
    if (!res.ok) {
      setAccepting(!value)
      return Alert.alert("Chưa đổi được", res.error)
    }
    void app.refresh()
  }
  const web = (path: string) => async () => {
    await WebBrowser.openBrowserAsync(webLink(path))
    void app.refresh()
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40, gap: 20 }}>
      <StudioHeader title="Tôi" />
      <View style={{ paddingHorizontal: gutter, gap: 20 }}>
        <Press
          onPress={() => router.push({ pathname: "/pros/[id]", params: { id: pro.id } })}
          accessibilityLabel="Xem hồ sơ công khai"
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}
        >
          <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Txt v="lead" w={700}>
                {pro.name}
              </Txt>
              {pro.identity === "verified" ? <VerifiedMark /> : null}
            </View>
            <Txt v="meta" color={colors.inkSoft}>
              {pro.published
                ? "Hồ sơ đang hiện với khách"
                : pending
                  ? "Đang chờ duyệt (thường vài phút)"
                  : refused
                    ? "Hồ sơ cần chỉnh trước khi hiện với khách"
                    : "Hồ sơ chưa công khai"}{" "}
              · xem như khách
            </Txt>
          </View>
          <Icon name="right" size={14} color={colors.muted} />
        </Press>

        {refused && review?.note ? (
          <Press
            onPress={web("/studio/profile/edit#mo-ho-so")}
            accessibilityRole="link"
            accessibilityLabel="Sửa hồ sơ và gửi duyệt lại, mở trên web"
            style={{ backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: 16, gap: 6 }}
          >
            <Txt w={700} color={colors.warning}>
              Cần sửa
            </Txt>
            {review.note
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => (
                <Txt key={line} v="meta">
                  • {line}
                </Txt>
              ))}
            <Txt v="meta" w={600} color={colors.warning}>
              Sửa xong bấm “Gửi duyệt lại” trên web
            </Txt>
          </Press>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt w={700}>Nhận lịch mới</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              {accepting ? "Khách đặt được lịch và bạn nhận được việc mới." : "Tạm nghỉ: khách không đặt được, lịch đã nhận vẫn giữ."}
            </Txt>
          </View>
          <Switch value={accepting} onValueChange={(v) => void toggle(v)} trackColor={{ true: colors.accent, false: colors.subtleStrong }} accessibilityLabel="Nhận lịch mới" />
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>
          <Row icon="briefcase" label="Dịch vụ và bảng giá" onPress={web("/studio/services")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="clock" label="Giờ làm việc" onPress={web("/studio/schedule")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="person" label="Sửa hồ sơ" onPress={web("/studio/profile/edit")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="photos" label="Quản lý tác phẩm" onPress={web("/studio/works")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="shop" label="Ví và hoa hồng" onPress={web("/studio/wallet")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="verified" label="Xác minh danh tính" onPress={web("/studio/verify")} />
        </View>
        <Txt v="meta" color={colors.muted}>
          Cài đặt đối tác chưa có trong app: các mục trên mở trang web 360dep ngay trong app, và bạn có thể phải đăng nhập lại ở đó.
        </Txt>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>
          <Row icon="gift" label="Giới thiệu bạn bè" internal onPress={() => router.push("/gioi-thieu")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row
            icon="swap"
            label="Chuyển sang chế độ khách"
            internal
            onPress={async () => {
              await app.switchMode("customer")
              router.replace("/")
            }}
          />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="logout" label="Đăng xuất" internal onPress={() => void app.signOut().then(() => router.replace("/"))} />
        </View>
      </View>
    </ScrollView>
  )
}

function Row({ icon, label, onPress, internal }: { icon: IconName; label: string; onPress: () => void; internal?: boolean }) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={internal ? label : `${label}, mở trên web`}
      accessibilityRole={internal ? "button" : "link"}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, height: 54 }}
    >
      <Icon name={icon} size={20} />
      <Txt w={600} style={{ flex: 1 }}>
        {label}
      </Txt>
      {internal ? null : (
        <Txt v="meta" color={colors.muted}>
          mở trên web
        </Txt>
      )}
      <Icon name={internal ? "right" : "external"} size={14} color={colors.muted} />
    </Press>
  )
}
