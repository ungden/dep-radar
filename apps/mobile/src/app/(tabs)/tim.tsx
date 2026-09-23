import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router, useLocalSearchParams } from "expo-router"
import { ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  CATEGORIES,
  VERTICALS,
  categoryLabel,
  getTemplate,
  getVertical,
  isVertical,
  rankScore,
  serviceOffers,
  verticalOf,
  type CategoryId,
  type ServiceOffer,
  type VerticalFilter,
} from "@/shared"
import { fold, formatDuration, formatPrice } from "@/data/format"
import type { AppPro } from "@/data/public"
import { ProCard, ProCardSkeleton } from "@/components/cards"
import { CategoryIcon } from "@/components/category-icon"
import { OfflineNote } from "@/components/offline-note"
import { TextTabs } from "@/components/switches"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { card, colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Chip, EmptyState, ErrorNote, Photo } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

type Mode = "services" | "people"
type Place = "any" | "home" | "studio" | "location"
type PriceBand = "any" | "lt300" | "300to600" | "gt600"
type Sort = "match" | "near" | "cheap"

interface Filters {
  vertical: VerticalFilter
  category: CategoryId | null
  price: PriceBand
  verified: boolean
  taking: boolean
  place: Place
}

const NONE: Filters = { vertical: "all", category: null, price: "any", verified: false, taking: false, place: "any" }

const PRICE_LABEL: Record<PriceBand, string> = { any: "Mọi mức giá", lt300: "Dưới 300k", "300to600": "300k – 600k", gt600: "Trên 600k" }
const PLACE_LABEL: Record<Place, string> = { any: "Ở đâu cũng được", home: "Đến tận nhà", studio: "Tại studio", location: "Chụp ngoài / tại địa điểm" }

function priceOk(band: PriceBand, price: number | null) {
  if (band === "any") return true
  if (price === null) return false
  if (band === "lt300") return price < 300_000
  if (band === "300to600") return price >= 300_000 && price <= 600_000
  return price > 600_000
}

const words = (q: string) => fold(q.trim()).split(/\s+/).filter(Boolean)

/**
 * Tìm: services first (what can I book, from how much), people second. The
 * same filters apply to both; each one that is on shows as a chip with ✕.
 */
export default function Search() {
  const params = useLocalSearchParams<{ category?: string; vertical?: string; focus?: string }>()
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const sheet = useSheet()
  const input = React.useRef<TextInput>(null)
  const [mode, setMode] = React.useState<Mode>("services")
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filters>(NONE)
  const [draft, setDraft] = React.useState<Filters>(NONE)
  const [sort, setSort] = React.useState<Sort>("match")

  // Arriving from a category bubble, a suggestion or the search pill.
  React.useEffect(() => {
    const category = CATEGORIES.find((c) => c.id === params.category)?.id ?? null
    const vertical: VerticalFilter = isVertical(params.vertical) ? params.vertical : category ? verticalOf(category) : "all"
    if (params.category || params.vertical) setFilters({ ...NONE, vertical, category })
    if (params.focus) setTimeout(() => input.current?.focus(), 300)
  }, [params.category, params.vertical, params.focus])

  const people = React.useMemo(() => {
    const q = words(query)
    const services = browse.services
    const out = browse.pros.filter((p) => {
      if (filters.vertical !== "all" && !p.categories.some((c) => verticalOf(c) === filters.vertical)) return false
      if (filters.category && !p.categories.includes(filters.category)) return false
      if (filters.verified && p.identity !== "verified") return false
      if (filters.taking && !p.acceptingJobs) return false
      const listed = services.filter((s) => s.proId === p.id && s.active)
      const templates = listed.map((s) => getTemplate(s.templateId)).filter((t) => t !== undefined)
      if (filters.place === "home" && !p.homeService) return false
      if (filters.place === "studio" && !p.studioAddress) return false
      if (filters.place === "location" && !templates.some((t) => t.onLocation)) return false
      const inCategory = filters.category ? listed.filter((s) => getTemplate(s.templateId)?.category === filters.category) : listed
      const prices = inCategory.flatMap((s) => Object.values(s.prices))
      if (!priceOk(filters.price, prices.length ? Math.min(...prices) : null)) return false
      if (!q.length) return true
      const haystack = fold(
        [p.name, p.title, p.district, p.city, ...p.areas, ...p.categories.map((c) => CATEGORIES.find((x) => x.id === c)?.label ?? ""), ...templates.map((t) => t.name)].join(" "),
      )
      return q.every((word) => haystack.includes(word))
    })
    const price = (p: AppPro) => browse.priceOf(p.id) ?? Number.POSITIVE_INFINITY
    return out
      .map((pro) => ({ pro, km: app.distanceTo(pro) }))
      .sort((a, b) => {
        if (sort === "near" && a.km !== null && b.km !== null) return a.km - b.km
        if (sort === "cheap") return price(a.pro) - price(b.pro)
        return rankScore(b.pro) - rankScore(a.pro)
      })
  }, [browse, filters, query, sort, app])

  // The same cards as Khám phá: a service someone here offers, from its lowest real price.
  const services = React.useMemo(() => {
    const q = words(query)
    const all = serviceOffers({ pros: browse.pros, proServices: browse.services, works: browse.works, city: app.city, vertical: filters.vertical })
    const nearest = (o: ServiceOffer) => Math.min(...o.pros.map((p) => app.distanceTo(p) ?? Number.POSITIVE_INFINITY))
    return all
      .filter((o) => {
        const t = o.template
        if (filters.category && t.category !== filters.category) return false
        if (!priceOk(filters.price, o.fromPrice)) return false
        if (filters.verified && !o.pros.some((p) => p.identity === "verified")) return false
        if (filters.place === "home" && (t.studioOnly || !o.pros.some((p) => p.homeService))) return false
        if (filters.place === "studio" && !o.pros.some((p) => p.studioAddress)) return false
        if (filters.place === "location" && !t.onLocation) return false
        if (!q.length) return true
        const haystack = fold([t.name, t.description, categoryLabel(t.category), ...o.pros.map((p) => p.name)].join(" "))
        return q.every((word) => haystack.includes(word))
      })
      .sort((a, b) => {
        if (sort === "cheap") return a.fromPrice - b.fromPrice
        if (sort === "near") return nearest(a) - nearest(b)
        return 0
      })
  }, [browse, filters, query, sort, app])

  const active: { key: string; label: string; clear: Partial<Filters> }[] = [
    ...(filters.vertical !== "all" ? [{ key: "vertical", label: getVertical(filters.vertical).label, clear: { vertical: "all" as const, category: null } }] : []),
    ...(filters.category ? [{ key: "category", label: categoryLabel(filters.category), clear: { category: null } }] : []),
    ...(filters.price !== "any" ? [{ key: "price", label: PRICE_LABEL[filters.price], clear: { price: "any" as const } }] : []),
    ...(filters.place !== "any" ? [{ key: "place", label: PLACE_LABEL[filters.place], clear: { place: "any" as const } }] : []),
    ...(filters.verified ? [{ key: "verified", label: "Đã xác minh", clear: { verified: false } }] : []),
    ...(filters.taking ? [{ key: "taking", label: "Đang nhận lịch", clear: { taking: false } }] : []),
  ]
  const hasAddress = app.me.addresses.length > 0
  const categoryChoices = draft.vertical === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.vertical === draft.vertical)
  const loading = (!app.data || app.stale) && !app.dataError && app.configured
  const count = mode === "services" ? services.length : people.length

  const empty = loading ? (
    <View style={{ gap: 12 }}>
      <ProCardSkeleton />
      <ProCardSkeleton />
    </View>
  ) : app.dataError ? (
    <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
  ) : (
    <View style={{ gap: 4 }}>
      <EmptyState
        title={query.trim() ? `Chưa có kết quả cho “${query.trim()}”` : "Không có gì khớp"}
        text={
          active.length
            ? "Thử bỏ bớt bộ lọc, hoặc đăng yêu cầu để người làm nhận việc."
            : `Đăng yêu cầu, người làm${app.city ? ` ở ${app.city}` : ""} sẽ thấy và nhận việc. Không mất phí đăng.`
        }
        action="Đăng yêu cầu"
        onAction={() => router.push("/yeu-cau/moi")}
      />
      {active.length ? <Button label="Bỏ tất cả bộ lọc" variant="ghost" full onPress={() => setFilters(NONE)} /> : null}
      {!active.length && app.city ? <Button label="Tìm cả nước" variant="ghost" full onPress={() => app.setCity(null)} /> : null}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 8 }}>
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <Txt v="h1" style={{ paddingHorizontal: gutter }}>
          Tìm
        </Txt>
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: gutter }}>
          <View
            style={{
              flex: 1,
              height: 48,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              gap: 8,
            }}
          >
            <Icon name="search" size={18} />
            <TextInput
              ref={input}
              value={query}
              onChangeText={setQuery}
              placeholder="Nail, chụp ảnh, tên người làm…"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={{ flex: 1, fontFamily: fonts[400], fontSize: 15, color: colors.ink }}
              accessibilityLabel="Tìm dịch vụ hoặc người làm"
            />
          </View>
          <Press
            onPress={() => {
              setDraft(filters)
              sheet.open()
            }}
            accessibilityLabel={active.length ? `Bộ lọc, đang bật ${active.length}` : "Bộ lọc"}
            style={{ height: 48, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: active.length ? colors.accent : colors.subtle, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Icon name="filter" size={18} color={active.length ? colors.surface : colors.ink} />
            {active.length ? (
              <Txt v="meta" w={700} color={colors.surface}>
                {active.length}
              </Txt>
            ) : null}
          </Press>
        </View>

        {active.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }}>
            {active.map((f) => (
              <Press
                key={f.key}
                haptic="select"
                onPress={() => setFilters((cur) => ({ ...cur, ...f.clear }))}
                accessibilityLabel={`Bỏ lọc ${f.label}`}
                style={{ height: 34, paddingLeft: 12, paddingRight: 8, borderRadius: radius.full, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Txt v="meta" w={600} color={colors.accentDark}>
                  {f.label}
                </Txt>
                <Icon name="close" size={12} color={colors.accentDark} />
              </Press>
            ))}
            <Press onPress={() => setFilters(NONE)} accessibilityLabel="Xoá tất cả bộ lọc" style={{ height: 34, paddingHorizontal: 8, justifyContent: "center" }}>
              <Txt v="meta" w={600} color={colors.inkSoft}>
                Xoá lọc
              </Txt>
            </Press>
          </ScrollView>
        ) : null}

        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <TextTabs
            size="body"
            value={mode}
            onChange={setMode}
            items={[
              { value: "services", label: `Dịch vụ${loading ? "" : ` ${services.length}`}` },
              { value: "people", label: `Người làm${loading ? "" : ` ${people.length}`}` },
            ]}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: gutter, alignItems: "center" }}>
          <Chip label="Phù hợp" selected={sort === "match"} onPress={() => setSort("match")} />
          {hasAddress ? <Chip label="Gần nhất" selected={sort === "near"} onPress={() => setSort("near")} /> : null}
          <Chip label="Giá thấp" selected={sort === "cheap"} onPress={() => setSort("cheap")} />
          <Txt v="meta" color={colors.muted} style={{ marginLeft: "auto" }}>
            {loading ? "" : `${count}${app.city ? ` ở ${app.city}` : ""}`}
          </Txt>
        </View>
        <OfflineNote />
      </View>

      {mode === "services" ? (
        <FlashList
          data={loading ? [] : services}
          keyExtractor={(o) => o.template.id}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <View style={{ paddingBottom: 12 }}>
              <ServiceRow offer={item} />
            </View>
          )}
          refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
          ListEmptyComponent={empty}
        />
      ) : (
        <FlashList
          data={loading ? [] : people}
          keyExtractor={(r) => r.pro.id}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <View style={{ paddingBottom: 12 }}>
              <ProCard pro={item.pro} photos={browse.photosOf.get(item.pro.id) ?? []} price={browse.priceOf(item.pro.id)} distanceKm={item.km} />
            </View>
          )}
          refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
          ListEmptyComponent={empty}
        />
      )}

      <Sheet
        sheet={sheet}
        title="Bộ lọc"
        size="tall"
        footer={
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="Xoá lọc" variant="secondary" onPress={() => setDraft(NONE)} />
            <Button
              label="Xem kết quả"
              full
              style={{ flex: 1 }}
              onPress={() => {
                setFilters(draft)
                sheet.close()
              }}
            />
          </View>
        }
      >
        <Group title="Ngành">
          {[{ id: "all" as const, label: "Tất cả" }, ...VERTICALS].map((v) => (
            <Chip key={v.id} label={v.label} selected={draft.vertical === v.id} onPress={() => setDraft({ ...draft, vertical: v.id, category: null })} />
          ))}
        </Group>
        <Group title="Danh mục">
          <Chip label="Tất cả" selected={!draft.category} onPress={() => setDraft({ ...draft, category: null })} />
          {categoryChoices.map((c) => (
            <Chip key={c.id} label={c.label} selected={draft.category === c.id} onPress={() => setDraft({ ...draft, category: c.id })} />
          ))}
        </Group>
        <Group title="Giá từ">
          {(Object.keys(PRICE_LABEL) as PriceBand[]).map((b) => (
            <Chip key={b} label={PRICE_LABEL[b]} selected={draft.price === b} onPress={() => setDraft({ ...draft, price: b })} />
          ))}
        </Group>
        <Group title="Làm ở đâu">
          {(Object.keys(PLACE_LABEL) as Place[]).map((p) => (
            <Chip key={p} label={PLACE_LABEL[p]} selected={draft.place === p} onPress={() => setDraft({ ...draft, place: p })} />
          ))}
        </Group>
        <Group title="Khác">
          <Chip label="Đã xác minh danh tính" selected={draft.verified} onPress={() => setDraft({ ...draft, verified: !draft.verified })} />
          <Chip label="Đang nhận lịch" selected={draft.taking} onPress={() => setDraft({ ...draft, taking: !draft.taking })} />
        </Group>
      </Sheet>
    </View>
  )
}

/** A service for sale, as a row: its photo (or icon), the lowest price here, how many people offer it. */
function ServiceRow({ offer }: { offer: ServiceOffer }) {
  const { template, pros, fromPrice, photo } = offer
  const shortest = Math.min(...template.variants.map((v) => v.durationMin))
  const who = pros.length === 1 ? pros[0].name : `${pros.length} người nhận`
  return (
    <Press
      onPress={() => router.push({ pathname: "/dich-vu/[id]", params: { id: template.id } })}
      accessibilityLabel={`${template.name}, từ ${formatPrice(fromPrice)}, ${who}`}
      style={{ ...card, flexDirection: "row", gap: 12, padding: 10, alignItems: "center" }}
    >
      <View style={{ width: 72, borderRadius: radius.md, overflow: "hidden" }}>
        {photo ? (
          <Photo uri={photo} rounded={radius.md} recyclingKey={template.id} />
        ) : (
          <View style={{ aspectRatio: 4 / 5, backgroundColor: colors.subtle, alignItems: "center", justifyContent: "center" }}>
            <CategoryIcon id={template.category} size={30} />
          </View>
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt w={700} numberOfLines={2}>
          {template.name}
        </Txt>
        <Txt v="meta" color={colors.muted} tabular numberOfLines={1}>
          Từ{" "}
          <Txt v="meta" w={700} color={colors.accentDark}>
            {formatPrice(fromPrice)}
          </Txt>{" "}
          · {formatDuration(shortest)}
        </Txt>
        <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
          {categoryLabel(template.category)} · {who}
        </Txt>
      </View>
      <Icon name="right" size={14} color={colors.muted} />
    </Press>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt w={700}>{title}</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  )
}
