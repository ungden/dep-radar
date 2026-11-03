import * as React from "react"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { ScrollView, View } from "react-native"
import { formatPrice } from "@/data/format"
import { webLink } from "@/data/links"
import { supabase } from "@/data/supabase"
import { AcceptingSwitch } from "@/components/accepting-switch"
import { useFee } from "@/components/fee-card"
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
  const pro = app.myPro
  const fee = useFee(app.uid ?? null)
  const review = useReview(app.uid ?? null)
  if (!pro || !app.uid) return null
  const pending = !pro.published && review?.status === "pending"
  const refused = !pro.published && (review?.status === "changes_requested" || review?.status === "rejected")
  const uid = app.uid

  const web = (path: string) => async () => {
    await WebBrowser.openBrowserAsync(webLink(path))
    void app.refresh()
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
    <StudioHeader title="Tôi" />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: gutter, gap: 24 }}>
        <Press
          onPress={() => router.push({ pathname: "/pros/[id]", params: { id: pro.id } })}
          accessibilityLabel="Xem hồ sơ công khai"
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}
        >
          <Avatar name={pro.name} uri={pro.avatar} artist tone={pro.tone} size={56} />
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
                  ? "Đang chờ duyệt (thường trong 24 giờ)"
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
            onPress={() => router.push("/ho-so-doi-tac?step=5")}
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
              Sửa xong bấm “Gửi duyệt lại” trong app
            </Txt>
          </Press>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt w={700}>Nhận lịch mới</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              {pro.acceptingJobs ? "Khách đặt được lịch và bạn nhận được việc mới." : "Tạm nghỉ: khách không đặt được, lịch đã nhận vẫn giữ."}
            </Txt>
          </View>
          <AcceptingSwitch />
        </View>

        <Press onPress={web("/studio/wallet")} accessibilityRole="link" accessibilityLabel="Ví và phí 360dep, mở trên web" style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="meta" color={colors.muted}>
              Số dư ví
            </Txt>
            <Txt v="h2" tabular color={fee.owing ? colors.danger : colors.ink}>
              {fee.value ? formatPrice(fee.value.balance) : "—"}
            </Txt>
          </View>
          <View style={{ minHeight: 38, paddingHorizontal: 18, borderRadius: radius.full, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
            <Txt v="meta" w={700} color={colors.accentDark}>
              Nạp ví
            </Txt>
          </View>
        </Press>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
          <Row icon="briefcase" label="Dịch vụ và bảng giá" internal onPress={() => router.push("/ho-so-doi-tac?step=1")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="clock" label="Giờ làm việc" internal onPress={() => router.push("/ho-so-doi-tac?step=3")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="person" label="Sửa hồ sơ" internal onPress={() => router.push("/ho-so-doi-tac?step=0")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="photos" label="Quản lý tác phẩm" internal onPress={() => router.push("/ho-so-doi-tac?step=4")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="briefcase" label="Network MCN của tôi" onPress={web("/studio/network")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="verified" label="Xác minh danh tính" onPress={web("/studio/verify")} />
        </View>
        <Txt v="meta" color={colors.muted}>
          Ví, network MCN và xác minh danh tính mở trên web; bạn có thể cần đăng nhập lại.
        </Txt>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
          <Row icon="share" label="Ảnh portfolio để đăng mạng xã hội" internal onPress={() => router.push("/anh-portfolio")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="gift" label="Giới thiệu bạn bè" internal onPress={() => router.push("/gioi-thieu")} />
          <Divider style={{ marginLeft: 52 }} />
          <Row icon="flag" label="Báo cáo vấn đề" internal onPress={() => router.push("/bao-cao")} />
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
    </View>
  )
}

function Row({ icon, label, onPress, internal }: { icon: IconName; label: string; onPress: () => void; internal?: boolean }) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={internal ? label : `${label}, mở trên web`}
      accessibilityRole={internal ? "button" : "link"}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, minHeight: 56, paddingVertical: 14 }}
    >
      <Icon name={icon} size={20} />
      <Txt style={{ flex: 1 }}>
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
