import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { ScrollView, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { categoryLabel, getTemplate, verticalOf } from "@/shared"
import { formatDuration, formatKm, formatPrice } from "@/data/format"
import { BookingBar } from "@/components/booking-bar"
import { PostCard } from "@/components/cards"
import { FollowButton } from "@/components/follow-button"
import { Clip, PhotoPager } from "@/components/media"
import { SaveHeart } from "@/components/save-heart"
import { useApp } from "@/state/app"
import { useBrowse } from "@/state/derived"
import { colors, gutter, radius } from "@/theme"
import { Avatar, EmptyState, Rating, SectionHeader, VerifiedMark } from "@/ui/bits"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

export default function WorkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const app = useApp()
  const browse = useBrowse()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  const work = app.data?.works.find((w) => w.id === id || w.dbId === id)
  const pro = work ? app.data?.pros.find((p) => p.id === work.proId) : undefined
  const template = work ? getTemplate(work.templateId) : undefined
  const listing = work && pro ? app.data?.services.find((s) => s.proId === pro.id && s.templateId === work.templateId && s.active) : undefined
  const variants = template && listing ? template.variants.filter((v) => listing.prices[v.id] != null) : []
  const price = variants.length ? Math.min(...variants.map((v) => listing!.prices[v.id])) : null
  const km = pro ? app.distanceTo(pro) : null

  const similar = React.useMemo(
    () => (work ? browse.works.filter((w) => w.category === work.category && w.proId !== work.proId).slice(0, 6) : []),
    [browse.works, work],
  )

  if (!work) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
        <Stack.Screen options={{ headerTransparent: false, title: "" }} />
        {app.loading || !app.data ? null : (
          <EmptyState title="Không tìm thấy bài đăng" text="Có thể bài đã bị gỡ." action="Về Khám phá" onAction={() => router.replace("/")} />
        )}
      </View>
    )
  }

  const book = () => {
    if (!pro) return
    if (!listing) router.push({ pathname: "/pros/[id]", params: { id: pro.id, tab: "gia" } })
    else router.push({ pathname: "/book/[proId]", params: { proId: pro.id, template: work.templateId } })
  }
  const vertical = verticalOf(work.category)

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen options={{ headerRight: () => <SaveHeart work={work} /> }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingTop: insets.top + 44 }}>
          {work.video ? <Clip uri={work.video} maxHeight={height * 0.72} /> : null}
          {work.video && work.images.length ? <View style={{ height: 12 }} /> : null}
          {!work.video || work.images.length ? <PhotoPager images={work.images} recyclingKey={work.id} /> : null}
        </View>

        <View style={{ paddingHorizontal: gutter, paddingTop: 20, gap: 16 }}>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.vertical[vertical] }} />
              <Txt v="meta" w={600} color={colors.inkSoft}>
                {categoryLabel(work.category)}
                {template ? ` · ${template.name}` : ""}
              </Txt>
            </View>
            <Txt v="h2">{work.title}</Txt>
            {price !== null ? (
              <Txt v="lead" w={700} tabular>
                Từ {formatPrice(price)}
              </Txt>
            ) : null}
          </View>

          {pro ? (
            <Press
              onPress={() => router.push({ pathname: "/pros/[id]", params: { id: pro.id } })}
              accessibilityLabel={`Xem hồ sơ ${pro.name}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 }}
            >
              <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Txt w={700} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {pro.name}
                  </Txt>
                  {pro.identity === "verified" ? <VerifiedMark /> : null}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Rating average={pro.rating.average} count={pro.rating.count} />
                  <Txt v="meta" color={colors.muted} numberOfLines={1}>
                    · {km !== null ? formatKm(km) : pro.district}
                  </Txt>
                </View>
              </View>
              <FollowButton proUuid={pro.uuid} name={pro.name} />
            </Press>
          ) : null}

          {work.description ? <Txt color={colors.inkSoft}>{work.description}</Txt> : null}

          {variants.length ? (
            <View style={{ gap: 4 }}>
              <Txt v="lead" w={700}>
                Gói và giá
              </Txt>
              {variants.map((v) => (
                <View key={v.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Txt w={600}>{v.label}</Txt>
                    <Txt v="meta" color={colors.muted}>
                      {formatDuration(v.durationMin)}
                      {v.perPerson ? " · mỗi người" : ""}
                    </Txt>
                  </View>
                  <Txt w={700} tabular>
                    {formatPrice(listing!.prices[v.id])}
                  </Txt>
                </View>
              ))}
              {template?.deliverable ? (
                <Txt v="meta" color={colors.inkSoft} style={{ paddingTop: 6 }}>
                  Nhận được: {template.deliverable}
                  {template.deliveryDays ? `, trong ${template.deliveryDays} ngày` : ""}
                </Txt>
              ) : null}
            </View>
          ) : pro ? (
            <Txt color={colors.inkSoft}>{pro.name} chưa đặt giá cho dịch vụ này trên 360dep.</Txt>
          ) : null}

          {similar.length ? (
            <View style={{ gap: 12, paddingTop: 8 }}>
              <SectionHeader title="Mẫu tương tự" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                {similar.map((w) => {
                  const p = browse.proById.get(w.proId)
                  return (
                    <View key={w.id} style={{ width: "50%", paddingHorizontal: 6 }}>
                      <PostCard work={w} pro={p} services={browse.services} distanceKm={p ? app.distanceTo(p) : null} />
                    </View>
                  )
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {pro && app.uid !== pro.uuid ? (
        <BookingBar
          title={price !== null ? `Từ ${formatPrice(price)}` : null}
          note={!pro.acceptingJobs ? `${pro.name} đang tạm nghỉ nhận lịch.` : undefined}
          action={listing ? "Đặt lịch" : "Xem bảng giá"}
          disabled={!pro.acceptingJobs && Boolean(listing)}
          onPress={book}
        />
      ) : null}
    </View>
  )
}
