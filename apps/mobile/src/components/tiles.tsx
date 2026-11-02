import * as React from "react"
import { Image } from "expo-image"
import { router, type Href } from "expo-router"
import { ScrollView, View } from "react-native"
import {
  CATALOG,
  CATEGORY_TINTS,
  categoryLabel,
  categoryPhoto,
  serviceDuration,
  serviceLocationOpen,
  serviceQuantity,
  showsAverage,
  type Category,
  type CategoryId,
  type Pro,
  type ServiceOffer,
  type ServiceTemplate,
} from "@/shared"
import { formatDuration, formatKm, formatPrice, formatRating, formatShortPrice } from "@/data/format"
import { imageUrl } from "@/data/links"
import type { AppPro } from "@/data/public"
import { colors, gutter, photoRadius, radius } from "@/theme"
import { Avatar, Photo, Skeleton, VerifiedMark } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"
import { CategoryIcon } from "./category-icon"

/** Columns of every photo grid: two, 12pt apart, inside the 16pt gutter. */
export const GRID_GAP = 12
export const tileWidth = (screenWidth: number) => Math.floor((screenWidth - gutter * 2 - GRID_GAP) / 2)

/**
 * An illustration for a category (lib/design/photos.ts), as a URL the app can
 * load. Only for places with no real work yet, and always labelled.
 */
export const illustration = (category: CategoryId, index = 0) => imageUrl(categoryPhoto(category, index))

/** Reviews of everyone who offers it, weighted by how many each has. */
export function offerRating(pros: readonly Pro[]) {
  const count = pros.reduce((n, p) => n + p.rating.count, 0)
  const average = count ? pros.reduce((n, p) => n + p.rating.average * p.rating.count, 0) / count : 0
  return { average, count }
}

/** "★ 4,9 (23)" only once there are enough reviews to mean something; nothing otherwise. */
function RatingInline({ average, count }: { average: number; count: number }) {
  if (!showsAverage(count)) return null
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <Icon name="star" size={12} color={colors.ink} />
      <Txt v="meta" w={600} tabular>
        {formatRating(average)}
      </Txt>
      <Txt v="meta" color={colors.muted} tabular>
        ({count})
      </Txt>
    </View>
  )
}

/** A small label on a photo: legible on any picture, never covering the subject. */
function PhotoBadge({ text, position, tone = "dark" }: { text: string; position: "tl" | "bl"; tone?: "dark" | "light" }) {
  return (
    <View
      style={{
        position: "absolute",
        left: 8,
        ...(position === "tl" ? { top: 8 } : { bottom: 8 }),
        paddingHorizontal: 8,
        height: 22,
        borderRadius: radius.full,
        justifyContent: "center",
        backgroundColor: tone === "dark" ? "rgba(20,18,19,0.55)" : "rgba(255,255,255,0.94)",
      }}
    >
      <Txt v="label" w={600} color={tone === "dark" ? colors.surface : colors.ink} style={{ fontSize: 12, lineHeight: 16 }}>
        {text}
      </Txt>
    </View>
  )
}

/**
 * A bookable service, photo first: the picture takes most of the tile, under
 * it only what decides a tap (name, from-price, time, real reviews, who).
 * The whole tile opens the service; there is no button to read.
 */
export const ServiceTile = React.memo(function ServiceTile({
  offer,
  width,
  index = 0,
  href,
}: {
  offer: ServiceOffer
  width: number
  /** Position in the grid, so neighbouring illustrations differ. */
  index?: number
  href?: Href
}) {
  const { template, pros, fromPrice } = offer
  const photo = offer.photo ?? illustration(template.category, index)
  const rating = offerRating(pros)
  const who = pros.length === 1 ? pros[0].name : `${pros.length} người nhận`
  const price = `${formatPrice(fromPrice)}${offer.variant.perPerson ? "/người" : ""}`
  return (
    <Press
      onPress={() => router.push(href ?? { pathname: "/dich-vu/[id]", params: { id: template.id } })}
      accessibilityLabel={`${template.name}, từ ${price}, ${formatDuration(offer.durationMin)}${showsAverage(rating.count) ? `, ${formatRating(rating.average)} sao` : ""}, ${who}${offer.photo ? "" : ", ảnh minh hoạ"}`}
      style={{ width, gap: 8 }}
    >
      <View>
        <Photo uri={photo} recyclingKey={`svc-${template.id}`} />
        {offer.photo ? null : <PhotoBadge text="Ảnh minh hoạ" position="bl" />}
      </View>
      <View style={{ gap: 2, paddingHorizontal: 2 }}>
        <Txt w={600} numberOfLines={2}>
          {template.name}
        </Txt>
        <Txt tabular numberOfLines={1}>
          <Txt v="meta" color={colors.muted}>Từ </Txt>
          <Txt w={700}>{price}</Txt>
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 6 }}>
          <Txt v="meta" color={colors.muted}>
            {formatDuration(offer.durationMin)}
            {offer.minimumQuantity > 1 ? ` · tối thiểu ${offer.minimumQuantity} người` : ""}
          </Txt>
          {showsAverage(rating.count) ? <Txt v="meta" color={colors.muted}>·</Txt> : null}
          <RatingInline {...rating} />
        </View>
        <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
          {who}
        </Txt>
      </View>
    </Press>
  )
})

/**
 * A catalogue service nobody here offers yet. 360đẹp sets the price bands,
 * so "giá từ" is real; the photo is an illustration and says so. It leads to
 * the service page, where the customer can post a request.
 */
export function CatalogTile({ template, width, index = 0 }: { template: ServiceTemplate; width: number; index?: number }) {
  const start = [...template.variants].sort((a, b) => a.tiers[0] - b.tiers[0])[0]
  return (
    <Press
      onPress={() => router.push({ pathname: "/dich-vu/[id]", params: { id: template.id } })}
      accessibilityLabel={`${template.name}, chưa có người nhận ở đây, giá từ ${formatPrice(start.tiers[0])}, ảnh minh hoạ`}
      style={{ width, gap: 8 }}
    >
      <View>
        <Photo uri={illustration(template.category, index)} recyclingKey={`cat-${template.id}`} />
        <PhotoBadge text="Sắp có" position="tl" tone="light" />
        <PhotoBadge text="Ảnh minh hoạ" position="bl" />
      </View>
      <View style={{ gap: 2, paddingHorizontal: 2 }}>
        <Txt w={600} numberOfLines={2}>
          {template.name}
        </Txt>
        <Txt tabular numberOfLines={1}>
          <Txt v="meta" color={colors.muted}>Giá từ </Txt>
          <Txt w={700}>
            {formatPrice(start.tiers[0])}
            {start.perPerson ? "/người" : ""}
          </Txt>
        </Txt>
        <Txt v="meta" color={colors.muted}>
          {formatDuration(serviceDuration(start, serviceQuantity(start)))}
        </Txt>
        <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
          Đăng yêu cầu để được nhận
        </Txt>
      </View>
    </Press>
  )
}

export function TileSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width, gap: 8 }}>
      <Skeleton style={{ aspectRatio: 4 / 5, borderRadius: photoRadius }} />
      <Skeleton style={{ height: 16, width: "85%" }} />
      <Skeleton style={{ height: 16, width: "55%" }} />
      <Skeleton style={{ height: 14, width: "40%" }} />
    </View>
  )
}

/** Tiles two to a row. */
export function TileGrid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: GRID_GAP, rowGap: 24 }}>{children}</View>
}

/**
 * A person, for a sideways row: their own work fills the top (never an
 * illustration: a picture under a name reads as that person's work), then
 * who they are, real reviews, distance and from-price.
 */
export function ProTile({ pro, photos, price, distanceKm, width }: { pro: AppPro; photos: string[]; price: number | null; distanceKm: number | null; width: number }) {
  const tint = CATEGORY_TINTS[pro.categories[0] ?? "nail"]
  const h = Math.round(width * 0.62)
  return (
    <Press
      onPress={() => router.push({ pathname: "/pros/[id]", params: { id: pro.id } })}
      accessibilityLabel={`${pro.name}${pro.identity === "verified" ? ", đã xác minh" : ""}, ${pro.title || pro.categories.map(categoryLabel).join(", ")}`}
      style={{ width, gap: 10 }}
    >
      {photos.length ? (
        <View style={{ height: h, flexDirection: "row", gap: 3, borderRadius: photoRadius, overflow: "hidden" }}>
          <Image source={{ uri: photos[0] }} style={{ flex: 2, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
          {photos.length > 1 ? (
            <View style={{ flex: 1, gap: 3 }}>
              {[photos[1], photos[2]].map((uri, i) =>
                uri ? (
                  <Image key={i} source={{ uri }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
                ) : (
                  <View key={i} style={{ flex: 1, backgroundColor: colors.subtle }} />
                ),
              )}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ height: h, borderRadius: photoRadius, backgroundColor: tint.bg, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={64} />
          <Txt v="meta" color={colors.inkSoft}>
            Chưa đăng tác phẩm
          </Txt>
        </View>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={36} />
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Txt w={600} numberOfLines={1} style={{ flexShrink: 1 }}>
              {pro.name}
            </Txt>
            {pro.identity === "verified" ? <VerifiedMark size={14} /> : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {showsAverage(pro.rating.count) ? (
              <RatingInline {...pro.rating} />
            ) : (
              <Txt v="meta" w={600} color={colors.inkSoft}>
                Mới
              </Txt>
            )}
            <Txt v="meta" color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>
              · {distanceKm !== null ? formatKm(distanceKm) : pro.district}
              {price !== null ? ` · từ ${formatShortPrice(price)}` : ""}
            </Txt>
          </View>
        </View>
      </View>
    </Press>
  )
}

/**
 * Categories as photo thumbnails, one sideways row: the picture says what
 * the word means faster than an icon. A real photo of the category when
 * anyone posted one, otherwise its illustration. The row ends with "Tất cả".
 */
export function CategoryRail({
  items,
  photoFor,
  value,
  onChange,
  onAll,
  soon,
}: {
  items: readonly Category[]
  photoFor: (id: CategoryId) => string | undefined
  value?: CategoryId | "all"
  onChange: (id: CategoryId) => void
  onAll?: () => void
  /** Nobody offers these here yet: shown, dimmed. */
  soon?: ReadonlySet<CategoryId>
}) {
  const SIZE = 68
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}>
      {items.map((c) => {
        const active = value === c.id
        const dim = soon?.has(c.id) && !active
        return (
          <Press
            key={c.id}
            onPress={() => onChange(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={soon?.has(c.id) ? `${c.label}, chưa có người nhận lịch` : c.label}
            style={{ width: SIZE + 4, alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: SIZE + 4,
                height: SIZE + 4,
                borderRadius: photoRadius + 2,
                padding: 2,
                borderWidth: 2,
                borderColor: active ? colors.ink : "transparent",
              }}
            >
              <View style={{ flex: 1, borderRadius: photoRadius - 2, overflow: "hidden", backgroundColor: CATEGORY_TINTS[c.id].bg, opacity: dim ? 0.55 : 1 }}>
                {photoFor(c.id) ? (
                  <Image source={{ uri: photoFor(c.id) }} style={{ flex: 1 }} contentFit="cover" transition={150} accessible={false} />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <CategoryIcon id={c.id} size={26} color={CATEGORY_TINTS[c.id].fg} />
                  </View>
                )}
              </View>
            </View>
            <Txt v="meta" w={active ? 700 : 500} color={dim ? colors.muted : colors.ink} center numberOfLines={2} style={{ fontSize: 13, lineHeight: 17 }}>
              {/* Two short lines fit; the English shorts read worse than the Vietnamese label. */}
              {c.id === "skincare" || c.id === "photophone" ? c.label : c.short ?? c.label}
            </Txt>
          </Press>
        )
      })}
      {onAll ? (
        <Press onPress={onAll} accessibilityLabel="Tất cả dịch vụ" style={{ width: SIZE + 4, alignItems: "center", gap: 6 }}>
          <View style={{ width: SIZE + 4, height: SIZE + 4, padding: 2 }}>
            <View style={{ flex: 1, borderRadius: photoRadius - 2, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <Icon name="right" size={20} color={colors.ink} />
            </View>
          </View>
          <Txt v="meta" w={500} center style={{ fontSize: 13, lineHeight: 17 }}>
            Tất cả
          </Txt>
        </Press>
      ) : null}
    </ScrollView>
  )
}

/** A section title with an optional count and "Xem tất cả". */
export function Section({ title, note, action, onAction }: { title: string; note?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, paddingHorizontal: gutter }}>
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Txt v="h2">{title}</Txt>
        {note ? (
          <Txt v="meta" color={colors.muted}>
            {note}
          </Txt>
        ) : null}
      </View>
      {action ? (
        <Press onPress={onAction} accessibilityLabel={action} style={{ minHeight: 44, justifyContent: "center", paddingLeft: 8, flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Txt v="meta" w={600}>
            {action}
          </Txt>
          <Icon name="right" size={12} color={colors.ink} />
        </Press>
      ) : null}
    </View>
  )
}

/**
 * Catalogue services nobody here offers yet, for the "Sắp có" row: one per
 * category first (so the row shows the range), in catalogue order.
 */
export function comingSoon(offers: readonly ServiceOffer[], categories: readonly Category[], studioBookingOpen: boolean, limit: number): ServiceTemplate[] {
  const offered = new Set(offers.map((o) => o.template.id))
  const inScope = new Set(categories.map((c) => c.id))
  const open = CATALOG.filter((t) => inScope.has(t.category) && !offered.has(t.id) && serviceLocationOpen(t, studioBookingOpen))
  const firsts: ServiceTemplate[] = []
  const seen = new Set<CategoryId>()
  for (const t of open) if (!seen.has(t.category)) { seen.add(t.category); firsts.push(t) }
  return [...firsts, ...open.filter((t) => !firsts.includes(t))].slice(0, limit)
}
