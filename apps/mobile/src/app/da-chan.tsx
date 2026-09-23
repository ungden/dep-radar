import { ScrollView, View } from "react-native"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Avatar, EmptyState } from "@/ui/bits"
import { Txt } from "@/ui/text"

/** Everyone this person blocked, each with "Bỏ chặn". */
export default function Blocked() {
  const app = useApp()
  const ids = [...app.blocked]
  const nameOf = (id: string) => app.data?.pros.find((p) => p.uuid === id)
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: gutter, gap: 10 }}>
      {ids.length ? (
        ids.map((id) => {
          const pro = nameOf(id)
          const name = pro?.name ?? "Người dùng đã chặn"
          return (
            <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 }}>
              <Avatar name={name} uri={pro?.avatar} tone={pro?.tone} size={40} />
              <Txt w={600} style={{ flex: 1 }} numberOfLines={1}>
                {name}
              </Txt>
              <Button label="Bỏ chặn" size="sm" variant="secondary" onPress={() => void app.unblock(id)} />
            </View>
          )
        })
      ) : (
        <EmptyState title="Bạn chưa chặn ai" text="Chặn một người từ hồ sơ, bài đăng hoặc tin nhắn của họ (nút ⋯)." />
      )}
    </ScrollView>
  )
}
