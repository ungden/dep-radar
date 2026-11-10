import { requestCopy } from "@/shared"
import * as React from "react"
import { Image } from "expo-image"
import { router } from "expo-router"
import { FlatList, ScrollView, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CATEGORIES, SPA, SPA_TINT, editorialTemplates, marketplaceFeed, type CategoryId, type MarketplaceTile, type ServiceTemplate } from "@/shared"
import { OfflineNote } from "@/components/offline-note"
import { CategoryRail, Section, TileSkeleton, illustration, tileWidth } from "@/components/tiles"
import { TextTabs } from "@/components/switches"
import { TopBar } from "@/components/top-bar"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { formatDuration, formatPrice } from "@/data/format"
import { colors, gutter, radius } from "@/theme"
import { Avatar, EmptyState, ErrorNote } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

function loadingData(app: ReturnType<typeof useApp>) {
  return (!app.data || app.stale) && !app.dataError && app.configured
}

function EditorialTile({ template, width }: { template: ServiceTemplate; width: number }) {
  return <Press onPress={() => router.push({ pathname: "/dich-vu/[id]", params: { id: template.id } })} style={{ width, gap: 5 }}
    accessibilityLabel={`${template.name}, gợi ý dịch vụ, ảnh minh hoạ`}>
    <View style={{ height: width * 0.88, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.accentSoft }}>
      <Image source={{ uri: illustration(template.category, template.id === "makeup-bridal" ? 1 : template.id === "makeup-daily" ? 2 : 0) }} style={{ flex: 1 }} contentFit="cover" />
      <View style={{ position: "absolute", bottom: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: colors.surface }}>
        <Txt v="label">Ảnh minh hoạ</Txt>
      </View>
    </View>
    <Txt w={600} numberOfLines={2}>{template.name}</Txt>
    <Txt v="meta" color={colors.inkSoft}>Gợi ý dịch vụ</Txt>
    <Txt v="meta" color={colors.accentDark} w={700}>Xem gói và giá</Txt>
  </Press>
}

const openList = (category?: CategoryId) => router.push(category ? { pathname: "/dich-vu", params: { category } } : "/dich-vu")
const categories = (["makeup", "nail", "hair", "photophone"] as const).map((id) => ({ ...CATEGORIES.find((c) => c.id === id)!, ...(id === "photophone" ? { label: "Chụp ảnh" } : {}) }))

function WorkTile({ entry, width }: { entry: MarketplaceTile; width: number }) {
  const { pro, work, template, option, photo } = entry
  const open = () => work
    ? router.push({ pathname: "/works/[id]", params: { id: work.id, variant: option.variant.id } })
    : router.push({ pathname: "/pros/[id]", params: { id: pro.id, service: template.id, variant: option.variant.id } })
  return (
    <Press onPress={open} style={{ width, gap: 5 }} accessibilityLabel={`${work?.title ?? template.name}, ${pro.name}, ${formatPrice(option.minimumTotal)}`}>
      <View style={{ height: width * 0.88, borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
        {photo ? <Image source={{ uri: photo }} recyclingKey={entry.id} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : <Avatar name={pro.name} uri={pro.avatar} artist tone={pro.tone} size={56} />}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Avatar name={pro.name} uri={pro.avatar} artist tone={pro.tone} size={22} />
        <Txt v="meta" w={700} style={{ flex: 1 }} numberOfLines={1}>{pro.name}</Txt>
      </View>
      <Txt w={600} numberOfLines={2}>{template.name}</Txt>
      <Txt v="meta" color={colors.accentDark} w={700} tabular>{formatPrice(option.minimumTotal)} <Txt v="meta" color={colors.inkSoft}>· {formatDuration(option.durationMin)}</Txt></Txt>
      <Txt v="meta" color={colors.muted}>{!pro.acceptingJobs ? "Tạm nghỉ nhận lịch" : pro.homeService && !template.studioOnly ? "Tại nhà" : "Tại cơ sở"}{option.minimumQuantity > 1 ? ` · từ ${option.minimumQuantity} người` : ""}</Txt>
    </Press>
  )
}

export default function Explore() {
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const tile = tileWidth(width)
  const [tab, setTab] = React.useState<"for-you" | "following">("for-you")
  const [limit, setLimit] = React.useState(4)
  const feed = React.useMemo(() => marketplaceFeed({
    pros: browse.artists, works: browse.works, services: browse.services, city: app.city,
    studioOpen: app.studioBookingOpen, following: tab === "following" ? browse.followedSlugs : undefined,
  }), [browse, app.city, app.studioBookingOpen, tab])
  const supplements = tab === "for-you" && !loadingData(app) && (!app.dataError || app.data)
    ? editorialTemplates(new Set(feed.map((entry) => entry.template.id)), app.studioBookingOpen).slice(0, Math.max(0, 4 - feed.length))
    : []
  const display = [...feed.slice(0, limit), ...supplements]
  const spas = browse.spas
  const spaCover = spas.map((s) => browse.photosOf.get(s.pro.id)?.[0]).find(Boolean)
  const loading = loadingData(app)

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingTop: insets.top, paddingBottom: 8, gap: 5 }}>
        <TopBar />
        <View style={{ paddingHorizontal: gutter }}>
          <Press onPress={() => router.push({ pathname: "/tim", params: { focus: "1" } })} accessibilityLabel="Tìm dịch vụ hoặc Artist"
            style={{ minHeight: 44, borderRadius: radius.md, backgroundColor: colors.subtle, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }}>
            <Icon name="search" size={17} color={colors.muted} />
            <Txt color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>Makeup, nail, tên Artist…</Txt>
          </Press>
        </View>
      </View>
      <FlatList
        data={loading ? [] : display}
        numColumns={2}
        keyExtractor={(entry) => "pro" in entry ? entry.id : `editorial-${entry.id}`}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 30 }}
        columnWrapperStyle={{ paddingHorizontal: gutter, justifyContent: "space-between", paddingBottom: 14 }}
        renderItem={({ item }) => "pro" in item ? <WorkTile entry={item} width={tile} /> : <EditorialTile template={item} width={tile} />}
        refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
        ListHeaderComponent={<View style={{ paddingBottom: 10 }}>
          <OfflineNote />
          <CategoryRail compact items={categories} photoFor={(c) => browse.photoFor(c) ?? illustration(c)} onChange={openList} onAll={() => openList()}
            extra={{ index: 4, label: SPA.ring, photo: spaCover, ring: SPA_TINT.fg, bg: SPA_TINT.bg, onPress: () => router.push("/spa") }} />
          <View style={{ marginHorizontal: gutter, marginTop: 10, backgroundColor: colors.accentSoft, borderRadius: radius.md }}>
            <Press onPress={() => router.push("/yeu-cau/moi")} accessibilityRole="link"
              accessibilityLabel="Đặt theo nhu cầu. Chuyên viên phù hợp sẽ nhận."
              style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8, minHeight: 48 }}>
              <Icon name="megaphone" size={17} color={colors.accentDark} />
              <View style={{ flex: 1 }}>
                <Txt w={700} color={colors.accentDark}>{requestCopy.vi.title}</Txt>
                <Txt v="meta" color={colors.inkSoft}>{requestCopy.vi.summary}</Txt>
              </View>
              <Icon name="right" size={16} color={colors.accentDark} />
            </Press>
          </View>
          <TextTabs items={[{ value: "for-you", label: "Dành cho bạn" }, { value: "following", label: "Theo dõi" }]} value={tab}
            onChange={(next) => { setTab(next); setLimit(4) }} />
        </View>}
        ListEmptyComponent={<View style={{ paddingHorizontal: gutter }}>
          {loading ? <View style={{ flexDirection: "row", justifyContent: "space-between" }}><TileSkeleton width={tile} /><TileSkeleton width={tile} /></View>
            : app.dataError && !app.data ? <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
            : <EmptyState title={tab === "following" ? "Chưa có tác phẩm đang theo dõi" : "Chưa có dịch vụ tại khu vực này"}
                action={tab === "following" ? "Khám phá Artist" : "Xem danh mục"} onAction={() => tab === "following" ? router.navigate("/artist") : openList()} />}
        </View>}
        ListFooterComponent={<View style={{ paddingTop: 8, gap: 16 }}>
          {feed.length > limit ? <Press accessibilityRole="button" onPress={() => setLimit((n) => n + 12)} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}><Txt color={colors.accentDark} w={700}>Xem thêm tác phẩm</Txt></Press> : null}
          {spas.length ? <View style={{ gap: 8 }}>
            <View style={{ paddingHorizontal: gutter }}><Section title="Spa gần bạn" action="Xem tất cả" onAction={() => router.push("/spa")} /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 10 }}>
              {spas.slice(0, 8).map(({ pro }) => {
                const photo = browse.photosOf.get(pro.id)?.[0]
                return <Press key={pro.id} onPress={() => router.push({ pathname: "/pros/[id]", params: { id: pro.id } })}
                  style={{ width: 168, padding: 10, gap: 5, borderRadius: radius.md, backgroundColor: SPA_TINT.bg }}>
                  {photo ? <Image source={{ uri: photo }} style={{ height: 66, borderRadius: radius.sm }} /> : null}
                  <Txt w={700} numberOfLines={1}>{pro.name}</Txt><Txt v="meta" color={colors.inkSoft} numberOfLines={1}>{pro.district}</Txt>
                </Press>
              })}
            </ScrollView>
          </View> : null}
        </View>}
      />
    </View>
  )
}
