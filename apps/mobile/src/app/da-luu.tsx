import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { View } from "react-native"
import type { AppWork } from "@/data/public"
import { PostCard } from "@/components/cards"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter } from "@/theme"
import { EmptyState } from "@/ui/bits"

export default function Saved() {
  const app = useApp()
  const browse = useBrowse()
  // Newest save first is not stored, so this keeps the order they were saved in.
  const works = app.me.savedWorkIds.map((id) => app.data?.works.find((w) => w.dbId === id)).filter((w): w is AppWork => Boolean(w))

  return (
    <FlashList
      style={{ backgroundColor: colors.canvas }}
      data={works}
      masonry
      numColumns={2}
      keyExtractor={(w) => w.id}
      contentContainerStyle={{ paddingHorizontal: gutter - 6, paddingTop: 12 }}
      extraData={app.me.savedWorkIds}
      renderItem={({ item }) => {
        const pro = browse.proById.get(item.proId)
        return (
          <View style={{ paddingHorizontal: 6 }}>
            <PostCard work={item} pro={pro} services={browse.services} distanceKm={pro ? app.distanceTo(pro) : null} />
          </View>
        )
      }}
      ListEmptyComponent={
        <EmptyState title="Chưa lưu mẫu nào" text="Bấm trái tim trên ảnh để lưu mẫu bạn thích." action="Khám phá" onAction={() => router.navigate("/")} />
      }
    />
  )
}
