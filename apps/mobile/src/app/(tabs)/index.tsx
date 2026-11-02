import * as React from "react"
import { router } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CATEGORIES, categoryRow, interestsFrom, rankFeed, serviceOffers, type CategoryId } from "@/shared"
import type { AppWork } from "@/data/public"
import { PostCard } from "@/components/cards"
import { OfflineNote } from "@/components/offline-note"
import {
  CatalogTile,
  CategoryRail,
  GRID_GAP,
  ProTile,
  Section,
  ServiceTile,
  TileGrid,
  TileSkeleton,
  comingSoon,
  illustration,
  tileWidth,
} from "@/components/tiles"
import { TopBar } from "@/components/top-bar"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter, radius } from "@/theme"
import { EmptyState, ErrorNote } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** Bookable services on the first screen; the rest one tap away in the list. */
const SERVICES_FIRST = 6
const SOON_FIRST = 4
const PEOPLE_FIRST = 8
const WORKS_FIRST = 6

const openList = (category?: CategoryId) => router.push(category ? { pathname: "/dich-vu", params: { category } } : "/dich-vu")
const openRequestForm = () => router.push("/yeu-cau/moi")

/**
 * Khám phá is a marketplace front page, photo first: search at the top,
 * categories as pictures, then what can be booked here (two to a row, the
 * photo doing the selling), the people who do it, their real work, and what
 * is coming. Every scroll shows more work or more choices, not more words.
 */
export default function Explore() {
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const tile = tileWidth(width)

  // One clock per data load, so the order does not reshuffle while scrolling.
  const loadedAt = app.data
  const now = React.useMemo(() => new Date(), [loadedAt])

  // browse.* leaves out people this person blocked.
  const offers = React.useMemo(
    () => (app.data ? serviceOffers({ studioBookingOpen: app.studioBookingOpen, pros: browse.pros, proServices: browse.services, works: browse.works, city: app.city, vertical: "all" }) : []),
    [app.data, browse, app.city, app.studioBookingOpen],
  )
  // Every category, most on offer here first; the ones nobody offers yet stay, dimmed.
  const rail = React.useMemo(() => categoryRow(CATEGORIES, offers, "all", CATEGORIES.length + 1), [offers])
  const soonCategories = React.useMemo(() => new Set(CATEGORIES.filter((c) => !rail.offered.has(c.id)).map((c) => c.id)), [rail])
  const soon = React.useMemo(() => comingSoon(offers, CATEGORIES, app.studioBookingOpen, SOON_FIRST), [offers, app.studioBookingOpen])
  const people = React.useMemo(() => browse.peopleFor("all").slice(0, PEOPLE_FIRST), [browse])

  // Real work, as proof, ranked the same way as the web feed.
  const proof = React.useMemo(() => {
    if (!app.data) return []
    return (
      rankFeed(
        browse.works,
        browse.pros,
        {
          studioBookingOpen: app.studioBookingOpen,
          vertical: "all",
          interests: interestsFrom({ chosen: [], booked: app.me.bookedCategories, saved: browse.savedCategories }),
          followed: browse.followedSlugs,
          distanceKm: (proId) => {
            const pro = browse.proById.get(proId)
            return pro ? app.distanceTo(pro) : null
          },
          stats: app.data.stats,
          now,
        },
        "for-you",
      ) as AppWork[] // rankFeed returns the same objects it was given
    ).slice(0, WORKS_FIRST)
  }, [app, browse, now])

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
  const bookable = offers.slice(0, SERVICES_FIRST)

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
  } else if (app.dataError) {
    services = <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
  } else if (!offers.length) {
    services = (
      <View style={{ gap: 4 }}>
        <EmptyState
          title={`Chưa có ai nhận lịch${where}`}
          text="Đăng yêu cầu: người làm quanh bạn sẽ thấy và nhận việc. Không mất phí đăng."
          action="Đăng yêu cầu"
          onAction={openRequestForm}
        />
        {app.city ? (
          <Press onPress={() => app.setCity(null)} accessibilityRole="button" style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}>
            <Txt w={600} color={colors.accentDark}>
              Xem cả nước
            </Txt>
          </Press>
        ) : null}
      </View>
    )
  } else {
    services = (
      <TileGrid>
        {bookable.map((o) => (
          <ServiceTile key={o.template.id} offer={o} width={tile} index={o.photo ? 0 : nextTurn(o.template.category)} />
        ))}
      </TileGrid>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <TopBar />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, gap: 28 }}
        refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
      >
        <View style={{ gap: 16, paddingTop: 4 }}>
          <OfflineNote />
          {/* Search first: the fastest way to the thing you came for. */}
          <View style={{ paddingHorizontal: gutter }}>
            <Press
              onPress={() => router.push({ pathname: "/tim", params: { focus: "1" } })}
              accessibilityLabel="Tìm dịch vụ hoặc người làm"
              style={{
                minHeight: 48,
                borderRadius: radius.full,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 16,
              }}
            >
              <Icon name="search" size={18} />
              <Txt color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
                Nail, makeup, chụp ảnh…
              </Txt>
            </Press>
          </View>

          {/* Categories, as pictures; a tap opens that category's list. */}
          <CategoryRail
            items={rail.ordered}
            soon={app.data ? soonCategories : undefined}
            photoFor={(c) => browse.photoFor(c) ?? illustration(c)}
            onChange={(c) => openList(c)}
            onAll={() => openList()}
          />
        </View>

        {/* What can be booked here */}
        <View style={{ gap: 14 }}>
          <Section
            title={`Đặt được ngay${where}`}
            note={!loadingFirst && offers.length ? `${offers.length} dịch vụ đang nhận lịch` : undefined}
            action={offers.length > bookable.length ? "Xem tất cả" : undefined}
            onAction={() => openList()}
          />
          <View style={{ paddingHorizontal: gutter }}>{services}</View>
        </View>

        {/* The people, with their own work */}
        {people.length > 0 ? (
          <View style={{ gap: 14 }}>
            <Section title={`Người làm${where}`} note="Đang nhận lịch, xếp theo xác minh và đánh giá" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: GRID_GAP }}>
              {people.map(({ pro, km }) => (
                <ProTile key={pro.id} pro={pro} photos={browse.photosOf.get(pro.id) ?? []} price={browse.priceOf(pro.id)} distanceKm={km} width={Math.min(280, Math.round(width * 0.68))} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Real work, as proof */}
        {proof.length > 0 ? (
          <View style={{ gap: 14 }}>
            <Section title="Tác phẩm thật" note="Ảnh do người làm đăng" action="Xem thêm" onAction={() => router.push("/tim")} />
            <View style={{ paddingHorizontal: gutter, flexDirection: "row", flexWrap: "wrap", columnGap: GRID_GAP }}>
              {proof.map((w) => {
                const pro = browse.proById.get(w.proId)
                return (
                  <View key={w.id} style={{ width: tile }}>
                    <PostCard work={w} pro={pro} services={browse.services} distanceKm={pro ? app.distanceTo(pro) : null} />
                  </View>
                )
              })}
            </View>
          </View>
        ) : null}

        {/* The rest of the catalogue: real price bands, nobody to book yet */}
        {!loadingFirst && app.data && soon.length > 0 ? (
          <View style={{ gap: 14 }}>
            <Section title={`Sắp có${where}`} note="Giá theo bảng giá 360đẹp · đăng yêu cầu để được nhận" />
            <View style={{ paddingHorizontal: gutter }}>
              <TileGrid>
                {soon.map((t) => (
                  <CatalogTile key={t.id} template={t} width={tile} index={nextTurn(t.category)} />
                ))}
              </TileGrid>
            </View>
          </View>
        ) : null}

        {/* Anything else */}
        {!loadingFirst && app.data ? (
          <Press
            onPress={openRequestForm}
            accessibilityLabel="Không thấy dịch vụ bạn cần? Đăng yêu cầu"
            style={{ marginHorizontal: gutter, flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
              <Icon name="plus" size={20} color={colors.accentDark} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt w={600}>Không thấy dịch vụ bạn cần?</Txt>
              <Txt v="meta" color={colors.inkSoft}>
                Đăng yêu cầu, người làm gần bạn gửi báo giá. Không mất phí.
              </Txt>
            </View>
            <Icon name="right" size={14} color={colors.muted} />
          </Press>
        ) : null}
        {/* Tuyển mẫu (working as a model) is partner work: reached from Tôi > Trở thành đối tác, not from here. */}
      </ScrollView>
    </View>
  )
}
