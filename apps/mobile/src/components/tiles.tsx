import * as React from "react"
import { Image } from "expo-image"
import { router, type Href } from "expo-router"
import { ScrollView, View } from "react-native"
import {
  CATALOG,
  CATEGORY_TINTS,
  categoryPhoto,
  serviceDuration,
  serviceLocationOpen,
  serviceQuantity,
  isNewArtist,
  showsAverage,
  type Category,
  type CategoryId,
  type Pro,
  type ServiceOffer,
  type ServiceTemplate,
} from "@/shared"
import { formatDuration, formatKm, formatPrice, formatRating } from "@/data/format"
import { imageUrl } from "@/data/links"
import type { AppPro } from "@/data/public"
import { colors, gutter, photoRadius, radius, hairline } from "@/theme"
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
      <Icon name="star" size={12} color={colors.highlight} />
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
export function PhotoBadge({ text, position }: { text: string; position: "tl" | "bl" }) {
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
        backgroundColor: "rgba(20,18,19,0.55)",
      }}
    >
      <Txt v="label" w={600} color={colors.surface} style={{ fontSize: 13, lineHeight: 17 }}>
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
  brief = false,
}: {
  offer: ServiceOffer
  width: number
  /** Position in the grid, so neighbouring illustrations differ. */
  index?: number
  href?: Href
  /** Name and price only, for the first screen. */
  brief?: boolean
}) {
  const { template, pros, fromPrice } = offer
  const photo = offer.photo ?? illustration(template.category, index)
  const rating = offerRating(pros)
  const who = pros.length === 1 ? pros[0].name : `${pros.length} Artist`
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
          <Txt w={700} color={colors.accentDark}>{price}</Txt>
        </Txt>
        {brief ? null : (
          <>
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
          </>
        )}
      </View>
    </Press>
  )
})

/**
 * A catalogue service nobody here offers yet, shown like any other: it can
 * still be requested. 360đẹp sets the price bands, so "từ" is real; the photo
 * is an illustration and says so.
 */
export function CatalogTile({ template, width, index = 0, brief = false }: { template: ServiceTemplate; width: number; index?: number; brief?: boolean }) {
  const start = [...template.variants].sort((a, b) => a.tiers[0] - b.tiers[0])[0]
  return (
    <Press
      onPress={() => router.push({ pathname: "/dich-vu/[id]", params: { id: template.id } })}
      accessibilityLabel={`${template.name}, từ ${formatPrice(start.tiers[0])}, chưa có Artist nhận, đặt theo nhu cầu, ảnh minh hoạ`}
      style={{ width, gap: 8 }}
    >
      <View>
        <Photo uri={illustration(template.category, index)} recyclingKey={`cat-${template.id}`} />
        <PhotoBadge text="Ảnh minh hoạ" position="bl" />
      </View>
      <View style={{ gap: 2, paddingHorizontal: 2 }}>
        <Txt w={600} numberOfLines={2}>
          {template.name}
        </Txt>
        <Txt tabular numberOfLines={1}>
          <Txt v="meta" color={colors.muted}>Từ </Txt>
          <Txt w={700} color={colors.accentDark}>
            {formatPrice(start.tiers[0])}
            {start.perPerson ? "/người" : ""}
          </Txt>
        </Txt>
        {brief ? null : (
          <Txt v="meta" color={colors.muted}>
            {formatDuration(serviceDuration(start, serviceQuantity(start)))}
          </Txt>
        )}
        <Txt v="meta" w={600} color={colors.warning} numberOfLines={1}>
          Chưa có Artist · gửi nhu cầu
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

/** A choice in a sideways row (a category, a service). Selected is rose. */
export function Pill({ label, selected, onPress, onCanvas = true }: { label: string; selected: boolean; onPress: () => void; onCanvas?: boolean }) {
  return (
    <Press onPress={onPress} haptic="select" accessibilityRole="tab" accessibilityState={{ selected }} style={{ minHeight: 44, justifyContent: "center" }}>
      <View style={{ height: 36, paddingHorizontal: 14, borderRadius: radius.full, justifyContent: "center", backgroundColor: selected ? colors.accent : colors.surface, borderWidth: onCanvas ? 1 : 0, borderColor: selected ? colors.accent : colors.line }}>
        <Txt v="meta" w={600} color={selected ? colors.surface : colors.ink} numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </Press>
  )
}

/** Tiles two to a row. */
export function TileGrid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: GRID_GAP, rowGap: 24 }}>{children}</View>
}

/**
 * An Artist in a list: their own work on top (never an illustration: a picture
 * under a name reads as that person's work), then who they are, real reviews,
 * distance and their price. Without any work yet, a single coloured row.
 */
export function ArtistCard({
  pro,
  photos,
  photoCount,
  services,
  illustrationOf,
  price,
  distanceKm,
  serviceId,
}: {
  pro: AppPro
  /** Their own work, up to three, the chosen service's first. */
  photos: string[]
  /** All their posts, for "+12 ảnh". */
  photoCount: number
  /** What they offer, the chosen service first. */
  services: string[]
  /** What the card shows, labelled, while they have posted nothing. */
  illustrationOf: CategoryId
  price: number | null
  distanceKm: number | null
  serviceId?: string
}) {
  const open = () => router.push({ pathname: "/pros/[id]", params: serviceId ? { id: pro.id, service: serviceId } : { id: pro.id } })
  const a11y = `${pro.name}${pro.identity === "verified" ? ", đã xác minh" : ""}${price !== null ? `, giá từ ${formatPrice(price)}` : ""}`
  const isNew = isNewArtist(pro)
  const facts = [pro.stats.completedJobs > 0 ? `${pro.stats.completedJobs} lịch` : null, distanceKm !== null ? `Cách bạn ${formatKm(distanceKm)}` : pro.district].filter(Boolean).join(" · ")
  const extra = photoCount - photos.length
  return (
    <Press onPress={open} accessibilityLabel={a11y} style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface }}>
      {photos.length ? (
        <View style={{ flexDirection: "row", height: 180, gap: 3 }}>
          <Image source={{ uri: photos[0] }} style={{ flex: 2, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
          {photos.length > 1 ? (
            <View style={{ flex: 1, gap: 3 }}>
              <Image source={{ uri: photos[1] }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
              {photos[2] ? (
                <View style={{ flex: 1 }}>
                  <Image source={{ uri: photos[2] }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
                  {extra > 0 ? (
                    <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(20,18,19,0.45)" }}>
                      <Txt v="meta" w={700} color={colors.surface}>
                        +{extra} ảnh
                      </Txt>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ height: 150 }}>
          <Image source={{ uri: illustration(illustrationOf, pro.name.length % 3) }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
          <PhotoBadge text="Ảnh minh hoạ" position="tl" />
        </View>
      )}
      <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: -30 }}>
          <View style={{ padding: 3, borderRadius: 32, backgroundColor: colors.surface }}>
            <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={58} artist />
          </View>
          {pro.identity === "verified" ? (
            <CardTag label="Đã xác minh" bg={colors.successSoft} fg={colors.success} />
          ) : isNew ? (
            <CardTag label="Artist mới" bg={colors.highlightSoft} fg={colors.ink} />
          ) : null}
        </View>
        <View style={{ gap: 2 }}>
          <Txt v="title" numberOfLines={1}>
            {pro.name}
          </Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {showsAverage(pro.rating.count) ? <RatingInline {...pro.rating} /> : null}
            <Txt v="meta" color={colors.inkSoft} numberOfLines={1} style={{ flexShrink: 1 }}>
              {showsAverage(pro.rating.count) && facts ? "· " : ""}
              {facts}
            </Txt>
          </View>
          {photos.length ? null : (
            <Txt v="meta" color={colors.muted}>
              Chưa đăng tác phẩm
            </Txt>
          )}
        </View>
        {services.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {services.slice(0, 2).map((name) => (
              <CardTag key={name} label={name} bg={colors.accentSoft} fg={colors.accentDark} />
            ))}
            {services.length > 2 ? <CardTag label={`+${services.length - 2} dịch vụ`} bg={colors.accentSoft} fg={colors.accentDark} /> : null}
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 14, borderTopWidth: hairline, borderTopColor: colors.line }}>
          {price !== null ? (
            <View>
              <Txt v="meta" color={colors.muted}>
                Giá từ
              </Txt>
              <Txt v="title" tabular color={colors.accentDark}>
                {formatPrice(price)}
              </Txt>
            </View>
          ) : (
            <View />
          )}
          <View style={{ minHeight: 34, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
            <Txt v="meta" w={700} color={colors.accentDark}>
              Xem và đặt
            </Txt>
          </View>
        </View>
      </View>
    </Press>
  )
}

function CardTag({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: bg }}>
      <Txt v="meta" w={600} color={fg} numberOfLines={1}>
        {label}
      </Txt>
    </View>
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
  extra,
  compact = false,
}: {
  compact?: boolean
  items: readonly Category[]
  photoFor: (id: CategoryId) => string | undefined
  value?: CategoryId | "all"
  onChange: (id: CategoryId) => void
  onAll?: () => void
  /** Nobody offers these here yet: said to screen readers, the tile stays in full colour. */
  soon?: ReadonlySet<CategoryId>
  /** One more ring that is not a category (Spa), placed after `extra.index` categories. */
  extra?: { index: number; label: string; photo?: string; ring: string; bg: string; onPress: () => void }
}) {
  const SIZE = compact ? 48 : 68
  const LABEL = compact ? 55 : 84
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter - 4, gap: 4 }}>
      {items.flatMap((c, i) => {
        const active = value === c.id
        const ring = extra && i === Math.min(extra.index, items.length - 1) ? (
          <Press key="extra" onPress={extra.onPress} accessibilityRole="button" accessibilityLabel={extra.label} style={{ width: LABEL, alignItems: "center", gap: 6 }}>
            <View style={{ width: SIZE + 4, height: SIZE + 4, borderRadius: (SIZE + 4) / 2, padding: 2, borderWidth: 2, borderColor: extra.ring }}>
              <View style={{ flex: 1, borderRadius: SIZE / 2, overflow: "hidden", backgroundColor: extra.bg }}>
                {extra.photo ? <Image source={{ uri: extra.photo }} style={{ flex: 1 }} contentFit="cover" transition={150} accessible={false} /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Icon name="leaf" size={23} color={extra.ring} /></View>}
              </View>
            </View>
            <Txt v="meta" w={500} center numberOfLines={2} style={{ fontSize: 14, lineHeight: 18 }}>
              {extra.label}
            </Txt>
          </Press>
        ) : null
        const tile = (
          <Press
            key={c.id}
            onPress={() => onChange(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={soon?.has(c.id) ? `${c.label}, chưa có người nhận lịch` : c.label}
            style={{ width: LABEL, alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: SIZE + 4,
                height: SIZE + 4,
                borderRadius: (SIZE + 4) / 2,
                padding: 2,
                borderWidth: 2,
                borderColor: active ? colors.ink : CATEGORY_TINTS[c.id].fg,
              }}
            >
              <View style={{ flex: 1, borderRadius: SIZE / 2, overflow: "hidden", backgroundColor: CATEGORY_TINTS[c.id].bg }}>
                {photoFor(c.id) ? (
                  <Image source={{ uri: photoFor(c.id) }} style={{ flex: 1 }} contentFit="cover" transition={150} accessible={false} />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <CategoryIcon id={c.id} size={26} color={CATEGORY_TINTS[c.id].fg} />
                  </View>
                )}
              </View>
            </View>
            <Txt v="meta" w={active ? 700 : 500} center numberOfLines={2} style={{ fontSize: 14, lineHeight: 18 }}>
              {/* Two short lines fit; the English shorts read worse than the Vietnamese label. */}
              {c.id === "skincare" || c.id === "photophone" ? c.label : c.short ?? c.label}
            </Txt>
          </Press>
        )
        return ring ? (extra && extra.index >= items.length ? [tile, ring] : [ring, tile]) : [tile]
      })}
      {onAll ? (
        <Press onPress={onAll} accessibilityLabel="Tất cả dịch vụ" style={{ width: LABEL, alignItems: "center", gap: 6 }}>
          <View style={{ width: SIZE + 4, height: SIZE + 4, padding: 2 }}>
            <View style={{ flex: 1, borderRadius: SIZE / 2, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
              <Icon name="right" size={20} color={colors.surface} />
            </View>
          </View>
          <Txt v="meta" w={500} center style={{ fontSize: 14, lineHeight: 18 }}>
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
          <Txt v="meta" w={600} color={colors.accentDark}>
            {action}
          </Txt>
          <Icon name="right" size={12} color={colors.accentDark} />
        </Press>
      ) : null}
    </View>
  )
}

/**
 * Catalogue services nobody here offers yet, to fill out a grid: one per
 * category first (so it shows the range), in catalogue order.
 */
export function notYetOffered(offers: readonly ServiceOffer[], categories: readonly Category[], studioBookingOpen: boolean, limit: number): ServiceTemplate[] {
  const offered = new Set(offers.map((o) => o.template.id))
  const inScope = new Set(categories.map((c) => c.id))
  const open = CATALOG.filter((t) => inScope.has(t.category) && !t.addon && !offered.has(t.id) && serviceLocationOpen(t, studioBookingOpen))
  const firsts: ServiceTemplate[] = []
  const seen = new Set<CategoryId>()
  for (const t of open) if (!seen.has(t.category)) { seen.add(t.category); firsts.push(t) }
  return [...firsts, ...open.filter((t) => !firsts.includes(t))].slice(0, limit)
}
