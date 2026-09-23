import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  CATEGORIES,
  PAGE_SIZE,
  VERTICALS,
  categoriesOf,
  interestsFrom,
  occasionsFor,
  occasionTemplates,
  rankFeed,
  suggestionsFor,
  supplyIsThin,
  type FeedTab,
  type VerticalFilter,
} from "@/shared"
import { webLink } from "@/data/links"
import type { AppWork } from "@/data/public"
import { PostCard, PostCardSkeleton, ProCard, ProCardSkeleton } from "@/components/cards"
import { TextTabs } from "@/components/switches"
import { TopBar } from "@/components/top-bar"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Chip, EmptyState, ErrorNote, Photo, SectionHeader } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const TRADES: { value: VerticalFilter; label: string }[] = [{ value: "all", label: "Tất cả" }, ...VERTICALS.map((v) => ({ value: v.id, label: v.label }))]

/** Suggestion links are written for the web ("/search?category=nail"); open the same thing here. */
function openSuggestion(href: string) {
  const [path, query = ""] = href.split("?")
  const params = Object.fromEntries(new URLSearchParams(query))
  if (path.startsWith("/dip/")) router.push({ pathname: "/dip/[id]", params: { id: path.slice(5) } })
  else router.push({ pathname: "/tim", params })
}

export default function Explore() {
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [vertical, setVertical] = React.useState<VerticalFilter>("all")
  const [tab, setTab] = React.useState<FeedTab>("for-you")
  const [limit, setLimit] = React.useState(PAGE_SIZE)
  const [stuck, setStuck] = React.useState(false)
  const switchY = React.useRef(Number.POSITIVE_INFINITY)

  // One clock per data load, so the order does not reshuffle while scrolling.
  const loadedAt = app.data
  const now = React.useMemo(() => new Date(), [loadedAt])
  const signedIn = Boolean(app.uid)

  const feed = React.useMemo(() => {
    if (!app.data) return []
    return rankFeed(
      browse.works,
      browse.pros,
      {
        vertical,
        interests: interestsFrom({ chosen: [], booked: app.me.bookedCategories, saved: browse.savedCategories }),
        followed: browse.followedSlugs,
        distanceKm: (proId) => {
          const pro = browse.proById.get(proId)
          return pro ? app.distanceTo(pro) : null
        },
        stats: app.data.stats,
        now,
      },
      tab === "following" && !signedIn ? "for-you" : tab,
    ) as AppWork[] // rankFeed returns the same objects it was given
  }, [app, browse, vertical, tab, now, signedIn])

  React.useEffect(() => setLimit(PAGE_SIZE), [vertical, tab, app.city])

  const people = browse.peopleFor(vertical)
  const verticalPros = browse.pros.filter((p) => browse.inVertical(p, vertical))
  const thin = supplyIsThin(verticalPros.length, browse.worksIn(vertical).length)
  const occasions = occasionsFor(now).filter(
    (o) => vertical === "all" || occasionTemplates(o).some((t) => CATEGORIES.find((c) => c.id === t.category)?.vertical === vertical),
  )
  const categories = vertical === "all" ? CATEGORIES : categoriesOf(vertical)
  const loadingFirst = !app.data && !app.dataError && app.configured
  // One real photo per occasion and never the same one twice in the row (as on
  // the web): the occasion's exact services first, then its categories.
  const occasionCovers = React.useMemo(() => {
    const used = new Set<string>()
    return occasions.map((o) => {
      const templates = new Set(o.templates)
      const categories = new Set(occasionTemplates(o).map((t) => t.category))
      const candidates = [
        ...browse.works.filter((w) => templates.has(w.templateId)),
        ...browse.works.filter((w) => !templates.has(w.templateId) && categories.has(w.category)),
      ]
        .map((w) => w.images[0])
        .filter((src): src is string => Boolean(src))
      const pick = candidates.find((src) => !used.has(src))
      if (pick) used.add(pick)
      return pick
    })
  }, [occasions, browse.works])

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const past = e.nativeEvent.contentOffset.y > switchY.current
    if (past !== stuck) setStuck(past)
  }

  const feedTabs: { value: FeedTab; label: string }[] = [
    { value: "for-you", label: "Dành cho bạn" },
    { value: "latest", label: "Mới nhất" },
    ...(signedIn ? [{ value: "following" as const, label: "Đang theo dõi" }] : []),
  ]

  const cardWidth = Math.min(300, width * 0.78)
  const peopleBlock = thin ? (
    <View style={{ paddingHorizontal: gutter, gap: 12 }}>
      <SectionHeader
        title={app.city ? `Người làm ở ${app.city}` : "Người làm gần bạn"}
        action={people.length ? "Tìm theo nhu cầu" : undefined}
        onAction={() => router.push("/tim")}
      />
      {loadingFirst ? <ProCardSkeleton /> : null}
      {people.slice(0, 8).map(({ pro, km }) => (
        <ProCard key={pro.id} pro={pro} photos={browse.photosOf.get(pro.id) ?? []} price={browse.priceOf(pro.id)} distanceKm={km} />
      ))}
      {!loadingFirst && !people.length ? (
        <Txt color={colors.inkSoft}>Chưa có ai đang nhận lịch ở khu vực này.</Txt>
      ) : null}
    </View>
  ) : (
    <View style={{ gap: 12 }}>
      <View style={{ paddingHorizontal: gutter }}>
        <SectionHeader title="Gần bạn, đang nhận lịch" action="Xem hết" onAction={() => router.push("/tim")} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}>
        {people.slice(0, 10).map(({ pro, km }) => (
          <ProCard key={pro.id} width={cardWidth} pro={pro} photos={browse.photosOf.get(pro.id) ?? []} price={browse.priceOf(pro.id)} distanceKm={km} />
        ))}
      </ScrollView>
    </View>
  )

  const header = (
    <View style={{ gap: 24, paddingBottom: 12 }}>
      {/* Search and calendar suggestions */}
      <View style={{ paddingHorizontal: gutter, gap: 12, paddingTop: 4 }}>
        <Press
          onPress={() => router.push({ pathname: "/tim", params: { focus: "1" } })}
          accessibilityLabel="Tìm dịch vụ"
          style={{
            height: 50,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 18,
          }}
        >
          <Icon name="search" size={20} />
          <Txt color={colors.muted}>Bạn muốn làm gì hôm nay?</Txt>
        </Press>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -gutter }}>
          <View style={{ width: gutter - 8 }} />
          {suggestionsFor(now).map((s) => (
            <Chip key={s.label} label={s.label} onPress={() => openSuggestion(s.href)} />
          ))}
          <View style={{ width: gutter - 8 }} />
        </ScrollView>
      </View>

      {/* Trade switch (a copy sticks under the top bar once scrolled past) */}
      <View
        onLayout={(e) => {
          switchY.current = e.nativeEvent.layout.y
        }}
      >
        <TextTabs items={TRADES} value={vertical} onChange={setVertical} />
      </View>

      {/* Categories as real photos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 14 }}>
        {categories.map((c) => (
          <Press
            key={c.id}
            onPress={() => router.push({ pathname: "/tim", params: { category: c.id } })}
            accessibilityLabel={c.label}
            style={{ width: 68, alignItems: "center", gap: 6 }}
          >
            <Photo uri={browse.photoFor(c.id)} ratio={1} rounded={34} style={{ width: 64 }} />
            <Txt v="meta" w={600} center numberOfLines={2}>
              {c.label}
            </Txt>
          </Press>
        ))}
      </ScrollView>

      {/* Occasions */}
      {occasions.length ? (
        <View style={{ gap: 12 }}>
          <View style={{ paddingHorizontal: gutter }}>
            <SectionHeader title="Theo dịp" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}>
            {occasions.map((o, i) => {
              const photo = occasionCovers[i]
              return (
                <Press
                  key={o.id}
                  onPress={() => router.push({ pathname: "/dip/[id]", params: { id: o.id } })}
                  accessibilityLabel={`${o.title}. ${o.subtitle}`}
                  style={{ width: 168, gap: 6 }}
                >
                  {photo ? (
                    <Photo uri={photo} ratio={4 / 5} />
                  ) : (
                    // No work in these services yet: the title, not an empty grey box.
                    <View style={{ aspectRatio: 4 / 5, borderRadius: radius.lg, backgroundColor: colors.subtle, justifyContent: "flex-end", padding: 12 }}>
                      <Txt w={800} style={{ fontSize: 20, lineHeight: 24, color: colors.inkSoft }}>
                        {o.title}
                      </Txt>
                    </View>
                  )}
                  <Txt w={700} numberOfLines={1}>
                    {o.title}
                  </Txt>
                  <Txt v="meta" color={colors.inkSoft} numberOfLines={2}>
                    {o.subtitle}
                  </Txt>
                </Press>
              )
            })}
          </ScrollView>
        </View>
      ) : null}

      {thin ? peopleBlock : people.length ? peopleBlock : loadingFirst ? (
        <View style={{ paddingHorizontal: gutter }}>
          <ProCardSkeleton width={cardWidth} />
        </View>
      ) : null}

      {/* Feed tabs */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <TextTabs items={feedTabs} value={tab} onChange={setTab} />
      </View>

      {app.dataError ? (
        <View style={{ paddingHorizontal: gutter }}>
          <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
        </View>
      ) : null}
    </View>
  )

  const empty = loadingFirst ? (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: gutter }}>
      <View style={{ flex: 1 }}>
        <PostCardSkeleton />
        <PostCardSkeleton />
      </View>
      <View style={{ flex: 1, paddingTop: 36 }}>
        <PostCardSkeleton />
        <PostCardSkeleton />
      </View>
    </View>
  ) : !app.configured ? (
    <EmptyState title="App chưa kết nối máy chủ" text="Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc EXPO_PUBLIC_SUPABASE_ANON_KEY trong .env." />
  ) : app.dataError ? null : tab === "following" ? (
    <EmptyState title="Chưa có bài từ người bạn theo dõi" text="Theo dõi người bạn thích để thấy bài mới của họ ở đây." action="Xem Dành cho bạn" onAction={() => setTab("for-you")} />
  ) : app.city ? (
    <EmptyState title={`Chưa có bài đăng nào ở ${app.city}`} text="Có thể ở thành phố khác đã có người đăng." action="Xem cả nước" onAction={() => app.setCity(null)} />
  ) : (
    <EmptyState title="Chưa có bài đăng nào" text="Khi người làm đăng tác phẩm, bài sẽ hiện ở đây." />
  )

  const footer =
    feed.length > 0 ? (
      <View style={{ paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 32, gap: 10 }}>
        {feed.length > limit ? null : (
          <Txt v="meta" color={colors.muted} center>
            Bạn đã xem hết bài {tab === "following" ? "của người bạn theo dõi" : "ở khu vực này"}.
          </Txt>
        )}
        <View style={{ backgroundColor: colors.subtle, borderRadius: radius.xl, padding: 20, gap: 10, marginTop: 12 }}>
          <Txt v="title" w={800}>
            Bạn làm nail, makeup hay chụp ảnh?
          </Txt>
          <Txt color={colors.inkSoft}>Mở hồ sơ, đăng tác phẩm và nhận lịch từ khách gần bạn. Không mất phí đăng ký.</Txt>
          <Button
            label="Mở hồ sơ trên web"
            variant="secondary"
            icon="external"
            onPress={() => void WebBrowser.openBrowserAsync(webLink("/studio/onboarding"))}
          />
        </View>
      </View>
    ) : null

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <TopBar />
      <View style={{ flex: 1 }}>
        <FlashList<AppWork>
          data={feed.slice(0, limit)}
          masonry
          numColumns={2}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 6 }}>
              <PostCard work={item} pro={browse.proById.get(item.proId)} services={browse.services} distanceKm={(() => {
                const pro = browse.proById.get(item.proId)
                return pro ? app.distanceTo(pro) : null
              })()} />
            </View>
          )}
          ListHeaderComponent={<View style={{ marginHorizontal: -(gutter - 6) }}>{header}</View>}
          ListEmptyComponent={<View style={{ marginHorizontal: -(gutter - 6) }}>{empty}</View>}
          ListFooterComponent={<View style={{ marginHorizontal: -(gutter - 6) }}>{footer}</View>}
          contentContainerStyle={{ paddingHorizontal: gutter - 6 }}
          onEndReached={() => setLimit((n) => (n < feed.length ? n + PAGE_SIZE : n))}
          onEndReachedThreshold={0.6}
          refreshing={app.loading && Boolean(app.data)}
          onRefresh={() => void app.refresh()}
          onScroll={onScroll}
          scrollEventThrottle={32}
          extraData={app.me.savedWorkIds}
        />
        {stuck ? (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <TextTabs items={TRADES} value={vertical} onChange={setVertical} />
          </View>
        ) : null}
      </View>
    </View>
  )
}

