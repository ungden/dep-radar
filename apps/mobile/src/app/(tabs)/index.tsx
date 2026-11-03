import * as React from "react"
import { Image } from "expo-image"
import { router } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CATEGORIES, categoryRow, serviceOffers, type CategoryId } from "@/shared"
import { OfflineNote } from "@/components/offline-note"
import { CatalogTile, CategoryRail, PhotoBadge, Section, ServiceTile, TileGrid, TileSkeleton, illustration, notYetOffered, tileWidth } from "@/components/tiles"
import { TopBar } from "@/components/top-bar"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter, radius } from "@/theme"
import { EmptyState, ErrorNote } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** Services on the first screen; the rest one tap away in the list. */
const SERVICES_FIRST = 6

const openList = (category?: CategoryId) => router.push(category ? { pathname: "/dich-vu", params: { category } } : "/dich-vu")

/**
 * Khám phá asks one question first, how the customer wants to book: choose a
 * service and let an Artist take the order, or choose the Artist. Under it,
 * the services themselves. What people offer here comes first, then the rest
 * of the catalogue, which can still be requested.
 */
export default function Explore() {
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const tile = tileWidth(width)

  // browse.* leaves out people this person blocked.
  const offers = React.useMemo(
    () => (app.data ? serviceOffers({ studioBookingOpen: app.studioBookingOpen, pros: browse.pros, proServices: browse.services, works: browse.works, city: app.city, vertical: "all" }) : []),
    [app.data, browse, app.city, app.studioBookingOpen],
  )
  // Every category, most on offer here first.
  const rail = React.useMemo(() => categoryRow(CATEGORIES, offers, "all", CATEGORIES.length + 1), [offers])
  const soonCategories = React.useMemo(() => new Set(CATEGORIES.filter((c) => !rail.offered.has(c.id)).map((c) => c.id)), [rail])

  const offered = offers.slice(0, SERVICES_FIRST)
  const rest = React.useMemo(() => notYetOffered(offers, CATEGORIES, app.studioBookingOpen, SERVICES_FIRST - offered.length), [offers, app.studioBookingOpen, offered.length])

  // Illustrations take turns within a category, so two tiles never share one.
  const turns = new Map<CategoryId, number>()
  const nextTurn = (c: CategoryId) => {
    const n = turns.get(c) ?? 0
    turns.set(c, n + 1)
    return n
  }

  // Nothing yet, or the city just changed and its catalogue is on the way.
  const loadingFirst = (!app.data || app.stale) && !app.dataError && app.configured
  const where = app.city ? ` ở ${app.city}` : ""
  // A real work when anyone has posted one; a picture under "Artist" must not be an illustration.
  const realWork = browse.works.find((w) => w.images[0])?.images[0]

  let services: React.ReactNode
  if (loadingFirst) {
    services = (
      <TileGrid>
        {[0, 1, 2, 3].map((i) => (
          <TileSkeleton key={i} width={tile} />
        ))}
      </TileGrid>
    )
  } else if (!app.configured) {
    services = <EmptyState title="App chưa kết nối máy chủ" text="Chưa tải được dịch vụ. Vui lòng thử lại sau." />
  } else if (app.dataError && !app.data) {
    services = <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
  } else {
    services = (
      <TileGrid>
        {offered.map((o) => (
          <ServiceTile key={o.template.id} offer={o} width={tile} brief index={o.photo ? 0 : nextTurn(o.template.category)} />
        ))}
        {rest.map((t) => (
          <CatalogTile key={t.id} template={t} width={tile} brief index={nextTurn(t.category)} />
        ))}
      </TileGrid>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* A flat bar that stays put; the page scrolls under it. */}
      <View style={{ backgroundColor: colors.accentSoft, paddingTop: insets.top, paddingBottom: 10, gap: 6 }}>
        <TopBar />
        <View style={{ paddingHorizontal: gutter }}>
          <Press
            onPress={() => router.push({ pathname: "/tim", params: { focus: "1" } })}
            accessibilityLabel="Tìm dịch vụ hoặc Artist"
            style={{ minHeight: 40, borderRadius: radius.sm, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }}
          >
            <Icon name="search" size={16} color={colors.muted} />
            <Txt color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
              Nail, makeup, tên Artist…
            </Txt>
          </Press>
        </View>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 20, paddingBottom: 32, gap: 36 }} refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}>
        <OfflineNote />
        {/* Categories, as pictures; a tap opens that category's list. */}
        <CategoryRail
          items={rail.ordered}
          soon={app.data ? soonCategories : undefined}
          photoFor={(c) => browse.photoFor(c) ?? illustration(c)}
          onChange={(c) => openList(c)}
          onAll={() => openList()}
        />

        {/* The two ways to book, side by side */}
        <View style={{ paddingHorizontal: gutter, gap: 12 }}>
          <Txt v="title">Bạn muốn đặt thế nào?</Txt>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Press
              onPress={() => router.push("/yeu-cau/moi")}
              accessibilityLabel="Đặt theo dịch vụ. Chọn dịch vụ và giờ, Artist rảnh sẽ nhận đơn."
              style={{ flex: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface }}
            >
              <View style={{ height: 112 }}>
                <Image source={{ uri: illustration("nail", 1) }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
                <PhotoBadge text="Ảnh minh hoạ" position="tl" />
              </View>
              <View style={{ padding: 14, gap: 4 }}>
                <Txt w={700}>Đặt theo dịch vụ</Txt>
                <Txt v="meta" color={colors.inkSoft}>
                  Chọn dịch vụ và giờ, Artist rảnh sẽ nhận đơn
                </Txt>
              </View>
            </Press>
            <Press
              onPress={() => router.navigate("/artist")}
              accessibilityLabel="Tự chọn Artist. Xem tác phẩm và giá, chọn người bạn thích."
              style={{ flex: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface }}
            >
              {realWork ? (
                <Image source={{ uri: realWork }} style={{ height: 112, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
              ) : (
                <View style={{ height: 112, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="person" size={40} color={colors.accent} />
                </View>
              )}
              <View style={{ padding: 14, gap: 4 }}>
                <Txt w={700}>Tự chọn Artist</Txt>
                <Txt v="meta" color={colors.inkSoft}>
                  Xem tác phẩm và giá, chọn người bạn thích
                </Txt>
              </View>
            </Press>
          </View>
        </View>

        {/* The services */}
        <View style={{ gap: 12 }}>
          <Section title={`Dịch vụ${where}`} action="Xem tất cả" onAction={() => openList()} />
          <View style={{ paddingHorizontal: gutter }}>{services}</View>
        </View>
        {/* Tuyển mẫu (working as a model) is partner work: reached from Tôi > Trở thành đối tác, not from here. */}
      </ScrollView>
    </View>
  )
}
