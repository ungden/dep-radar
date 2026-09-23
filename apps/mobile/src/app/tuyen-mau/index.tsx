import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { View } from "react-native"
import { categoryLabel } from "@/shared"
import { compensationLabel, listCastings, type CastingItem } from "@/data/castings"
import { formatDateLong } from "@/data/format"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Avatar, EmptyState, ErrorNote, Skeleton, VerifiedMark } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** Open casting calls in the chosen city: a freelancer needs a model, paid in kind or in money. */
export default function Castings() {
  const app = useApp()
  const castings = useAsync(() => listCastings(app.uid, app.city), [app.uid, app.city])
  const list = (castings.value ?? []).filter((c) => !app.blocked.has(c.proUuid))

  return (
    <FlashList
      style={{ backgroundColor: colors.canvas }}
      data={list}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: gutter }}
      refreshControl={refreshControl(castings.refreshing, () => void castings.refresh())}
      ListHeaderComponent={
        <View style={{ gap: 8, paddingBottom: 12 }}>
          <Txt color={colors.inkSoft}>Làm mẫu cho thợ: được làm đẹp miễn phí, giảm giá hoặc có thù lao{app.city ? ` ở ${app.city}` : ""}.</Txt>
          {castings.error ? <ErrorNote text={castings.error} onRetry={() => void castings.reload()} /> : null}
        </View>
      }
      renderItem={({ item }) => <CastingCard casting={item} />}
      ListEmptyComponent={
        castings.loading ? (
          <View style={{ gap: 10 }}>
            {[0, 1].map((i) => (
              <Skeleton key={i} style={{ height: 150, borderRadius: radius.lg }} />
            ))}
          </View>
        ) : castings.error ? null : (
          <EmptyState
            title="Chưa có tin tuyển mẫu"
            text={app.city ? `Chưa ai tuyển mẫu ở ${app.city}. Quay lại sau nhé.` : "Quay lại sau nhé."}
            action={app.city ? "Xem cả nước" : undefined}
            onAction={() => app.setCity(null)}
          />
        )
      }
    />
  )
}

function CastingCard({ casting: c }: { casting: CastingItem }) {
  const left = Math.max(0, c.slots - c.acceptedCount)
  return (
    <Press
      onPress={() => router.push({ pathname: "/tuyen-mau/[id]", params: { id: c.id } })}
      accessibilityLabel={`${c.title}, ${compensationLabel(c)}, ${formatDateLong(c.date)} ${c.time}, ${c.district}`}
      style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 8, marginBottom: 12 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <View style={{ backgroundColor: colors.subtle, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Txt v="meta" w={600} color={colors.inkSoft}>
            {categoryLabel(c.category)}
          </Txt>
        </View>
        <View style={{ backgroundColor: c.compensation === "paid" ? colors.successSoft : colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Txt v="meta" w={700} color={c.compensation === "paid" ? colors.success : colors.accentDark}>
            {compensationLabel(c)}
          </Txt>
        </View>
      </View>
      <Txt v="lead" w={700} numberOfLines={2}>
        {c.title}
      </Txt>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name="calendar" size={15} color={colors.muted} />
        <Txt v="meta" color={colors.inkSoft}>
          {formatDateLong(c.date)} · {c.time}
        </Txt>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name="pin" size={15} color={colors.muted} />
        <Txt v="meta" color={colors.inkSoft}>
          {c.district}, {c.city}
        </Txt>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
        <Avatar name={c.pro.name} uri={c.pro.avatar} size={24} />
        <Txt v="meta" w={600} numberOfLines={1} style={{ flexShrink: 1 }}>
          {c.pro.name}
        </Txt>
        {c.pro.verified ? <VerifiedMark size={13} /> : null}
        <Txt v="meta" color={colors.muted} style={{ marginLeft: "auto" }}>
          {c.myApplication && c.myApplication.status !== "withdrawn" ? "Đã ứng tuyển" : `Còn ${left}/${c.slots} chỗ`}
        </Txt>
      </View>
    </Press>
  )
}
