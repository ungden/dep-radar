import * as React from "react"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { ScrollView, View } from "react-native"
import { webLink } from "@/data/links"
import { CategoryIcon } from "@/components/category-icon"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/**
 * 360dep Đối tác, for someone who wants to work rather than book: the only
 * door to it from the customer side is one quiet row at the bottom of Tôi.
 * Opening a freelancer profile picks a unique public address on the server,
 * which lives on the web for now.
 */
export default function Partner() {
  const app = useApp()

  const openProfile = async () => {
    await WebBrowser.openBrowserAsync(webLink("/doi-tac"))
    // They may have just opened one: the switch to 360dep Đối tác then shows in Tôi.
    void app.refresh()
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: gutter, gap: 16 }}>
      <Txt v="h2">Trở thành đối tác 360dep</Txt>
      <Txt color={colors.inkSoft}>
        Dành cho thợ làm đẹp, người chụp ảnh, quay clip và người mẫu. Tài khoản khách của bạn giữ nguyên; phần đối tác tách riêng.
      </Txt>
      <Option
        icon={<CategoryIcon id="camera" size={36} />}
        title="Thợ, người chụp ảnh, quay clip"
        text="Mở hồ sơ đối tác, đăng dịch vụ và bảng giá, nhận lịch từ khách. Mở trên web."
        external
        onPress={() => void openProfile()}
      />
      <Option
        icon={<CategoryIcon id="model-photo" size={36} />}
        title="Người mẫu"
        text="Xem tin tuyển mẫu: làm mẫu cho thợ, được làm đẹp miễn phí hoặc có thù lao."
        onPress={() => router.push("/tuyen-mau")}
      />
    </ScrollView>
  )
}

function Option({ icon, title, text, onPress, external }: { icon: React.ReactNode; title: string; text: string; onPress: () => void; external?: boolean }) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={`${title}. ${text}`}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16 }}
    >
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt w={700}>{title}</Txt>
        <Txt v="meta" color={colors.inkSoft}>
          {text}
        </Txt>
      </View>
      <Icon name={external ? "external" : "right"} size={14} color={colors.muted} />
    </Press>
  )
}
