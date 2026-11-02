import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import {
  CATEGORIES,
  CITIES,
  categoryRow,
  getVertical,
  isVertical,
  serviceOffers,
  showsAverage,
  sortServiceOffers,
  type CategoryId,
  type Pro,
  type VerticalFilter,
} from "@/shared"
import { OfflineNote } from "@/components/offline-note"
import { CatalogTile, ServiceTile, TileGrid, TileSkeleton, comingSoon, tileWidth } from "@/components/tiles"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter, radius } from "@/theme"
import { EmptyState, ErrorNote } from "@/ui/bits"
import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

type PriceBand = "any" | "lt300" | "300to600" | "gt600"
type Trust = "any" | "top" | "verified"
type Sort = "match" | "price" | "near"
type Panel = "city" | "price" | "trust" | "sort"

const PRICE: Record<PriceBand, string> = { any: "Mọi mức giá", lt300: "Dưới 300k", "300to600": "300k – 600k", gt600: "Trên 600k" }
const TRUST: Record<Trust, string> = { any: "Tất cả", top: "Từ 4,5 sao", verified: "Đã xác minh danh tính" }
const SORT: Record<Sort, string> = { match: "Phù hợp", price: "Giá thấp trước", near: "Gần tôi trước" }
const TITLE: Record<Panel, string> = { city: "Khu vực", price: "Giá khởi điểm", trust: "Đánh giá", sort: "Sắp xếp" }

function inBand(band: PriceBand, total: number) {
  if (band === "lt300") return total < 300_000
  if (band === "300to600") return total >= 300_000 && total <= 600_000
  if (band === "gt600") return total > 600_000
  return true
}

function trusted(trust: Trust, pro: Pro) {
  if (trust === "verified") return pro.identity === "verified"
  if (trust === "top") return showsAverage(pro.rating.count) && pro.rating.average >= 4.5
  return true
}

/**
 * Every service in a category (or all of them), photo first, two to a row,
 * with the filters people actually use: where, how much, how well reviewed,
 * and in what order. Below, what 360đẹp lists but nobody here offers yet.
 */
export default function ServiceList() {
  const params = useLocalSearchParams<{ category?: string; vertical?: string }>()
  const app = useApp()
  const browse = useBrowse()
  const { width } = useWindowDimensions()
  const tile = tileWidth(width)
  const sheet = useSheet()
  const [panel, setPanel] = React.useState<Panel>("price")
  const [category, setCategory] = React.useState<CategoryId | "all">(() => CATEGORIES.find((c) => c.id === params.category)?.id ?? "all")
  const [price, setPrice] = React.useState<PriceBand>("any")
  const [trust, setTrust] = React.useState<Trust>("any")
  const [sort, setSort] = React.useState<Sort>("match")

  const vertical: VerticalFilter = isVertical(params.vertical) ? params.vertical : "all"
  const scope = CATEGORIES.filter((c) => vertical === "all" || c.vertical === vertical)

  const offers = React.useMemo(() => {
    if (!app.data) return []
    const all = serviceOffers({
      studioBookingOpen: app.studioBookingOpen,
      pros: browse.pros,
      proServices: browse.services,
      works: browse.works,
      city: app.city,
      vertical,
      proFilter: (p) => trusted(trust, p),
      priceFilter: (total) => inBand(price, total),
    })
    return sortServiceOffers(all, sort, (proId) => {
      const pro = browse.proById.get(proId)
      return pro ? app.distanceTo(pro) : null
    })
  }, [app, browse, vertical, trust, price, sort])

  const chips = categoryRow(scope, offers, category, scope.length + 1).ordered
  const shown = offers.filter((o) => category === "all" || o.template.category === category)
  const soonScope = category === "all" ? scope : scope.filter((c) => c.id === category)
  // Filters narrow who can be booked; "Sắp có" is the catalogue, so it only listens to the category.
  const allHere = React.useMemo(
    () => (app.data ? serviceOffers({ studioBookingOpen: app.studioBookingOpen, pros: browse.pros, proServices: browse.services, works: browse.works, city: app.city, vertical }) : []),
    [app.data, app.studioBookingOpen, app.city, browse, vertical],
  )
  const soon = app.data ? comingSoon(allHere, soonScope, app.studioBookingOpen, category === "all" ? 6 : 12) : []

  const chosen = CATEGORIES.find((c) => c.id === category)
  const title = chosen ? chosen.label : vertical === "all" ? "Tất cả dịch vụ" : getVertical(vertical).label
  const where = app.city ? ` ở ${app.city}` : ""
  const loading = (!app.data || app.stale) && !app.dataError && app.configured
  const filtered = price !== "any" || trust !== "any"
  const hasAddress = app.me.addresses.length > 0

  const open = (p: Panel) => {
    setPanel(p)
    sheet.open()
  }
  // Illustrations take turns within a category, so two tiles never share one.
  const turns = new Map<CategoryId, number>()
  const nextTurn = (c: CategoryId) => {
    const n = turns.get(c) ?? 0
    turns.set(c, n + 1)
    return n
  }

  let body: React.ReactNode
  if (loading) {
    body = (
      <TileGrid>
        {[0, 1, 2, 3].map((i) => (
          <TileSkeleton key={i} width={tile} />
        ))}
      </TileGrid>
    )
  } else if (!app.configured) {
    body = <EmptyState title="App chưa kết nối máy chủ" text="Chưa tải được dịch vụ. Vui lòng thử lại sau." />
  } else if (app.dataError && !app.data) {
    body = <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
  } else if (!shown.length) {
    body = (
      <View style={{ gap: 4 }}>
        <EmptyState
          title={filtered ? "Không có dịch vụ khớp bộ lọc" : `${chosen ? `${chosen.label}: c` : "C"}hưa có ai nhận lịch${where}`}
          text={filtered ? "Thử bỏ bớt bộ lọc." : "Đăng yêu cầu: người làm quanh bạn sẽ thấy và nhận việc. Không mất phí đăng."}
          action={filtered ? "Bỏ bộ lọc" : "Đăng yêu cầu"}
          onAction={
            filtered
              ? () => {
                  setPrice("any")
                  setTrust("any")
                }
              : () => router.push("/yeu-cau/moi")
          }
        />
        {!filtered && app.city ? <Button label="Xem cả nước" variant="ghost" full onPress={() => app.setCity(null)} /> : null}
      </View>
    )
  } else {
    body = (
      <TileGrid>
        {shown.map((o) => (
          <ServiceTile
            key={o.template.id}
            offer={o}
            width={tile}
            index={o.photo ? 0 : nextTurn(o.template.category)}
            // The service page lists only the people who pass the same filters.
            href={{ pathname: "/dich-vu/[id]", params: { id: o.template.id, verified: trust === "verified" ? "1" : "", minTotal: price === "300to600" ? "300000" : price === "gt600" ? "600001" : "", maxTotal: price === "lt300" ? "299999" : price === "300to600" ? "600000" : "" } }}
          />
        ))}
      </TileGrid>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
      >
        {/* Category, then filters: two rows that stay under the header. */}
        <View style={{ backgroundColor: colors.canvas, paddingBottom: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8, paddingTop: 4 }}>
            <Pill label="Tất cả" selected={category === "all"} onPress={() => setCategory("all")} />
            {chips.map((c) => (
              <Pill key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id === category ? "all" : c.id)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8 }}>
            <FilterChip icon="pin" label={app.city ?? "Cả nước"} active={false} onPress={() => open("city")} />
            <FilterChip label={price === "any" ? "Giá" : PRICE[price]} active={price !== "any"} onPress={() => open("price")} />
            <FilterChip icon="star" label={trust === "any" ? "Đánh giá" : TRUST[trust]} active={trust !== "any"} onPress={() => open("trust")} />
            <FilterChip icon="filter" label={SORT[sort]} active={sort !== "match"} onPress={() => open("sort")} />
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: gutter, paddingTop: 16, gap: 16 }}>
          <OfflineNote />
          {!loading && shown.length ? (
            <Txt v="meta" color={colors.muted}>
              {shown.length} dịch vụ đang nhận lịch{where}
            </Txt>
          ) : null}
          {body}
        </View>

        {!loading && soon.length ? (
          <View style={{ paddingHorizontal: gutter, paddingTop: 36, gap: 14 }}>
            <View style={{ gap: 2 }}>
              <Txt v="h2">Sắp có{where}</Txt>
              <Txt v="meta" color={colors.muted}>
                Giá theo bảng giá 360đẹp · đăng yêu cầu để được nhận
              </Txt>
            </View>
            <TileGrid>
              {soon.map((t) => (
                <CatalogTile key={t.id} template={t} width={tile} index={nextTurn(t.category)} />
              ))}
            </TileGrid>
          </View>
        ) : null}
      </ScrollView>

      <Sheet sheet={sheet} title={TITLE[panel]} size="medium">
        {panel === "city" ? (
          <Options
            value={app.city ?? "all"}
            options={[...CITIES.map((c) => ({ value: c, label: c })), { value: "all", label: "Cả nước" }]}
            onChange={(v) => {
              app.setCity(v === "all" ? null : v)
              sheet.close()
            }}
          />
        ) : panel === "price" ? (
          <>
            <Txt v="meta" color={colors.inkSoft}>
              Theo tổng dịch vụ tối thiểu, chưa gồm phí di chuyển hoặc đặt gấp.
            </Txt>
            <Options value={price} options={(Object.keys(PRICE) as PriceBand[]).map((v) => ({ value: v, label: PRICE[v] }))} onChange={(v) => { setPrice(v); sheet.close() }} />
          </>
        ) : panel === "trust" ? (
          <>
            <Txt v="meta" color={colors.inkSoft}>
              Chỉ tính người có đủ đánh giá từ khách đã hoàn thành lịch hẹn.
            </Txt>
            <Options value={trust} options={(Object.keys(TRUST) as Trust[]).map((v) => ({ value: v, label: TRUST[v] }))} onChange={(v) => { setTrust(v); sheet.close() }} />
          </>
        ) : (
          <>
            <Options
              value={sort}
              options={(Object.keys(SORT) as Sort[]).filter((v) => v !== "near" || hasAddress).map((v) => ({ value: v, label: SORT[v] }))}
              onChange={(v) => { setSort(v); sheet.close() }}
            />
            {hasAddress ? null : (
              <Txt v="meta" color={colors.inkSoft}>
                Thêm địa chỉ trong Tôi để sắp xếp theo khoảng cách.
              </Txt>
            )}
          </>
        )}
      </Sheet>
    </View>
  )
}

/** A category to switch to. Selected is ink, like every selected state. */
function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      haptic="select"
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <View style={{ height: 36, paddingHorizontal: 14, borderRadius: radius.full, justifyContent: "center", backgroundColor: selected ? colors.ink : colors.surface, borderWidth: 1, borderColor: selected ? colors.ink : colors.line }}>
        <Txt v="meta" w={600} color={selected ? colors.surface : colors.ink}>
          {label}
        </Txt>
      </View>
    </Press>
  )
}

/** A filter that opens its choices; on when it narrows the list. */
function FilterChip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: "pin" | "star" | "filter" }) {
  const fg = active ? colors.accentDark : colors.ink
  return (
    <Press onPress={onPress} accessibilityLabel={`${label}, đổi`} style={{ minHeight: 44, justifyContent: "center" }}>
      <View style={{ height: 36, paddingLeft: 12, paddingRight: 10, borderRadius: radius.full, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: active ? colors.accentSoft : colors.subtle, borderWidth: 1, borderColor: active ? colors.accent : colors.subtle }}>
        {icon ? <Icon name={icon} size={13} color={fg} /> : null}
        <Txt v="meta" w={600} color={fg}>
          {label}
        </Txt>
        <Icon name="down" size={11} color={fg} />
      </View>
    </Press>
  )
}

function Options<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={{ gap: 6 }} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <Press
            key={o.value}
            haptic="select"
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: selected ? colors.subtle : colors.surface, borderWidth: 1, borderColor: selected ? colors.ink : colors.line }}
          >
            <Txt w={selected ? 600 : 400}>{o.label}</Txt>
            {selected ? <Icon name="check" size={16} color={colors.ink} /> : null}
          </Press>
        )
      })}
    </View>
  )
}

