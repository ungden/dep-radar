import { Stack, useLocalSearchParams } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { categoryLabel, getOccasion, occasionTemplates } from "@/shared"
import { ProCard } from "@/components/cards"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter } from "@/theme"
import { EmptyState } from "@/ui/bits"
import { Txt } from "@/ui/text"

/**
 * An occasion: the services people book together for it, in the order they
 * happen on the day, each with the people who actually list it.
 */
export default function OccasionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const browse = useBrowse()
  const { width } = useWindowDimensions()
  const occasion = getOccasion(id)
  if (!occasion) return <EmptyState title="Không có dịp này" />
  const templates = occasionTemplates(occasion)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingVertical: gutter, gap: 28, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: occasion.title }} />
      <View style={{ paddingHorizontal: gutter, gap: 6 }}>
        <Txt v="h1">{occasion.title}</Txt>
        <Txt color={colors.inkSoft}>{occasion.subtitle}</Txt>
      </View>
      {templates.map((t, i) => {
        const people = browse.pros
          .filter((p) => browse.services.some((s) => s.proId === p.id && s.templateId === t.id && s.active && Object.keys(s.prices).length))
          .map((p) => ({ pro: p, km: app.distanceTo(p) }))
          .sort((a, b) => (a.km ?? 999) - (b.km ?? 999))
        return (
          <View key={t.id} style={{ gap: 12 }}>
            <View style={{ paddingHorizontal: gutter, gap: 4 }}>
              <Txt v="meta" w={700} color={colors.muted}>
                BƯỚC {i + 1} · {categoryLabel(t.category).toUpperCase()}
              </Txt>
              <Txt v="title">{t.name}</Txt>
              <Txt color={colors.inkSoft}>{t.description}</Txt>
            </View>
            {people.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}>
                {people.map(({ pro, km }) => (
                  <ProCard
                    key={pro.id}
                    width={Math.min(300, width * 0.78)}
                    pro={pro}
                    photos={browse.photosOf.get(pro.id) ?? []}
                    price={browse.priceOf(pro.id, t.id)}
                    distanceKm={km}
                  />
                ))}
              </ScrollView>
            ) : (
              <Txt color={colors.muted} style={{ paddingHorizontal: gutter }}>
                Chưa có ai nhận dịch vụ này{app.city ? ` ở ${app.city}` : ""}.
              </Txt>
            )}
          </View>
        )
      })}
      <Txt v="meta" color={colors.muted} style={{ paddingHorizontal: gutter }}>
        Mỗi người được đặt riêng; chọn cùng một buổi để làm liền nhau.
      </Txt>
    </ScrollView>
  )
}
