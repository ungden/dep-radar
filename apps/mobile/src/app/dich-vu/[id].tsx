import * as React from "react"
import { Image } from "expo-image"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { CATEGORY_TINTS, providerLocationOpen, categoryLabel, excludes, getTemplate, placeLabel, rankScore, listedOptions, serviceDuration, serviceQuantity, showsAverage } from "@/shared"
import { formatDuration, formatKm, formatPrice } from "@/data/format"
import { type AppPro, type AppWork } from "@/data/public"
import { PostCard } from "@/components/cards"
import { illustration, offerRating } from "@/components/tiles"
import { useApp } from "@/state/app"
import { ConductNote } from "@/components/conduct"
import { needsConductNote } from "@/shared"
import { colors, gutter, radius, hairline } from "@/theme"
import { Button } from "@/ui/button"
import { Avatar, Card, Divider, EmptyState, ErrorNote, Photo, Rating, Skeleton, VerifiedMark } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

const COLUMN_GAP = 12

/**
 * A service, for sale: what it is and what it costs, then the two ways to get
 * it: let an Artist take the order, or choose one yourself. Where a service
 * card on Khám phá leads; mirrors /dich-vu/[id] on the web.
 */
export default function ServiceScreen() {
  const params = useLocalSearchParams<{ id: string; place?: string; verified?: string; minTotal?: string; maxTotal?: string }>()
  const { id } = params
  const [showPriceFrame, setShowPriceFrame] = React.useState(false)
  const minTotal = Math.max(0, Number(params.minTotal) || 0)
  const maxTotal = Math.max(0, Number(params.maxTotal) || 0)
  const priceOk = (total: number) => total >= minTotal && (!maxTotal || total <= maxTotal)
  const app = useApp()
  const { width } = useWindowDimensions()
  const template = getTemplate(id)
  const { city, data } = app

  const { ranked, elsewhere, works } = React.useMemo(() => {
    if (!data || !template) return { ranked: [] as AppPro[], elsewhere: 0, works: [] as AppWork[] }
    const offers = (p: AppPro) =>
      data.services.some((s) => s.proId === p.id && s.templateId === template.id && s.active && listedOptions(template, s.prices, app.studioBookingOpen).some((o) => priceOk(o.minimumTotal)))
    const all = data.pros.filter((p) => providerLocationOpen(p, app.studioBookingOpen) && p.published && offers(p) && !app.blocked.has(p.uuid) && (params.verified !== "1" || p.identity === "verified") && (params.place !== "home" || (p.homeService && !template.studioOnly)) && (params.place !== "studio" || Boolean(p.studioAddress)) && (params.place !== "location" || template.onLocation))
    const near = all.filter((p) => !city || p.city === city)
    const ranked = [...near].sort((a, b) => {
      if (a.acceptingJobs !== b.acceptingJobs) return a.acceptingJobs ? -1 : 1
      const da = app.distanceTo(a)
      const db = app.distanceTo(b)
      if (da !== null && db !== null && Math.abs(da - db) > 1) return da - db
      return rankScore(b) - rankScore(a)
    })
    const nearIds = new Set(near.map((p) => p.id))
    const works = data.works.filter((w) => w.templateId === template.id && w.images[0] && (!city || nearIds.has(w.proId))).slice(0, 8)
    return { ranked, elsewhere: all.length - near.length, works }
  }, [data, template, city, app, params.verified, params.place, minTotal, maxTotal])

  if (!template) return <EmptyState title="Không có dịch vụ này" text="Có thể dịch vụ đã đổi tên." action="Về Khám phá" onAction={() => router.replace("/")} />

  const loadingFirst = (!data || app.stale) && !app.dataError && app.configured
  const cardWidth = (width - gutter * 2 - COLUMN_GAP) / 2
  const where = city ? ` ở ${city}` : ""
  const availablePackages = template.variants.flatMap((variant) => {
    const prices = ranked.filter((p) => p.acceptingJobs).flatMap((p) => (data?.services ?? []).filter((s) => s.proId === p.id && s.templateId === template.id && s.active).flatMap((s) => listedOptions(template, s.prices, app.studioBookingOpen).filter((o) => o.variant.id === variant.id && priceOk(o.minimumTotal)).map((o) => o.unitPrice)))
    return prices.length ? [{ variant, price: Math.min(...prices) }] : []
  })

  // Nobody to book: 360đẹp's own price bands are still the real starting prices.
  const packages = availablePackages.length || minTotal || maxTotal ? availablePackages : template.variants.map((variant) => ({ variant, price: variant.tiers[0] }))

  // Who can be booked right now, and from how much.
  const bookable = ranked.filter((p) => p.acceptingJobs)
  const from = availablePackages.length ? availablePackages.reduce((m, x) => (x.price < m.price ? x : m)) : null
  const rating = offerRating(ranked)
  const catalogFrom = [...template.variants].sort((x, y) => x.tiers[0] - y.tiers[0])[0]
  // Real work of this service first; without any, its category's illustrations, labelled.
  const real = works.slice(0, 6)
  const gallery = real.length
    ? real.map((w) => ({ key: w.id, uri: w.images[0], work: w.id as string | undefined }))
    : [0, 1, 2].map((i) => ({ key: `ill-${i}`, uri: illustration(template.category, i), work: undefined as string | undefined }))
  const shotWidth = Math.round(Math.min(width * 0.7, 320))
  const FIRST_ARTISTS = 3

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 48, gap: 24 }}
        refreshControl={refreshControl(app.loading && Boolean(data), () => void app.refresh())}
      >
        {/* The work itself, first */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={shotWidth + 8} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: gutter, gap: 8 }}>
          {gallery.map((g, i) => {
            const shot = (
              <>
                <Photo uri={g.uri} recyclingKey={g.key} />
                <View style={{ position: "absolute", left: 8, bottom: 8, paddingHorizontal: 8, height: 22, borderRadius: radius.full, justifyContent: "center", backgroundColor: "rgba(20,18,19,0.55)" }}>
                  <Txt v="label" w={600} color={colors.surface} style={{ fontSize: 13, lineHeight: 17 }}>
                    {g.work ? `${i + 1}/${gallery.length}` : "Ảnh minh hoạ"}
                  </Txt>
                </View>
              </>
            )
            const work = g.work
            return work ? (
              <Press key={g.key} onPress={() => router.push({ pathname: "/works/[id]", params: { id: work } })} accessibilityLabel={`Ảnh thật ${i + 1}/${gallery.length}, mở bài đăng`} style={{ width: shotWidth }}>
                {shot}
              </Press>
            ) : (
              <View key={g.key} accessible accessibilityLabel={`Ảnh minh hoạ ${i + 1}/${gallery.length}`} style={{ width: shotWidth }}>
                {shot}
              </View>
            )
          })}
        </ScrollView>

        {/* What it is, what it costs */}
        <View style={{ paddingHorizontal: gutter, gap: 6, marginTop: -8 }}>
          <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, height: 26, borderRadius: radius.full, justifyContent: "center", backgroundColor: CATEGORY_TINTS[template.category].bg }}>
            <Txt v="meta" w={600} color={CATEGORY_TINTS[template.category].fg}>
              {categoryLabel(template.category)}
            </Txt>
          </View>
          <Txt v="h1">{template.name}</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 8, rowGap: 2 }}>
            {from ? (
              <Txt tabular>
                <Txt v="meta" color={colors.muted}>Từ </Txt>
                <Txt v="lead" w={700} color={colors.accentDark}>
                  {formatPrice(from.price)}
                  {from.variant.perPerson ? "/người" : ""}
                </Txt>
              </Txt>
            ) : (
              // Nobody to book: 360đẹp's own price band is still the real starting price.
              <Txt tabular>
                <Txt v="meta" color={colors.muted}>Từ </Txt>
                <Txt v="lead" w={700} color={colors.accentDark}>
                  {formatPrice(catalogFrom.tiers[0])}
                  {catalogFrom.perPerson ? "/người" : ""}
                </Txt>
              </Txt>
            )}
            <Txt v="meta" color={colors.muted}>
              {"· "}
              {formatDuration(serviceDuration(from?.variant ?? catalogFrom, serviceQuantity(from?.variant ?? catalogFrom)))}
            </Txt>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {showsAverage(rating.count) ? <Rating average={rating.average} count={rating.count} /> : null}
            <Txt v="meta" color={colors.inkSoft}>
              {showsAverage(rating.count) ? "· " : ""}
              {loadingFirst ? "Đang tải Artist…" : bookable.length ? `${bookable.length} Artist đang nhận lịch${where}` : `Chưa có Artist nhận${where}`}
            </Txt>
          </View>
          <Txt color={colors.inkSoft} style={{ marginTop: 6 }}>
            {template.description}
          </Txt>
        </View>

        {/* Way one: an Artist takes the order */}
        <View style={{ marginHorizontal: gutter, marginTop: -8, padding: 14, gap: 10, borderRadius: radius.lg, backgroundColor: colors.accentSoft }}>
          <View style={{ gap: 2 }}>
            <Txt v="title">Để Artist nhận đơn</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              Bạn chọn gói và giờ, Artist nhận trước sẽ đến.
            </Txt>
          </View>
          <Button label="Chọn gói và giờ" full onPress={() => router.push({ pathname: "/yeu-cau/moi", params: { template: template.id } })} />
        </View>

        {/* Way two: choose the Artist yourself */}
        <View style={{ paddingHorizontal: gutter, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Txt v="h2" style={{ flexShrink: 1 }}>
              Hoặc tự chọn Artist{where}
            </Txt>
            {ranked.length > FIRST_ARTISTS ? (
              <Press onPress={() => router.navigate({ pathname: "/artist", params: { service: template.id } })} accessibilityLabel="Xem tất cả Artist" style={{ minHeight: 44, justifyContent: "center" }}>
                <Txt v="meta" w={600} color={colors.accentDark}>
                  Xem tất cả
                </Txt>
              </Press>
            ) : null}
          </View>
          {loadingFirst ? (
            <>
              <Skeleton style={{ height: 78, borderRadius: radius.md }} />
              <Skeleton style={{ height: 78, borderRadius: radius.md }} />
            </>
          ) : app.dataError && !data ? (
            <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
          ) : ranked.length === 0 ? (
            <View style={{ gap: 8, alignItems: "flex-start" }}>
              <Txt color={colors.inkSoft}>
                {elsewhere ? `Chưa có ai nhận dịch vụ này${where}. Có ${elsewhere} Artist ở nơi khác.` : `Chưa có Artist nhận dịch vụ này${where}. Bạn vẫn đặt được, Artist mới vào sẽ thấy đơn của bạn.`}
              </Txt>
              {elsewhere ? <Button label="Xem cả nước" variant="secondary" size="sm" onPress={() => app.setCity(null)} /> : null}
            </View>
          ) : (
            ranked.slice(0, FIRST_ARTISTS).map((p) => <ProOffer key={p.id} pro={p} templateId={template.id} minTotal={minTotal} maxTotal={maxTotal} />)
          )}
        </View>

        {/* Options, price first */}
        <View style={{ paddingHorizontal: gutter }}>
          <Card style={{ padding: 18, gap: 0, borderWidth: hairline, borderColor: colors.line }}>
            <Txt v="title" w={700}>Gói & giá</Txt>
            {packages.length ? packages.map(({ variant: v, price }, i) => <View key={v.id}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt w={600}>{v.label}</Txt>
                  <Txt v="meta" color={colors.inkSoft}>{formatDuration(serviceDuration(v, serviceQuantity(v)))}</Txt>
                  {(v.minQuantity ?? 1) > 1 && <Txt v="meta" color={colors.inkSoft}>Tối thiểu {v.minQuantity} người · từ {formatPrice(price * v.minQuantity!)}/nhóm</Txt>}
                </View>
                <Txt w={700} tabular color={colors.accentDark}>Từ {formatPrice(price)}{v.perPerson ? "/người" : ""}</Txt>
              </View>
            </View>) : <Txt color={colors.inkSoft} style={{ marginVertical: 12 }}>Chưa có gói phù hợp với lựa chọn này.</Txt>}
            <Button label={showPriceFrame ? "Ẩn khung giá tham khảo" : "Xem khung 3 mức giá"} variant="ghost" full onPress={() => setShowPriceFrame((v) => !v)} />
            {showPriceFrame && <View style={{ gap: 16, marginTop: 12 }}>
              <Txt v="meta" color={colors.inkSoft}>Khung giá tham khảo. Artist chọn một mức cho từng gói; mức đang nhận lịch nằm ở trên.</Txt>
              {template.variants.map((v) => <View key={v.id} style={{ gap: 8 }}><Txt w={600}>{v.label}</Txt><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{v.tiers.map((tier) => <Txt key={tier} v="meta" style={{ backgroundColor: colors.subtle, padding: 8, borderRadius: radius.sm }}>{formatPrice(tier)}{v.perPerson ? "/người" : ""}</Txt>)}</View></View>)}
            </View>}
          </Card>
        </View>

        {/* What is included */}
        <View style={{ paddingHorizontal: gutter, gap: 10 }}>
          <Txt v="h2">Bao gồm</Txt>
          <Fact icon="pin" text={placeLabel(template, undefined, app.studioBookingOpen)} />
          {template.deliverable ? (
            <Fact icon="box" text={`${template.deliverable}${template.deliveryDays ? `, giao trong ${template.deliveryDays} ngày` : ""}`} />
          ) : null}
          {template.includes.map((line) => (excludes(line) ? <Fact key={line} text={line} soft /> : <Fact key={line} icon="check" text={line} />))}
          {needsConductNote(template.category) ? (
            <View style={{ marginTop: 6 }}>
              <ConductNote />
            </View>
          ) : null}
        </View>

        {/* Real photos, as posts */}
        {works.length > 0 ? (
          <View style={{ paddingHorizontal: gutter, gap: 14 }}>
            <Txt v="h2">Tác phẩm của dịch vụ này</Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: COLUMN_GAP }}>
              {works.map((w) => {
                const pro = data?.pros.find((p) => p.id === w.proId)
                return (
                  <View key={w.id} style={{ width: cardWidth }}>
                    <PostCard work={w} pro={pro} services={data?.services ?? []} distanceKm={pro ? app.distanceTo(pro) : null} />
                  </View>
                )
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

    </View>
  )
}

function Fact({ icon, text, soft }: { icon?: "pin" | "box" | "check"; text: string; soft?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <View style={{ width: 18, paddingTop: 2, alignItems: "center" }}>{icon ? <Icon name={icon} size={16} color={icon === "check" ? colors.success : colors.accent} /> : null}</View>
      <Txt color={soft ? colors.inkSoft : colors.ink} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  )
}

/** One Artist who does this service here: a row with their work and price, opening their profile. */
function ProOffer({ pro, templateId, minTotal, maxTotal }: { pro: AppPro; templateId: string; minTotal: number; maxTotal: number }) {
  const app = useApp()
  const listing = app.data?.services.find((s) => s.proId === pro.id && s.templateId === templateId && s.active)
  const start = listedOptions(getTemplate(templateId)!, listing?.prices ?? {}, app.studioBookingOpen).filter((o) => o.minimumTotal >= minTotal && (!maxTotal || o.minimumTotal <= maxTotal)).sort((a, b) => a.minimumTotal - b.minimumTotal)[0]
  const price = start?.unitPrice ?? null
  const km = app.distanceTo(pro)
  const photo = React.useMemo(
    () =>
      [...(app.data?.works ?? [])]
        .filter((w) => w.proId === pro.id && w.images[0])
        .sort((a, b) => Number(b.templateId === templateId) - Number(a.templateId === templateId))[0]?.images[0],
    [app.data, pro.id, templateId],
  )

  return (
    <Press
      onPress={() => router.push({ pathname: "/pros/[id]", params: { id: pro.id, service: templateId } })}
      accessibilityLabel={`${pro.name}${price !== null ? `, từ ${formatPrice(price)}` : ""}`}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: hairline, borderColor: colors.line }}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={{ width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
      ) : (
        <Avatar name={pro.name} uri={pro.avatar} artist tone={pro.tone} size={56} />
      )}
      <View style={{ flex: 1, gap: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Txt w={600} numberOfLines={1} style={{ flexShrink: 1 }}>
            {pro.name}
          </Txt>
          {pro.identity === "verified" ? <VerifiedMark size={14} /> : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Rating average={pro.rating.average} count={pro.rating.count} />
          <Txt v="meta" color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
            · {km !== null ? formatKm(km) : pro.district}
          </Txt>
        </View>
      </View>
      {pro.acceptingJobs ? (
        price !== null ? (
          <Txt w={700} tabular color={colors.accentDark}>
            {formatPrice(price)}
            {start?.variant.perPerson ? "/người" : ""}
          </Txt>
        ) : null
      ) : (
        <Txt v="meta" color={colors.inkSoft}>
          Tạm nghỉ
        </Txt>
      )}
    </Press>
  )
}
