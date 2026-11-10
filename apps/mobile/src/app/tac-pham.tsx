import * as React from "react"
import { Image } from "expo-image"
import { Stack, router } from "expo-router"
import { Alert, ScrollView, View, useWindowDimensions } from "react-native"
import { getTemplate } from "@/shared"
import { imageUrl } from "@/data/links"
import { deleteWork, listMyWorks, type MyWork } from "@/data/works"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"
import { useToast } from "@/ui/toast"

const GAP = 12

/** The partner's own works: see them all, open one, remove one, post another. */
export default function MyWorks() {
  const app = useApp()
  const uid = app.uid
  const works = useAsync(uid ? () => listMyWorks(uid) : null, [uid])
  const { width } = useWindowDimensions()
  const toast = useToast(40)
  const tile = Math.floor((width - gutter * 2 - GAP) / 2)

  const remove = (w: MyWork) =>
    Alert.alert("Xoá tác phẩm này?", "Khách sẽ không thấy nữa. Không thể hoàn tác.", [
      { text: "Thôi", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          const res = await deleteWork(w.id)
          if (!res.ok) {
            haptic.error()
            return Alert.alert("Chưa xoá được", res.error)
          }
          haptic.success()
          works.setValue((list) => list?.filter((x) => x.id !== w.id))
          toast.show("Đã xoá tác phẩm")
          void app.refresh()
        },
      },
    ])

  const list = works.value ?? []
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen options={{ title: list.length ? `Tác phẩm (${list.length})` : "Tác phẩm" }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 48 }} refreshControl={refreshControl(works.refreshing, () => void works.refresh())}>
        <Button label="Đăng tác phẩm mới" icon="plus" full onPress={() => router.navigate("/studio/dang")} />
        {works.error ? <ErrorNote text={works.error} onRetry={() => void works.reload()} /> : null}
        {works.loading && !works.value ? (
          <View style={{ flexDirection: "row", gap: GAP }}>
            <Skeleton style={{ width: tile, height: tile, borderRadius: radius.md }} />
            <Skeleton style={{ width: tile, height: tile, borderRadius: radius.md }} />
          </View>
        ) : null}
        {works.value && !list.length ? <EmptyState title="Chưa có tác phẩm" text="Đăng ảnh thật bạn làm để khách xem trước khi đặt." /> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
          {list.map((w) => (
            <View key={w.id} style={{ width: tile, gap: 6 }}>
              <Press onPress={() => router.push({ pathname: "/works/[id]", params: { id: w.slug } })} accessibilityLabel={`${w.title}. Xem`} style={{ gap: 6 }}>
                <Image source={w.cover ? { uri: imageUrl(w.cover) } : undefined} recyclingKey={w.id} contentFit="cover" style={{ width: tile, height: tile, borderRadius: radius.md, backgroundColor: colors.subtle }} />
                <Txt w={600} numberOfLines={1}>
                  {w.title}
                </Txt>
                <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
                  {getTemplate(w.templateId)?.name ?? ""} · {w.photos} ảnh
                </Txt>
              </Press>
              <Press onPress={() => remove(w)} accessibilityLabel={`Xoá ${w.title}`} style={{ minHeight: 36, justifyContent: "center" }}>
                <Txt v="meta" w={600} color={colors.danger}>
                  Xoá
                </Txt>
              </Press>
            </View>
          ))}
        </View>
      </ScrollView>
      {toast.element}
    </View>
  )
}
