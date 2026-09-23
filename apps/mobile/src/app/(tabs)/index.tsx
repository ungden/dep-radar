import * as React from "react"
import { router } from "expo-router"
import {
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
  categoryRow,
  serviceOffers,
  type CategoryId,
  type ServiceOffer,
  type VerticalFilter,
} from "@/shared"
import { formatDuration, formatPrice } from "@/data/format"
import type { AppWork } from "@/data/public"
import { PostCard, PostCardSkeleton } from "@/components/cards"
import { TextTabs } from "@/components/switches"
import { OfflineNote } from "@/components/offline-note"
import { TopBar } from "@/components/top-bar"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { card, colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState, ErrorNote, Photo, SectionHeader, Skeleton } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { CategoryIcon, CategoryTiles } from "@/components/category-icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

const TRADES: { value: VerticalFilter; label: string }[] = [{ value: "all", label: "Tất cả" }, ...VERTICALS.map((v) => ({ value: v.id, label: v.label }))]
/** The most offered first; the rest one tap away, so the first screen stays short. */
const SERVICES_FIRST = 8
const COLUMN_GAP = 12

const openRequestForm = () => router.push("/yeu-cau/moi")

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
  const [allCategories, setAllCategories] = React.useState(false)
  const [stuck, setStuck] = React.useState(false)
  const switchY = React.useRef(Number.POSITIVE_INFINITY)

  // One clock per data load, so the order does not reshuffle while scrolling.
  const loadedAt = app.data
  const now = React.useMemo(() => new Date(), [loadedAt])

  const chooseTrade = (v: VerticalFilter) => {
    setVertical(v)
    setCategory("all")
    setExpanded(false)
    setAllCategories(false)
  }
  React.useEffect(() => setExpanded(false), [app.city])

  // browse.* leaves out people this person blocked.
  const offers = React.useMemo(
    () => (app.data ? serviceOffers({ pros: browse.pros, proServices: browse.services, works: browse.works, city: app.city, vertical }) : []),
    [app.data, browse, app.city, vertical],
  )
  // One row of the categories with the most on offer here; the rest (and the
  // ones nobody offers yet, "Sắp có") behind "Xem thêm". Same as the web.
  const categories = CATEGORIES.filter((c) => vertical === "all" || c.vertical === vertical)
  const shownCategory = categories.some((c) => c.id === category) ? category : "all"
  const tiles = categoryRow(categories, offers, shownCategory)
  const shownCategoryInfo = CATEGORIES.find((c) => c.id === shownCategory)
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

  // Nothing yet, or the city just changed and its catalogue is on the way.
  const loadingFirst = (!app.data || app.stale) && !app.dataError && app.configured
  const cardWidth = (width - gutter * 2 - COLUMN_GAP) / 2

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const past = e.nativeEvent.contentOffset.y > switchY.current
    if (past !== stuck) setStuck(past)
  }

  const title = `${shownCategoryInfo ? shownCategoryInfo.label : vertical === "all" ? "Dịch vụ" : getVertical(vertical).label}${app.city ? ` ở ${app.city}` : ""}`

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
    services = (
      <EmptySupply
        city={app.city}
        label={shownCategoryInfo?.label}
        onAllCities={() => app.setCity(null)}
      />
    )
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
          refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
        >
          <OfflineNote />
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

          {/* Categories: one row, the rest behind "Xem thêm" */}
          {categories.length > 1 ? (
            <View style={{ paddingHorizontal: gutter - 4 }}>
              <CategoryTiles
                items={(allCategories ? tiles.ordered : tiles.row).map((c) => ({
                  id: c.id,
                  label: c.short ?? c.label,
                  soon: !tiles.offered.has(c.id),
                }))}
                value={shownCategory}
                // Tapping the chosen category again goes back to everything.
                onChange={(id) => {
                  setCategory(id === shownCategory ? "all" : (id as CategoryId))
                  setAllCategories(false)
                }}
                more={tiles.more ? { open: allCategories, onToggle: () => setAllCategories((v) => !v) } : undefined}
              />
            </View>
          ) : null}

          {/* Services */}
          <View style={{ paddingHorizontal: gutter, gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <Txt v="h2" style={{ flexShrink: 1 }}>
                {title}
              </Txt>
              {shownCategoryInfo ? (
                <Press
                  onPress={() => setCategory("all")}
                  accessibilityLabel="Xem tất cả dịch vụ"
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, height: 34, paddingLeft: 12, paddingRight: 10, borderRadius: radius.full, backgroundColor: colors.subtle }}
                >
                  <Txt v="meta" w={600}>
                    Tất cả
                  </Txt>
                  <Icon name="close" size={12} color={colors.ink} />
                </Press>
              ) : shown.length > 0 ? (
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
            <Txt color={colors.inkSoft}>Đăng yêu cầu với giá theo bảng giá 360dep, người làm gần bạn nhận việc. Không mất phí đăng.</Txt>
            <Button label="Đăng yêu cầu" onPress={openRequestForm} style={{ marginTop: 6 }} />
          </View>

          {/* The request board turned around: freelancers looking for models */}
          <Press
            onPress={() => router.push("/tuyen-mau")}
            accessibilityLabel="Tuyển mẫu: làm mẫu cho thợ"
            style={{ marginHorizontal: gutter, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16 }}
          >
            <CategoryIcon id="model-photo" size={36} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt w={700}>Tuyển mẫu</Txt>
              <Txt v="meta" color={colors.inkSoft}>
                Làm mẫu cho thợ, được làm đẹp miễn phí hoặc có thù lao.
              </Txt>
            </View>
            <Icon name="right" size={14} color={colors.muted} />
          </Press>
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

/**
 * Nobody here offers this yet. The customer is the one reading, so the next
 * step is a request (people who do it nearby will see it), not "open a profile".
 */
function EmptySupply({ city, label, onAllCities }: { city: string | null; label?: string; onAllCities: () => void }) {
  const title = `${label ? `${label}: c` : "C"}hưa có ai nhận lịch${city ? ` ở ${city}` : ""}`
  return (
    <View style={{ gap: 12 }}>
      <EmptyState
        title={title}
        text="Đăng yêu cầu: khi có người làm việc này quanh bạn, họ thấy yêu cầu và nhận việc. Không mất phí đăng."
        action="Đăng yêu cầu"
        onAction={openRequestForm}
      />
      {city ? (
        <Press onPress={onAllCities} accessibilityRole="button" style={{ alignSelf: "center", paddingVertical: 8 }}>
          <Txt w={600} color={colors.accentDark}>
            Xem cả nước
          </Txt>
        </Press>
      ) : null}
    </View>
  )
}
