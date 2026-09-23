import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { categoryLabel, excludes, getTemplate, placeLabel, rankScore } from "@/shared"
import { formatDuration, formatKm, formatPrice } from "@/data/format"
import { fromPrice, type AppPro, type AppWork } from "@/data/public"
import { PostCard, ProCardSkeleton } from "@/components/cards"
import { useApp } from "@/state/app"
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
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const { width } = useWindowDimensions()
  const template = getTemplate(id)
  const { city, data } = app

  const { ranked, elsewhere, works } = React.useMemo(() => {
    if (!data || !template) return { ranked: [] as AppPro[], elsewhere: 0, works: [] as AppWork[] }
    const offers = (p: AppPro) =>
      data.services.some((s) => s.proId === p.id && s.templateId === template.id && s.active && Object.keys(s.prices).length > 0)
    const all = data.pros.filter((p) => p.published && offers(p) && !app.blocked.has(p.uuid))
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
  }, [data, template, city, app])

  if (!template) return <EmptyState title="Không có dịch vụ này" text="Có thể dịch vụ đã đổi tên." action="Về Khám phá" onAction={() => router.replace("/")} />

  const loadingFirst = (!data || app.stale) && !app.dataError && app.configured
  const cardWidth = (width - gutter * 2 - COLUMN_GAP) / 2
  const where = city ? ` ở ${city}` : ""

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
      </View>

      {/* Options, price first */}
      <View style={{ paddingHorizontal: gutter }}>
        <Card style={{ padding: 18, gap: 0, borderWidth: 1, borderColor: colors.line }}>
          <Txt w={700}>Các gói</Txt>
          {template.variants.map((v, i) => (
            <View key={v.id}>
              {i > 0 ? <Divider /> : null}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, paddingVertical: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt w={600}>{v.label}</Txt>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Icon name="clock" size={13} color={colors.inkSoft} />
                    <Txt v="meta" color={colors.inkSoft}>
                      {formatDuration(v.durationMin)}
                      {v.perPerson ? " · mỗi người" : ""}
                    </Txt>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Txt w={700} tabular>
                    {formatPrice(v.minPrice)}
                  </Txt>
                  <Txt v="meta" color={colors.muted} tabular>
                    đến {formatPrice(v.maxPrice)}
                  </Txt>
                </View>
              </View>
            </View>
          ))}
          <Txt v="meta" color={colors.inkSoft} style={{ marginTop: 4 }}>
            Khung giá chuẩn của 360dep; mỗi người làm tự đặt giá trong khung. Khách không trả phí nền tảng.
          </Txt>
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
                : "Đăng yêu cầu để người làm gần bạn gửi báo giá, hoặc quay lại sau."}
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
          ranked.map((p) => <ProOffer key={p.id} pro={p} templateId={template.id} />)
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
function ProOffer({ pro, templateId }: { pro: AppPro; templateId: string }) {
  const app = useApp()
  const price = fromPrice(app.data?.services ?? [], pro.id, templateId)
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
              {formatPrice(price)}
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
            onPress={() => router.push({ pathname: "/book/[proId]", params: { proId: pro.id, template: templateId } })}
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
