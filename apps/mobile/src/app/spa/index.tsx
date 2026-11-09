import * as React from "react"
import { Image } from "expo-image"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { FlatList, View } from "react-native"
import { SPA, SPA_TINT, getTemplate, listingLocationOpen, openState, showsAverage, spaPhoto, type ProService } from "@/shared"
import { fetchSlotBeds } from "@/data/bookings"
import { formatKm, formatPrice, formatRating, formatDuration, todayISO } from "@/data/format"
import { imageUrl } from "@/data/links"
import type { AppPro } from "@/data/public"
import { PhotoBadge } from "@/components/tiles"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter, hairline, radius } from "@/theme"
import { EmptyState } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

type Filter = "open" | "rated"

/**
 * Spas near the customer (owner, 08/11/2026): a second line beside the
 * Artists, reached from the Spa ring and the "Đến spa gần bạn" row on Khám
 * phá. Nearest first; each card says whether the spa is open now, its price
 * for the chosen service and the times still free today.
 */
export default function SpaList() {
  const params = useLocalSearchParams<{ service?: string }>()
  const app = useApp()
  const browse = useBrowse()
  const [service, setService] = React.useState<string | null>(params.service ?? null)
  const [filters, setFilters] = React.useState<Set<Filter>>(new Set())

  const listingsOf = React.useCallback(
    (spa: AppPro): ProService[] =>
      browse.services.filter((s) => s.proId === spa.id && s.active && Object.keys(s.prices).length > 0 && listingLocationOpen(getTemplate(s.templateId), spa, app.studioBookingOpen) && !getTemplate(s.templateId)?.addon),
    [browse.services, app.studioBookingOpen],
  )

  // The services spas here offer, most offered first.
  const services = React.useMemo(() => {
    const count = new Map<string, number>()
    for (const { pro } of browse.spas) for (const s of listingsOf(pro)) count.set(s.templateId, (count.get(s.templateId) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => getTemplate(id)!).filter(Boolean)
  }, [browse.spas, listingsOf])

  const spas = browse.spas.filter(({ pro }) => {
    if (service && !listingsOf(pro).some((s) => s.templateId === service)) return false
    if (filters.has("open") && !openState(pro.openingHours ?? []).open) return false
    if (filters.has("rated") && !(showsAverage(pro.rating.count) && pro.rating.average >= 4.5)) return false
    return true
  })

  const toggle = (f: Filter) =>
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })

  const title = service ? (getTemplate(service)?.name ?? SPA.listTitle) : SPA.listTitle

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={spas}
        keyExtractor={(x) => x.pro.id}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={refreshControl(app.loading && Boolean(app.data), () => void app.refresh())}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 40, gap: 20 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            {services.length > 1 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Toggle label="Tất cả dịch vụ" active={!service} onPress={() => setService(null)} />
                {services.map((t) => (
                  <Toggle key={t.id} label={t.name} active={service === t.id} onPress={() => setService(service === t.id ? null : t.id)} />
                ))}
              </View>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Toggle label="Gần nhất" active solid />
              <Toggle label="Đang mở cửa" active={filters.has("open")} onPress={() => toggle("open")} />
              <Toggle label="★ 4,5+" active={filters.has("rated")} onPress={() => toggle("rated")} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={browse.spas.length ? "Không có spa khớp bộ lọc" : "Chưa có spa ở khu vực này"}
            text={browse.spas.length ? "Bỏ bớt bộ lọc để xem thêm spa." : "360đẹp đang mời thêm spa. Bạn có thể đặt Artist đến tận nơi."}
          />
        }
        renderItem={({ item, index }) => (
          <SpaCard spa={item.pro} km={item.km} index={index} photo={browse.photosOf.get(item.pro.id)?.[0]} listings={listingsOf(item.pro)} service={service} />
        )}
      />
    </View>
  )
}

function Toggle({ label, active, onPress, solid }: { label: string; active: boolean; onPress?: () => void; solid?: boolean }) {
  const bg = solid ? colors.ink : active ? colors.accentSoft : colors.surface
  const fg = solid ? colors.surface : active ? colors.accentDark : colors.ink
  return (
    <Press
      onPress={onPress ?? (() => {})}
      haptic="select"
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: radius.full, justifyContent: "center", backgroundColor: bg, borderWidth: hairline, borderColor: solid ? colors.ink : active ? colors.accent : colors.line }}
    >
      <Txt v="meta" w={600} color={fg}>
        {label}
      </Txt>
    </Press>
  )
}

/** A spa in the list: its room, whether it is open, the price and today's free times. */
export function SpaCard({ spa, km, index, photo, listings, service }: { spa: AppPro; km: number | null; index: number; photo?: string; listings: ProService[]; service: string | null }) {
  const open = openState(spa.openingHours ?? [])
  // The chosen service, or the cheapest one, decides the price rows and the free times.
  const shown = (service ? listings.find((s) => s.templateId === service) : undefined) ?? [...listings].sort((a, b) => Math.min(...Object.values(a.prices)) - Math.min(...Object.values(b.prices)))[0]
  const template = shown ? getTemplate(shown.templateId) : undefined
  const variants = template?.variants.filter((v) => shown?.prices[v.id]) ?? []
  const first = variants[0]
  const [today, setToday] = React.useState<{ startsAt: string; time: string; freeBeds: number }[] | null>(null)

  React.useEffect(() => {
    if (!shown || !first) return
    let live = true
    fetchSlotBeds({ proUuid: spa.uuid, lines: [{ templateId: shown.templateId, variantId: first.id, quantity: 1 }], date: todayISO() })
      .then((slots) => live && setToday(slots.filter((s) => s.freeBeds > 0).slice(0, 4)))
      .catch(() => live && setToday([]))
    return () => {
      live = false
    }
  }, [spa.uuid, shown?.templateId, first?.id])

  const book = (variantId?: string, time?: string) =>
    router.push({ pathname: "/book/[proId]", params: { proId: spa.id, ...(shown ? { template: shown.templateId, variant: variantId ?? first?.id ?? "", ...(time ? { time, date: todayISO() } : {}) } : {}) } })
  const profile = () => router.push({ pathname: "/pros/[id]", params: shown ? { id: spa.id, service: shown.templateId } : { id: spa.id } })

  return (
    <Press onPress={profile} accessibilityLabel={`${spa.name}, ${open.label}${km !== null ? `, cách ${formatKm(km)}` : ""}`} style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface }}>
      <View style={{ height: 200 }}>
        <Image source={{ uri: photo ?? imageUrl(spaPhoto(index)) }} style={{ flex: 1, backgroundColor: SPA_TINT.bg }} contentFit="cover" transition={150} accessible={false} />
        {photo ? null : <PhotoBadge text="Ảnh minh hoạ" position="tl" />}
        {km !== null ? (
          <View style={{ position: "absolute", right: 12, bottom: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.surface }}>
            <Txt v="meta" w={700}>
              {formatKm(km)}
            </Txt>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 18, gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Txt v="title" numberOfLines={1}>
            {spa.name}
          </Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: open.open ? colors.success : colors.muted }} />
            <Txt v="meta" color={colors.inkSoft} numberOfLines={1} style={{ flexShrink: 1 }}>
              {open.label}
              {km === null ? ` · ${spa.district}` : ""}
            </Txt>
          </View>
          <Txt v="meta" color={colors.inkSoft}>
            {showsAverage(spa.rating.count) ? `★ ${formatRating(spa.rating.average)} (${spa.rating.count})` : "Spa mới"}
            {spa.stats.completedJobs > 0 ? ` · ${spa.stats.completedJobs} lịch đã xong` : ""}
          </Txt>
        </View>

        {template && variants.length ? (
          <View style={{ borderTopWidth: hairline, borderTopColor: colors.line }}>
            {!service && listings.length > 1 ? (
              <Txt v="meta" color={colors.muted} style={{ paddingTop: 10 }}>
                {template.name} · và {listings.length - 1} dịch vụ khác
              </Txt>
            ) : null}
            {variants.slice(0, 3).map((v) => (
              <Press key={v.id} onPress={() => book(v.id)} accessibilityLabel={`Đặt ${template.name}, ${v.label}, ${formatPrice(shown!.prices[v.id]!)}`} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: hairline, borderBottomColor: colors.line, gap: 12 }}>
                <Txt numberOfLines={2} style={{ flexShrink: 1 }}>
                  {/phút|giờ/.test(v.label) ? v.label : `${v.label} · ${formatDuration(v.durationMin)}`}
                </Txt>
                <Txt w={700} color={colors.accent}>
                  {formatPrice(shown!.prices[v.id]!)}
                </Txt>
              </Press>
            ))}
          </View>
        ) : null}

        {today && today.length ? (
          <View style={{ gap: 8 }}>
            <Txt v="meta" color={colors.muted}>
              Còn chỗ hôm nay
            </Txt>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {today.map((s) => (
                <Press key={s.startsAt} onPress={() => book(undefined, s.time)} accessibilityLabel={`Đặt lúc ${s.time}`} style={{ flex: 1, height: 40, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                  <Txt v="meta" w={700} color={colors.accentDark}>
                    {s.time}
                  </Txt>
                </Press>
              ))}
            </View>
          </View>
        ) : null}
        {!listings.length ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name="right" size={14} color={colors.muted} />
            <Txt v="meta" color={colors.muted}>
              Xem dịch vụ của spa
            </Txt>
          </View>
        ) : null}
      </View>
    </Press>
  )
}
