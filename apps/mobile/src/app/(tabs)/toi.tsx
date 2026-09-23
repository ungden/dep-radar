import * as React from "react"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { Alert, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { deleteMyAccount } from "@/data/actions"
import { formatPhone } from "@/data/format"
import { webLink } from "@/data/links"
import { SignInGate } from "@/components/sign-in-gate"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Avatar, Divider } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon, type IconName } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

export default function Me() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const [deleting, setDeleting] = React.useState(false)
  if (!app.uid) return <SignInGate title="Tôi" text="Đăng nhập để lưu mẫu yêu thích, đặt lịch và nhắn tin với người làm." />
  const uid = app.uid

  const account = app.me.account
  const name = account?.fullName ?? "Bạn"

  const toStudio = async () => {
    if (!app.myPro) {
      // Opening a freelancer profile picks a unique public address on the server; that lives on the web for now.
      await WebBrowser.openBrowserAsync(webLink("/studio/onboarding"))
      void app.refresh()
      return
    }
    await app.switchMode("pro")
    router.replace("/studio")
  }

  const deleteAccount = () =>
    Alert.alert(
      "Xoá tài khoản?",
      "Tên, số điện thoại, địa chỉ, mẫu đã lưu và ảnh bạn đăng sẽ bị xoá. Lịch hẹn đã xong vẫn được giữ ẩn danh cho người làm. Không thể hoàn tác.",
      [
        { text: "Thôi", style: "cancel" },
        {
          text: "Xoá vĩnh viễn",
          style: "destructive",
          onPress: async () => {
            setDeleting(true)
            const res = await deleteMyAccount(uid)
            setDeleting(false)
            if (!res.ok) {
              haptic.error()
              return Alert.alert("Chưa xoá được tài khoản", res.error)
            }
            haptic.success()
            await app.signOut()
            router.replace("/")
            Alert.alert("Đã xoá tài khoản", "Cảm ơn bạn đã dùng 360dep.")
          },
        },
      ],
    )

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, paddingBottom: 40, gap: 20 }}>
      <Txt v="h1">Tôi</Txt>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar name={name} size={60} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="title">{name}</Txt>
          <Txt v="meta" color={colors.inkSoft}>
            {account?.phone ? formatPhone(account.phone) : "Chưa có số điện thoại"}
          </Txt>
          {account?.email ? (
            <Txt v="meta" color={colors.muted}>
              {account.email}
            </Txt>
          ) : null}
        </View>
      </View>
      {!account?.phone ? (
        <Press onPress={() => router.push("/so-dien-thoai")} style={{ backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: 14 }}>
          <Txt w={700} color={colors.warning}>
            Thêm số điện thoại để đặt lịch
          </Txt>
          <Txt v="meta" color={colors.warning}>
            Người làm gọi số này để xác nhận lịch hẹn.
          </Txt>
        </Press>
      ) : null}

      <Section>
        <Row icon="heart" label="Đã lưu" detail={app.me.savedWorkIds.length ? String(app.me.savedWorkIds.length) : undefined} onPress={() => router.push("/da-luu")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="megaphone" label="Yêu cầu của tôi" onPress={() => router.push("/yeu-cau")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="home" label="Địa chỉ" detail={app.me.addresses.length ? String(app.me.addresses.length) : undefined} onPress={() => router.push("/dia-chi")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="chat" label="Tin nhắn" onPress={() => router.push("/tin-nhan")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="bell" label="Thông báo" onPress={() => router.push("/thong-bao")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="gift" label="Giới thiệu bạn bè và voucher" onPress={() => router.push("/gioi-thieu")} />
      </Section>

      <Section>
        <Row icon="portrait" label="Tuyển mẫu" detail="làm mẫu cho thợ" onPress={() => router.push("/tuyen-mau")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="swap" label={app.myPro ? "Chuyển sang Studio" : "Mở hồ sơ người làm"} detail={app.myPro ? undefined : "mở trên web"} onPress={() => void toStudio()} />
      </Section>

      <Section>
        <Row icon="block" label="Người đã chặn" detail={app.blocked.size ? String(app.blocked.size) : undefined} onPress={() => router.push("/da-chan")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="info" label="Chính sách và trợ giúp" detail="mở trên web" onPress={() => void WebBrowser.openBrowserAsync(webLink("/tro-giup"))} />
        <Divider style={{ marginLeft: 52 }} />
        <Row
          icon="logout"
          label="Đăng xuất"
          onPress={() =>
            Alert.alert("Đăng xuất?", undefined, [
              { text: "Thôi", style: "cancel" },
              { text: "Đăng xuất", style: "destructive", onPress: () => void app.signOut() },
            ])
          }
        />
      </Section>

      <Section>
        <Row icon="trash" label={deleting ? "Đang xoá…" : "Xoá tài khoản"} danger onPress={deleting ? () => {} : deleteAccount} />
      </Section>
    </ScrollView>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>{children}</View>
}

function Row({ icon, label, detail, onPress, danger }: { icon: IconName; label: string; detail?: string; onPress: () => void; danger?: boolean }) {
  const color = danger ? colors.danger : colors.ink
  return (
    <Press onPress={onPress} accessibilityLabel={detail ? `${label}, ${detail}` : label} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, height: 54 }}>
      <Icon name={icon} size={20} color={color} />
      <Txt w={600} color={color} style={{ flex: 1 }}>
        {label}
      </Txt>
      {detail ? (
        <Txt v="meta" color={colors.muted}>
          {detail}
        </Txt>
      ) : null}
      {danger ? null : <Icon name="right" size={14} color={colors.muted} />}
    </Press>
  )
}
