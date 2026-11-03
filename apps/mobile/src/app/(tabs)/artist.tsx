import * as React from "react"
import { router, useLocalSearchParams } from "expo-router"
import { FlatList, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { getTemplate } from "@/shared"
import { fold } from "@/data/format"
import { ProCardSkeleton } from "@/components/cards"
import { OfflineNote } from "@/components/offline-note"
import { ArtistCard, Pill } from "@/components/tiles"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, fonts, gutter, radius } from "@/theme"
import { EmptyState, ErrorNote } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/**
 * The second way to book: the customer picks the service they want, sees who
 * does it with that person's work, what they offer and their price, and
 * chooses. Only people
 * taking bookings; nearest first when we know the address.
 */
export default function Artists() {
  const params = useLocalSearchParams<{ service?: string }>()
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const [service, setService] = React.useState<string | null>(params.service ?? null)
  const [query, setQuery] = React.useState("")

  // Arriving from a service page chooses that service, also when the tab was already open.
  React.useEffect(() => {
    if (params.service) setService(params.service)
  }, [params.service])

  const people = React.useMemo(() => browse.peopleFor("all"), [browse])

  // The services someone here does, most people first; the one asked for stays even with nobody.
  const chips = React.useMemo(() => {
    const here = new Set(people.map((p) => p.pro.id))
    const counts = new Map<string, number>()
    for (const s of browse.services) {
      if (!s.active || !here.has(s.proId) || !Object.keys(s.prices).length || getTemplate(s.templateId)?.addon) continue
      counts.set(s.templateId, (counts.get(s.templateId) ?? 0) + 1)
    }
    if (params.service && !counts.has(params.service)) counts.set(params.service, 0)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => getTemplate(id))
      .filter((t) => t !== undefined)
  }, [people, browse.services, params.service])

  const chosen = service ? getTemplate(service) : undefined
  const needle = fold(query.trim())
  const shown = people.filter(({ pro }) => {
    if (needle && !fold(pro.name).includes(needle)) return false
    return !chosen || browse.services.some((s) => s.proId === pro.id && s.templateId === chosen.id && s.active && Object.keys(s.prices).length)
  })

  // Work of the chosen service first, so the card answers "how do they do this".
  const photosOf = (proId: string) => {
    if (!chosen) return browse.photosOf.get(proId) ?? []
    return [...browse.works]
      .filter((w) => w.proId === proId && w.images[0])
      .sort((a, b) => Number(b.templateId === chosen.id) - Number(a.templateId === chosen.id))
      .slice(0, 3)
      .map((w) => w.images[0])
  }

  // Named on the card: the chosen service first, then the rest.
  const servicesOf = (proId: string) =>
    browse.services
      .filter((s) => s.proId === proId && s.active && Object.keys(s.prices).length)
      .map((s) => getTemplate(s.templateId))
      .filter((t) => t !== undefined && !t.addon)
      .sort((a, b) => Number(b?.id === chosen?.id) - Number(a?.id === chosen?.id))
      .map((t) => t!.name)

  const loading = (!app.data || app.stale) && !app.dataError && app.configured
  const where = app.city ? ` ở ${app.city}` : ""
  const hasAddress = app.me.addresses.length > 0

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ gap: 12, paddingTop: insets.top + 8, paddingBottom: 8, backgroundColor: colors.accentSoft }}>
        <Txt v="h1" style={{ paddingHorizontal: gutter }}>
          Chọn Artist
        </Txt>
        <View style={{ marginHorizontal: gutter, minHeight: 40, borderRadius: radius.sm, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
          <Icon name="search" size={18} color={colors.accent} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm tên Artist"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Tìm tên Artist"
            style={{ flex: 1, fontFamily: fonts[400], fontSize: 17, color: colors.ink }}
          />
        </View>
        <View style={{ gap: 2 }}>
          <Txt v="meta" w={600} style={{ paddingHorizontal: gutter }}>
            Bạn muốn làm dịch vụ gì?
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }}>
            <Pill label="Tất cả" selected={!chosen} onCanvas={false} onPress={() => setService(null)} />
            {chips.map((t) => (
              <Pill key={t.id} label={t.name} selected={chosen?.id === t.id} onCanvas={false} onPress={() => setService(t.id)} />
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(p) => p.pro.id}
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: gutter, gap: 20 }}
        refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <OfflineNote />
            {!loading && shown.length ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Txt v="meta" color={colors.muted} style={{ flexShrink: 1 }}>
                  {shown.length} Artist{chosen ? ` làm ${chosen.name}` : ""}
                  {where}
                </Txt>
                <Txt v="meta" w={600}>
                  {hasAddress ? "Gần bạn trước" : "Đánh giá cao trước"}
                </Txt>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item: { pro, km } }) => (
          <ArtistCard
            pro={pro}
            photos={photosOf(pro.id)}
            photoCount={browse.works.filter((w) => w.proId === pro.id && w.images[0]).length}
            services={servicesOf(pro.id)}
            illustrationOf={chosen?.category ?? pro.categories[0] ?? "nail"}
            price={browse.priceOf(pro.id, chosen?.id)}
            distanceKm={km}
            serviceId={chosen?.id}
          />
        )}
        ListFooterComponent={
          !loading && shown.length ? (
            <Press
              onPress={() => router.push(chosen ? { pathname: "/yeu-cau/moi", params: { template: chosen.id } } : "/yeu-cau/moi")}
              accessibilityRole="button"
              accessibilityLabel="Đặt theo dịch vụ, Artist sẽ vào nhận đơn"
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 18, marginTop: 20, marginBottom: 8, borderRadius: radius.lg, backgroundColor: colors.highlightSoft }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Txt w={700}>Chưa thấy Artist hợp ý?</Txt>
                <Txt v="meta" color={colors.inkSoft}>
                  Đặt theo dịch vụ, Artist sẽ vào nhận đơn.
                </Txt>
              </View>
              <View style={{ minHeight: 34, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                <Txt v="meta" w={700} color={colors.accentDark}>
                  Đặt ngay
                </Txt>
              </View>
            </Press>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 12 }}>
              <ProCardSkeleton />
              <ProCardSkeleton />
            </View>
          ) : app.dataError && !app.data ? (
            <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
          ) : needle ? (
            <EmptyState title={`Không có Artist tên “${query.trim()}”`} text="Thử tên khác, hoặc bỏ bớt lựa chọn dịch vụ." />
          ) : (
            <EmptyState
              title={chosen ? `Chưa có Artist làm ${chosen.name}${where}` : `Chưa có Artist nào${where}`}
              text="Bạn vẫn đặt được theo dịch vụ, Artist mới vào sẽ thấy đơn của bạn."
              action="Đặt theo dịch vụ"
              onAction={() => router.push(chosen ? { pathname: "/yeu-cau/moi", params: { template: chosen.id } } : "/yeu-cau/moi")}
            />
          )
        }
      />
    </View>
  )
}
