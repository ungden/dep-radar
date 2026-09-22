import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { useLocalSearchParams } from "expo-router"
import { TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  CATEGORIES,
  VERTICALS,
  getTemplate,
  isVertical,
  rankScore,
  verticalOf,
  type CategoryId,
  type VerticalFilter,
} from "@/shared"
import { fold } from "@/data/format"
import type { AppPro } from "@/data/public"
import { ProCard } from "@/components/cards"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Chip, EmptyState } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

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

export default function Search() {
  const params = useLocalSearchParams<{ category?: string; vertical?: string; focus?: string }>()
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const sheet = useSheet()
  const input = React.useRef<TextInput>(null)
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

  const results = React.useMemo(() => {
    const q = fold(query.trim())
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
      if (!q) return true
      const haystack = fold(
        [p.name, p.title, p.district, p.city, ...p.areas, ...p.categories.map((c) => CATEGORIES.find((x) => x.id === c)?.label ?? ""), ...templates.map((t) => t.name)].join(" "),
      )
      return q.split(/\s+/).every((word) => haystack.includes(word))
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

  const activeCount =
    (filters.vertical !== "all" ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.price !== "any" ? 1 : 0) +
    (filters.verified ? 1 : 0) +
    (filters.taking ? 1 : 0) +
    (filters.place !== "any" ? 1 : 0)
  const hasAddress = app.me.addresses.length > 0
  const categoryChoices = draft.vertical === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.vertical === draft.vertical)

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 8 }}>
      <View style={{ paddingHorizontal: gutter, gap: 12, paddingBottom: 8 }}>
        <Txt v="h1">Tìm</Txt>
        <View style={{ flexDirection: "row", gap: 8 }}>
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
            accessibilityLabel={activeCount ? `Bộ lọc, đang bật ${activeCount}` : "Bộ lọc"}
            style={{ height: 48, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: activeCount ? colors.ink : colors.subtle, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Icon name="filter" size={18} color={activeCount ? colors.surface : colors.ink} />
            {activeCount ? (
              <Txt v="meta" w={700} color={colors.surface}>
                {activeCount}
              </Txt>
            ) : null}
          </Press>
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip label="Phù hợp" selected={sort === "match"} onPress={() => setSort("match")} />
          {hasAddress ? <Chip label="Gần nhất" selected={sort === "near"} onPress={() => setSort("near")} /> : null}
          <Chip label="Giá thấp" selected={sort === "cheap"} onPress={() => setSort("cheap")} />
        </View>
        <Txt v="meta" color={colors.muted}>
          {results.length} người{app.city ? ` ở ${app.city}` : ""}
          {filters.category ? ` · ${CATEGORIES.find((c) => c.id === filters.category)?.label}` : ""}
        </Txt>
      </View>

      <FlashList
        data={results}
        keyExtractor={(r) => r.pro.id}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <View style={{ paddingBottom: 12 }}>
            <ProCard pro={item.pro} photos={browse.photosOf.get(item.pro.id) ?? []} price={browse.priceOf(item.pro.id)} distanceKm={item.km} />
          </View>
        )}
        refreshing={app.loading && Boolean(app.data)}
        onRefresh={() => void app.refresh()}
        ListEmptyComponent={
          app.data ? (
            <EmptyState
              title="Không có ai khớp"
              text={activeCount ? "Thử bỏ bớt bộ lọc." : app.city ? `Chưa có người làm phù hợp ở ${app.city}.` : "Thử từ khoá khác."}
              action={activeCount ? "Bỏ bộ lọc" : app.city ? "Tìm cả nước" : undefined}
              onAction={() => (activeCount ? setFilters(NONE) : app.setCity(null))}
            />
          ) : null
        }
      />

      <Sheet
        sheet={sheet}
        title="Bộ lọc"
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt w={700}>{title}</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  )
}
