import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { Alert, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { formatPhone } from "@/data/format"
import { webLink } from "@/data/links"
import { SignInGate } from "@/components/sign-in-gate"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Avatar, Divider } from "@/ui/bits"
import { Icon, type IconName } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

export default function Me() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  if (!app.uid) return <SignInGate title="Tôi" text="Đăng nhập để lưu mẫu yêu thích, đặt lịch và nhắn tin với người làm." />

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

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>
        <Row icon="heart" label="Đã lưu" detail={app.me.savedWorkIds.length ? String(app.me.savedWorkIds.length) : undefined} onPress={() => router.push("/da-luu")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="home" label="Địa chỉ" detail={app.me.addresses.length ? String(app.me.addresses.length) : undefined} onPress={() => router.push("/dia-chi")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="chat" label="Tin nhắn" onPress={() => router.push("/tin-nhan")} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="bell" label="Thông báo" onPress={() => router.push("/thong-bao")} />
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>
        <Row icon="swap" label={app.myPro ? "Chuyển sang Studio" : "Mở hồ sơ người làm"} detail={app.myPro ? undefined : "trên web"} onPress={() => void toStudio()} />
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>
        <Row icon="external" label="Cài đặt tài khoản" detail="trên web" onPress={() => void WebBrowser.openBrowserAsync(webLink("/me/cai-dat"))} />
        <Divider style={{ marginLeft: 52 }} />
        <Row icon="info" label="Chính sách và trợ giúp" detail="trên web" onPress={() => void WebBrowser.openBrowserAsync(webLink("/tro-giup"))} />
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
      </View>
      <Txt v="meta" color={colors.muted}>
        Xoá tài khoản nằm trong Cài đặt tài khoản trên web.
      </Txt>
    </ScrollView>
  )
}

function Row({ icon, label, detail, onPress }: { icon: IconName; label: string; detail?: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityLabel={label} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, height: 54 }}>
      <Icon name={icon} size={20} />
      <Txt w={600} style={{ flex: 1 }}>
        {label}
      </Txt>
      {detail ? (
        <Txt v="meta" color={colors.muted}>
          {detail}
        </Txt>
      ) : null}
      <Icon name="right" size={14} color={colors.muted} />
    </Press>
  )
}
