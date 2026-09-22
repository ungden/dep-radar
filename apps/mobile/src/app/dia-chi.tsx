import * as WebBrowser from "expo-web-browser"
import { ScrollView, View } from "react-native"
import { webLink } from "@/data/links"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState } from "@/ui/bits"
import { Txt } from "@/ui/text"

/** Read-only here; adding and editing an address happens on the web for now. */
export default function Addresses() {
  const app = useApp()
  const edit = async () => {
    await WebBrowser.openBrowserAsync(webLink("/me/dia-chi"))
    void app.refreshMe()
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: gutter, gap: 12 }}>
      {app.me.addresses.length ? (
        <>
          {app.me.addresses.map((a) => (
            <View key={a.id} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Txt w={700}>{a.label || "Địa chỉ"}</Txt>
                {a.isDefault ? (
                  <Txt v="meta" w={600} color={colors.inkSoft}>
                    Mặc định
                  </Txt>
                ) : null}
              </View>
              <Txt color={colors.inkSoft}>{[a.detail, a.district, a.city].filter(Boolean).join(", ")}</Txt>
              {a.note ? (
                <Txt v="meta" color={colors.muted}>
                  {a.note}
                </Txt>
              ) : null}
            </View>
          ))}
          <Txt v="meta" color={colors.muted}>
            Khoảng cách tới người làm được ước tính từ địa chỉ mặc định, theo quận.
          </Txt>
          <Button label="Thêm hoặc sửa trên web" variant="secondary" icon="external" onPress={() => void edit()} />
        </>
      ) : (
        <EmptyState
          title="Chưa có địa chỉ"
          text="Lưu một địa chỉ để thấy khoảng cách tới người làm và đặt làm tại nhà."
          action="Thêm địa chỉ trên web"
          onAction={() => void edit()}
        />
      )}
    </ScrollView>
  )
}
