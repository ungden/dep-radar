import * as React from "react"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import {
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  CATEGORIES,
  VERTICALS,
  getVertical,
  interestsFrom,
  rankFeed,
  serviceOffers,
  type CategoryId,
  type ServiceOffer,
  type VerticalFilter,
} from "@/shared"
import { formatDuration, formatPrice } from "@/data/format"
import { webLink } from "@/data/links"
import type { AppWork } from "@/data/public"
import { PostCard, PostCardSkeleton } from "@/components/cards"
import { TextTabs } from "@/components/switches"
import { TopBar } from "@/components/top-bar"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { card, colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState, ErrorNote, Photo, SectionHeader, Skeleton } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { CategoryIcon, CategoryTiles } from "@/components/category-icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const TRADES: { value: VerticalFilter; label: string }[] = [{ value: "all", label: "Tất cả" }, ...VERTICALS.map((v) => ({ value: v.id, label: v.label }))]
/** The most offered first; the rest one tap away, so the first screen stays short. */
const SERVICES_FIRST = 8
const COLUMN_GAP = 12

const openRequestForm = () =>
  void WebBrowser.openBrowserAsync(webLink("/requests/new"), {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: colors.ink,
  })

/**
 * Khám phá sells services: what someone in the customer's city actually
 * offers, with the real lowest price, most offered first. Real work comes
 * after, as proof. Same list as the web home (lib/offers.ts).
 */
export default function Explore() {
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [vertical, setVertical] = React.useState<VerticalFilter>("all")
  const [category, setCategory] = React.useState<CategoryId | "all">("all")
  const [expanded, setExpanded] = React.useState(false)
  const [stuck, setStuck] = React.useState(false)
  const switchY = React.useRef(Number.POSITIVE_INFINITY)

  // One clock per data load, so the order does not reshuffle while scrolling.
  const loadedAt = app.data
  const now = React.useMemo(() => new Date(), [loadedAt])

  const chooseTrade = (v: VerticalFilter) => {
    setVertical(v)
    setCategory("all")
    setExpanded(false)
  }
  React.useEffect(() => setExpanded(false), [app.city])

  const offers = React.useMemo(
    () =>
      app.data
        ? serviceOffers({ pros: app.data.pros, proServices: app.data.services, works: app.data.works, city: app.city, vertical })
        : [],
    [app.data, app.city, vertical],
  )
  const categories = CATEGORIES.filter((c) => offers.some((o) => o.template.category === c.id))
  const shownCategory = categories.some((c) => c.id === category) ? category : "all"
  const shown = offers.filter((o) => shownCategory === "all" || o.template.category === shownCategory)
  const visible = expanded || shownCategory !== "all" ? shown : shown.slice(0, SERVICES_FIRST)
  // A service with no work of its own borrows one from its category. Never the
  // same picture on two cards (it reads as the same service): the service the
  // work was made for keeps it, a borrower shows its icon instead.
  const works = app.data?.works
  const photos = React.useMemo(() => {
    const own = (o: ServiceOffer) =>
      Boolean(o.photo && works?.some((w) => w.templateId === o.template.id && w.images.includes(o.photo!)))
    const used = new Set(visible.filter(own).map((o) => o.photo!))
    return visible.map((o) => {
      if (!o.photo) return undefined
      if (own(o)) return o.photo
      if (used.has(o.photo)) return undefined
      used.add(o.photo)
      return o.photo
    })
  }, [visible, works])

  // A short row of real work under the services, as proof, not as the page.
  const proof = React.useMemo(() => {
    if (!app.data) return []
    return (
      rankFeed(
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
        "for-you",
      ) as AppWork[] // rankFeed returns the same objects it was given
    ).slice(0, 8)
  }, [app, browse, vertical, now])

  const loadingFirst = !app.data && !app.dataError && app.configured
  const cardWidth = (width - gutter * 2 - COLUMN_GAP) / 2

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const past = e.nativeEvent.contentOffset.y > switchY.current
    if (past !== stuck) setStuck(past)
  }

  const title = `${vertical === "all" ? "Dịch vụ" : getVertical(vertical).label}${app.city ? ` ở ${app.city}` : ""}`

  let services: React.ReactNode
  if (loadingFirst) {
    services = (
      <Grid>
        {[0, 1, 2, 3].map((i) => (
          <ServiceCardSkeleton key={i} width={cardWidth} />
        ))}
      </Grid>
    )
  } else if (!app.configured) {
    services = <EmptyState title="App chưa kết nối máy chủ" text="Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc EXPO_PUBLIC_SUPABASE_ANON_KEY trong .env." />
  } else if (app.dataError) {
    services = <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
  } else if (!shown.length) {
    services = <EmptySupply vertical={vertical} city={app.city} onAllCities={() => app.setCity(null)} />
  } else {
    services = (
      <View style={{ gap: 20 }}>
        <Grid>
          {visible.map((o, i) => (
            <ServiceCard key={o.template.id} offer={o} photo={photos[i]} width={cardWidth} />
          ))}
        </Grid>
        {visible.length < shown.length ? (
          <Button label={`Xem tất cả ${shown.length} dịch vụ`} variant="secondary" full onPress={() => setExpanded(true)} />
        ) : null}
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <TopBar />
      <View style={{ flex: 1 }}>
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={32}
          contentContainerStyle={{ paddingBottom: 40, gap: 20 }}
          refreshControl={<RefreshControl refreshing={app.loading && Boolean(app.data)} onRefresh={() => void app.refresh()} />}
        >
          {/* Search */}
          <View style={{ paddingHorizontal: gutter, paddingTop: 4 }}>
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
          </View>

          {/* Trade switch (a copy sticks under the top bar once scrolled past) */}
          <View
            onLayout={(e) => {
              switchY.current = e.nativeEvent.layout.y
            }}
            style={{ marginTop: -8 }}
          >
            <TextTabs items={TRADES} value={vertical} onChange={chooseTrade} />
          </View>

          {/* Categories that someone here offers */}
          {categories.length > 1 ? (
            <View style={{ paddingHorizontal: gutter - 4 }}>
              <CategoryTiles
                items={[{ id: "all", label: "Tất cả" }, ...categories.map((c) => ({ id: c.id, label: c.label }))]}
                value={shownCategory}
                onChange={(id) => setCategory(id as CategoryId | "all")}
              />
            </View>
          ) : null}

          {/* Services */}
          <View style={{ paddingHorizontal: gutter, gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <Txt v="h2" style={{ flexShrink: 1 }}>
                {title}
              </Txt>
              {shown.length > 0 ? (
                <Txt v="meta" color={colors.muted}>
                  {shown.length} dịch vụ
                </Txt>
              ) : null}
            </View>
            {services}
          </View>

          {/* Real work, as proof */}
          {proof.length > 0 ? (
            <View style={{ paddingHorizontal: gutter, gap: 14, marginTop: 20 }}>
              <SectionHeader title="Tác phẩm thật từ người làm" action="Xem tất cả" onAction={() => router.push("/tim")} />
              {/* PostCard pads its own bottom. */}
              <Grid rowGap={4}>
                {proof.map((w) => {
                  const pro = browse.proById.get(w.proId)
                  return (
                    <View key={w.id} style={{ width: cardWidth }}>
                      <PostCard work={w} pro={pro} services={browse.services} distanceKm={pro ? app.distanceTo(pro) : null} />
                    </View>
                  )
                })}
              </Grid>
            </View>
          ) : loadingFirst ? (
            <View style={{ paddingHorizontal: gutter }}>
              <Grid>
                {[0, 1].map((i) => (
                  <View key={i} style={{ width: cardWidth }}>
                    <PostCardSkeleton />
                  </View>
                ))}
              </Grid>
            </View>
          ) : null}

          {/* Anything else */}
          <View style={{ marginHorizontal: gutter, marginTop: 8, backgroundColor: colors.subtle, borderRadius: radius.xl, padding: 20, gap: 8 }}>
            <Txt v="title" w={700}>
              Không thấy dịch vụ bạn cần?
            </Txt>
            <Txt color={colors.inkSoft}>Đăng yêu cầu, người làm gần bạn gửi báo giá. Bạn chọn, không mất phí.</Txt>
            <Button label="Đăng yêu cầu" onPress={openRequestForm} style={{ marginTop: 6 }} />
          </View>
        </ScrollView>
        {stuck ? (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <TextTabs items={TRADES} value={vertical} onChange={chooseTrade} />
          </View>
        ) : null}
      </View>
    </View>
  )
}

function Grid({ children, rowGap = 24 }: { children: React.ReactNode; rowGap?: number }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: COLUMN_GAP, rowGap }}>{children}</View>
}

/**
 * One thing for sale: the service, a real photo of it (never text on it), the
 * lowest real price here, and who offers it. The whole card opens the service,
 * where the customer picks a person and books.
 */
const ServiceCard = React.memo(function ServiceCard({ offer, photo, width }: { offer: ServiceOffer; photo: string | undefined; width: number }) {
  const { template, pros, fromPrice } = offer
  const shortest = Math.min(...template.variants.map((v) => v.durationMin))
  const who = pros.length === 1 ? pros[0].name : `${pros.length} người nhận`
  return (
    <Press
      onPress={() => router.push({ pathname: "/dich-vu/[id]", params: { id: template.id } })}
      accessibilityLabel={`${template.name}, từ ${formatPrice(fromPrice)}, ${who}`}
      style={{ width, ...card }}
    >
      <View style={{ borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: "hidden" }}>
        {photo ? (
          <Photo uri={photo} ratio={4 / 5} rounded={0} recyclingKey={template.id} />
        ) : (
          <View style={{ aspectRatio: 4 / 5, backgroundColor: colors.subtle, alignItems: "center", justifyContent: "center" }}>
            <CategoryIcon id={template.category} size={44} />
          </View>
        )}
      </View>
      <View style={{ padding: 10, gap: 4 }}>
      <Txt w={600} numberOfLines={2}>
        {template.name}
      </Txt>
      <Txt v="meta" color={colors.muted} numberOfLines={1} tabular>
        Từ{" "}
        <Txt v="meta" w={700} color={colors.accentDark}>
          {formatPrice(fromPrice)}
        </Txt>{" "}
        · {formatDuration(shortest)}
      </Txt>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
        <Txt v="meta" color={colors.inkSoft} numberOfLines={1} style={{ flexShrink: 1 }}>
          {who}
        </Txt>
        <View style={{ height: 30, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.accent, justifyContent: "center" }}>
          <Txt v="meta" w={700} color={colors.surface}>
            Đặt
          </Txt>
        </View>
      </View>
      </View>
    </Press>
  )
})

function ServiceCardSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width, gap: 8 }}>
      <Skeleton style={{ aspectRatio: 4 / 5, borderRadius: radius.lg }} />
      <Skeleton style={{ height: 16, width: "85%" }} />
      <Skeleton style={{ height: 14, width: "60%" }} />
      <Skeleton style={{ height: 14, width: "45%" }} />
    </View>
  )
}

/** Nobody here offers anything in this trade: say so, and offer the one useful next step. */
function EmptySupply({ vertical, city, onAllCities }: { vertical: VerticalFilter; city: string | null; onAllCities: () => void }) {
  // The section title above already names the trade.
  const title = `Chưa có ai nhận lịch${city ? ` ở ${city}` : ""}`
  if (vertical === "photo" || vertical === "model") {
    return (
      <EmptyState
        title={title}
        text={
          vertical === "photo"
            ? "Bạn chụp ảnh bằng điện thoại hoặc quay clip? Mở hồ sơ để là những người đầu tiên nhận khách ở đây."
            : "Bạn làm mẫu ảnh, mẫu livestream? Xác minh danh tính rồi mở hồ sơ để nhận việc an toàn."
        }
        action="Mở hồ sơ trên web"
        onAction={() => void WebBrowser.openBrowserAsync(webLink("/studio/onboarding"))}
      />
    )
  }
  return city ? (
    <EmptyState title={title} text="Có thể ở thành phố khác đã có người nhận. Hoặc đăng yêu cầu để người làm gửi báo giá." action="Xem cả nước" onAction={onAllCities} />
  ) : (
    <EmptyState title={title} text="Đăng yêu cầu để người làm gần bạn gửi báo giá, hoặc quay lại sau." action="Đăng yêu cầu" onAction={openRequestForm} />
  )
}
