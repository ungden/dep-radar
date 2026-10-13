import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { categoryLabel, excludes, getTemplate, placeLabel, rankScore, listedOptions, serviceDuration, serviceQuantity } from "@/shared"
import { formatDuration, formatKm, formatPrice } from "@/data/format"
import { type AppPro, type AppWork } from "@/data/public"
import { PostCard, ProCardSkeleton } from "@/components/cards"
import { useApp } from "@/state/app"
import { ConductNote } from "@/components/conduct"
import { needsConductNote } from "@/shared"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Avatar, Card, Divider, EmptyState, ErrorNote, Photo, Rating, VerifiedMark } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

const COLUMN_GAP = 12

/**
 * A service, for sale: what it is, what each option costs, and who near the
 * customer does it, each with their own price and real work, one tap from
 * booking. Where a service card on Khám phá leads; mirrors /dich-vu/[id] on the web.
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
      data.services.some((s) => s.proId === p.id && s.templateId === template.id && s.active && listedOptions(template, s.prices).some((o) => priceOk(o.minimumTotal)))
    const all = data.pros.filter((p) => p.published && offers(p) && !app.blocked.has(p.uuid) && (params.verified !== "1" || p.identity === "verified") && (params.place !== "home" || (p.homeService && !template.studioOnly)) && (params.place !== "studio" || Boolean(p.studioAddress)) && (params.place !== "location" || template.onLocation))
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
    const prices = ranked.filter((p) => p.acceptingJobs).flatMap((p) => (data?.services ?? []).filter((s) => s.proId === p.id && s.templateId === template.id && s.active).flatMap((s) => listedOptions(template, s.prices).filter((o) => o.variant.id === variant.id && priceOk(o.minimumTotal)).map((o) => o.unitPrice)))
    return prices.length ? [{ variant, price: Math.min(...prices) }] : []
  })

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 48, gap: 28 }}
      refreshControl={refreshControl(app.loading && Boolean(data), () => void app.refresh())}
    >
      <Stack.Screen options={{ title: "" }} />

      {/* What it is */}
      <View style={{ paddingHorizontal: gutter, gap: 6 }}>
        <Txt v="meta" w={600} color={colors.muted}>
          {categoryLabel(template.category)}
        </Txt>
        <Txt v="h1">{template.name}</Txt>
        <Txt color={colors.inkSoft}>{template.description}</Txt>
        <View style={{ gap: 10, marginTop: 10 }}>
          <Fact icon="pin" text={placeLabel(template)} />
          {template.deliverable ? (
            <Fact icon="box" text={`${template.deliverable}${template.deliveryDays ? `, giao trong ${template.deliveryDays} ngày` : ""}`} />
          ) : null}
          {template.includes.map((line) =>
            excludes(line) ? (
              <Fact key={line} text={line} soft />
            ) : (
              <Fact key={line} icon="check" text={line} />
            ),
          )}
        </View>
        {needsConductNote(template.category) ? (
          <View style={{ marginTop: 12 }}>
            <ConductNote />
          </View>
        ) : null}
      </View>

      {/* Options, price first */}
      <View style={{ paddingHorizontal: gutter }}>
        <Card style={{ padding: 18, gap: 0, borderWidth: 1, borderColor: colors.line }}>
          <Txt v="lead" w={700}>Gói đang có người nhận</Txt>
          {availablePackages.length ? availablePackages.map(({ variant: v, price }, i) => <View key={v.id}>
            {i > 0 && <Divider />}
            <View style={{ gap: 8, paddingVertical: 14 }}>
              <Txt w={600}>{v.label}</Txt>
              <Txt v="meta" color={colors.inkSoft}>{formatDuration(serviceDuration(v, serviceQuantity(v)))}</Txt>
              <Txt v="lead" w={700} tabular>Từ {formatPrice(price)}{v.perPerson ? "/người" : ""}</Txt>
              {(v.minQuantity ?? 1) > 1 && <Txt v="meta" color={colors.inkSoft}>Tối thiểu {v.minQuantity} người · từ {formatPrice(price * v.minQuantity!)}/nhóm</Txt>}
            </View>
          </View>) : <Txt color={colors.inkSoft} style={{ marginVertical: 12 }}>Chưa có gói phù hợp với lựa chọn này.</Txt>}
          <Button label={showPriceFrame ? "Ẩn khung giá tham khảo" : "Xem khung 3 mức giá"} variant="ghost" full onPress={() => setShowPriceFrame((v) => !v)} />
          {showPriceFrame && <View style={{ gap: 16, marginTop: 12 }}>
            <Txt v="meta" color={colors.inkSoft}>Khung giá tham khảo. Người làm chọn một mức cho từng gói; mức đang nhận lịch nằm ở trên.</Txt>
            {template.variants.map((v) => <View key={v.id} style={{ gap: 8 }}><Txt w={600}>{v.label}</Txt><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{v.tiers.map((tier) => <Txt key={tier} v="meta" style={{ backgroundColor: colors.subtle, padding: 8, borderRadius: radius.sm }}>{formatPrice(tier)}{v.perPerson ? "/người" : ""}</Txt>)}</View></View>)}
          </View>}
        </Card>
      </View>

      {/* Who does it here */}
      <View style={{ paddingHorizontal: gutter, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Txt v="h2" style={{ flexShrink: 1 }}>
            Chọn người làm{where}
          </Txt>
          {ranked.length > 0 ? (
            <Txt color={colors.muted} tabular>
              {ranked.length}
            </Txt>
          ) : null}
        </View>
        {loadingFirst ? (
          <>
            <ProCardSkeleton />
            <ProCardSkeleton />
          </>
        ) : app.dataError && !data ? (
          <ErrorNote text={app.dataError} onRetry={() => void app.refresh()} />
        ) : ranked.length === 0 ? (
          <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 24, gap: 8, alignItems: "center" }}>
            <Txt v="lead" w={700} center>
              Chưa có ai nhận dịch vụ này{where}
            </Txt>
            <Txt color={colors.inkSoft} center style={{ maxWidth: 320 }}>
              {elsewhere
                ? `Có ${elsewhere} người nhận ở nơi khác.`
                : "Đăng yêu cầu để người làm gần bạn nhận việc, hoặc quay lại sau."}
            </Txt>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {elsewhere ? <Button label="Xem cả nước" onPress={() => app.setCity(null)} /> : null}
              <Button
                label="Đăng yêu cầu"
                variant={elsewhere ? "secondary" : "primary"}
                onPress={() => router.push("/yeu-cau/moi")}
              />
            </View>
          </View>
        ) : (
          ranked.map((p) => <ProOffer key={p.id} pro={p} templateId={template.id} minTotal={minTotal} maxTotal={maxTotal} />)
        )}
      </View>

      {/* Real photos */}
      {works.length > 0 ? (
        <View style={{ paddingHorizontal: gutter, gap: 14 }}>
          <Txt v="h2">Ảnh thật của dịch vụ này</Txt>
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
  )
}

function Fact({ icon, text, soft }: { icon?: "pin" | "box" | "check"; text: string; soft?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <View style={{ width: 18, paddingTop: 2, alignItems: "center" }}>{icon ? <Icon name={icon} size={16} /> : null}</View>
      <Txt color={soft ? colors.inkSoft : colors.ink} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  )
}

/** One person who does this service here: their price, their work, and the way to book them. */
function ProOffer({ pro, templateId, minTotal, maxTotal }: { pro: AppPro; templateId: string; minTotal: number; maxTotal: number }) {
  const app = useApp()
  const listing = app.data?.services.find((s) => s.proId === pro.id && s.templateId === templateId && s.active)
  const start = listedOptions(getTemplate(templateId)!, listing?.prices ?? {}).filter((o) => o.minimumTotal >= minTotal && (!maxTotal || o.minimumTotal <= maxTotal)).sort((a, b) => a.minimumTotal - b.minimumTotal)[0]
  const price = start?.unitPrice ?? null
  const km = app.distanceTo(pro)
  const photos = React.useMemo(
    () =>
      (app.data?.works ?? [])
        .filter((w) => w.proId === pro.id && w.images[0])
        .sort((a, b) => Number(b.templateId === templateId) - Number(a.templateId === templateId))
        .slice(0, 3)
        .map((w) => w.images[0]),
    [app.data, pro.id, templateId],
  )
  const openProfile = () => router.push({ pathname: "/pros/[id]", params: { id: pro.id } })

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <Press onPress={openProfile} accessibilityLabel={pro.name} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Txt v="lead" w={700} numberOfLines={1} style={{ flexShrink: 1 }}>
                {pro.name}
              </Txt>
              {pro.identity === "verified" ? <VerifiedMark /> : null}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Rating average={pro.rating.average} count={pro.rating.count} />
              <Txt v="meta" color={colors.inkSoft} numberOfLines={1} style={{ flexShrink: 1 }}>
                · {km !== null ? formatKm(km) : pro.district}
              </Txt>
            </View>
          </View>
        </Press>
        {price !== null ? (
          <View style={{ alignItems: "flex-end" }}>
            <Txt v="meta" color={colors.muted}>
              Từ
            </Txt>
            <Txt w={700} tabular>
              {formatPrice(price)}{start?.variant.perPerson ? "/người" : ""}
            </Txt>
          </View>
        ) : null}
      </View>
      {photos.length > 0 ? (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {/* Fewer than three works: leave the slot empty rather than show a grey box. */}
          {[0, 1, 2].map((i) =>
            photos[i] ? (
              <Press key={i} onPress={openProfile} accessibilityLabel={`Tác phẩm của ${pro.name}`} style={{ flex: 1 }}>
                <Photo uri={photos[i]} rounded={radius.sm} />
              </Press>
            ) : (
              <View key={i} style={{ flex: 1 }} />
            ),
          )}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button label="Xem hồ sơ" variant="secondary" size="sm" onPress={openProfile} style={{ flex: 1 }} />
        {pro.acceptingJobs ? (
          <Button
            label="Đặt lịch"
            size="sm"
            onPress={() => router.push({ pathname: "/book/[proId]", params: { proId: pro.id, template: templateId, variant: start?.variant.id ?? "" } })}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1, height: 36, borderRadius: radius.full, backgroundColor: colors.subtle, alignItems: "center", justifyContent: "center" }}>
            <Txt v="meta" color={colors.inkSoft}>
              Đang tạm nghỉ
            </Txt>
          </View>
        )}
      </View>
    </View>
  )
}
