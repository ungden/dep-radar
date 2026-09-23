import * as React from "react"
import { router } from "expo-router"
import { View } from "react-native"
import { categoryLabel, type ProService } from "@/shared"
import { formatKm, formatPrice, formatShortPrice } from "@/data/format"
import { fromPrice, type AppPro, type AppWork } from "@/data/public"
import { colors, radius } from "@/theme"
import { Avatar, Photo, Rating, Skeleton, VerifiedMark } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"
import { SaveHeart } from "./save-heart"

/**
 * A post in the feed. Answers three questions under the photo, never on it:
 * what it is, what it costs, who does it and how far away.
 */
export const PostCard = React.memo(function PostCard({
  work,
  pro,
  services,
  distanceKm,
}: {
  work: AppWork
  pro: AppPro | undefined
  services: ProService[]
  distanceKm: number | null
}) {
  const price = pro ? fromPrice(services, pro.id, work.templateId) : null
  return (
    <Press
      onPress={() => router.push({ pathname: "/works/[id]", params: { id: work.id } })}
      accessibilityLabel={`${work.title}${price ? `, từ ${formatPrice(price)}` : ""}${pro ? `, ${pro.name}` : ""}`}
      style={{ gap: 6, paddingBottom: 20 }}
    >
      <View>
        <Photo uri={work.images[0]} recyclingKey={work.id} />
        <View style={{ position: "absolute", top: 0, right: 0 }}>
          <SaveHeart work={work} onPhoto />
        </View>
        {work.video || work.images.length > 1 ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              paddingHorizontal: 7,
              height: 24,
              borderRadius: radius.full,
              backgroundColor: "rgba(22,20,19,0.55)",
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
            }}
          >
            {work.video ? <Icon name="play" size={12} color={colors.surface} /> : null}
            {!work.video ? (
              <Txt v="label" w={700} color={colors.surface}>
                1/{work.images.length}
              </Txt>
            ) : null}
          </View>
        ) : null}
      </View>
      <Txt w={700} numberOfLines={2}>
        {work.title}
      </Txt>
      {price !== null ? (
        <Txt w={500} tabular>
          Từ {formatPrice(price)}
        </Txt>
      ) : null}
      {pro ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={20} />
          <Txt v="meta" w={600} numberOfLines={1} style={{ flexShrink: 1 }}>
            {pro.name}
          </Txt>
          {pro.identity === "verified" ? <VerifiedMark size={13} /> : null}
        </View>
      ) : null}
      {pro && (pro.rating.count > 0 || distanceKm !== null) ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {pro.rating.count > 0 ? <Rating average={pro.rating.average} count={pro.rating.count} showCount={false} /> : null}
          {distanceKm !== null ? (
            <Txt v="meta" color={colors.muted}>
              {pro.rating.count > 0 ? "· " : ""}
              {formatKm(distanceKm)}
            </Txt>
          ) : null}
        </View>
      ) : null}
    </Press>
  )
})

export function PostCardSkeleton() {
  return (
    <View style={{ gap: 8, paddingBottom: 20 }}>
      <Skeleton style={{ aspectRatio: 4 / 5, borderRadius: radius.md }} />
      <Skeleton style={{ height: 16, width: "85%" }} />
      <Skeleton style={{ height: 16, width: "50%" }} />
      <Skeleton style={{ height: 14, width: "65%" }} />
    </View>
  )
}

/** A person: avatar, three real photos, from-price, rating, distance only when we know it. */
export function ProCard({
  pro,
  photos,
  price,
  distanceKm,
  width,
}: {
  pro: AppPro
  photos: string[]
  price: number | null
  distanceKm: number | null
  width?: number
}) {
  return (
    <Press
      onPress={() => router.push({ pathname: "/pros/[id]", params: { id: pro.id } })}
      accessibilityLabel={`${pro.name}, ${pro.title}`}
      style={{ width, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, gap: 10 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={44} />
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Txt w={700} numberOfLines={1} style={{ flexShrink: 1 }}>
              {pro.name}
            </Txt>
            {pro.identity === "verified" ? <VerifiedMark /> : null}
          </View>
          <Txt v="meta" color={colors.inkSoft} numberOfLines={1}>
            {pro.title || pro.categories.map(categoryLabel).join(", ")}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {/* Fewer than three works: leave the slot empty rather than show a grey box. */}
        {[0, 1, 2].map((i) =>
          photos[i] ? <Photo key={i} uri={photos[i]} rounded={radius.sm} style={{ flex: 1 }} /> : <View key={i} style={{ flex: 1 }} />,
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {price !== null ? (
          <Txt v="meta" w={700} tabular>
            Từ {formatShortPrice(price)}
          </Txt>
        ) : null}
        <Rating average={pro.rating.average} count={pro.rating.count} showCount={false} />
        {distanceKm !== null ? (
          <Txt v="meta" color={colors.muted}>
            · {formatKm(distanceKm)}
          </Txt>
        ) : (
          <Txt v="meta" color={colors.muted} numberOfLines={1}>
            · {pro.district}
          </Txt>
        )}
      </View>
    </Press>
  )
}

export function ProCardSkeleton({ width }: { width?: number }) {
  return (
    <View style={{ width, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Skeleton style={{ width: 44, height: 44, borderRadius: 22 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton style={{ height: 15, width: "60%" }} />
          <Skeleton style={{ height: 13, width: "40%" }} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={{ flex: 1, aspectRatio: 4 / 5 }} />
        ))}
      </View>
      <Skeleton style={{ height: 13, width: "70%" }} />
    </View>
  )
}
