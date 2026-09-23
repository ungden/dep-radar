import * as React from "react"
import { router, useLocalSearchParams } from "expo-router"
import { Alert, ScrollView, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { categoryLabel, getTemplate, verticalOf, type Pro } from "@/shared"
import { openThread } from "@/data/chat"
import { formatDuration, formatKm, formatPrice, formatRating, formatResponseTime } from "@/data/format"
import { loadProExtras } from "@/data/public"
import { FollowButton } from "@/components/follow-button"
import { TextTabs } from "@/components/switches"
import { useApp, usePro } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Avatar, Card, EmptyState, Photo, VerifiedMark } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

type Tab = "works" | "gia" | "reviews" | "about"

export default function ProProfile() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>()
  const app = useApp()
  const pro = usePro(params.id)
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [tab, setTab] = React.useState<Tab>(params.tab === "gia" ? "gia" : "works")
  const [extras, setExtras] = React.useState<{ equipment?: string; model?: Pro["model"] }>({})
  const [opening, setOpening] = React.useState(false)

  React.useEffect(() => {
    if (pro) void loadProExtras(pro.uuid).then(setExtras).catch(() => {})
  }, [pro])

  if (!pro) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
        {app.data ? <EmptyState title="Không tìm thấy hồ sơ" text="Có thể hồ sơ đã tạm ẩn." action="Về Khám phá" onAction={() => router.replace("/")} /> : null}
      </View>
    )
  }

  const works = app.data?.works.filter((w) => w.proId === pro.id) ?? []
  const reviews = app.data?.reviews.filter((r) => r.proId === pro.id) ?? []
  const listings = app.data?.services.filter((s) => s.proId === pro.id && s.active && Object.keys(s.prices).length) ?? []
  const km = app.distanceTo(pro)
  const response = formatResponseTime(pro.stats.responseMinutes)
  const isMe = app.uid === pro.uuid
  const photoPeople = pro.categories.some((c) => verticalOf(c) === "photo")

  const message = async () => {
    if (!app.uid) return router.push("/login")
    setOpening(true)
    const res = await openThread(pro.uuid)
    setOpening(false)
    if (res.ok) router.push({ pathname: "/tin-nhan/[id]", params: { id: res.data } })
    else Alert.alert("Chưa mở được hội thoại", res.error)
  }

  const cell = (width - gutter * 2 - 4) / 3

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      {/* Cover: the first three real photos, uncropped 4:5 */}
      <View style={{ flexDirection: "row", gap: 2, paddingTop: insets.top + 44 }}>
        {[0, 1, 2].map((i) => (
          <Photo key={i} uri={works[i]?.images[0]} rounded={0} style={{ flex: 1 }} />
        ))}
      </View>

      <View style={{ paddingHorizontal: gutter, gap: 16 }}>
        <View style={{ marginTop: -36, borderWidth: 4, borderColor: colors.canvas, borderRadius: 48, alignSelf: "flex-start" }}>
          <Avatar name={pro.name} uri={pro.avatar} tone={pro.tone} size={80} />
        </View>
        <View style={{ gap: 4, marginTop: -8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Txt v="h2" style={{ flexShrink: 1 }}>
              {pro.name}
            </Txt>
            {pro.identity === "verified" ? <VerifiedMark size={20} /> : null}
          </View>
          <Txt color={colors.inkSoft}>{pro.title || pro.categories.map(categoryLabel).join(" · ")}</Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="pin" size={14} color={colors.muted} />
            <Txt v="meta" color={colors.muted}>
              {pro.district}, {pro.city}
              {km !== null ? ` · cách bạn ${formatKm(km)}` : ""}
            </Txt>
          </View>
          {pro.identity === "verified" ? (
            <Txt v="meta" color={colors.inkSoft}>
              Đã xác minh danh tính bằng CCCD
            </Txt>
          ) : null}
        </View>

        {/* Three real numbers, or the honest absence of one */}
        <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 14 }}>
          <Stat value={pro.stats.completedJobs > 0 ? String(pro.stats.completedJobs) : "0"} label="lịch đã xong" />
          <Stat value={pro.rating.count > 0 ? `★ ${formatRating(pro.rating.average)}` : "—"} label={pro.rating.count > 0 ? `${pro.rating.count} đánh giá` : "chưa có đánh giá"} />
          <Stat value={response ?? "—"} label={response ? "phản hồi" : "chưa đủ dữ liệu"} />
        </View>

        {!isMe ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="Nhắn tin" variant="secondary" icon="chat" onPress={() => void message()} busy={opening} style={{ flex: 1 }} full />
            <Button
              label={pro.acceptingJobs ? "Đặt lịch" : "Tạm nghỉ"}
              disabled={!pro.acceptingJobs || !listings.length}
              onPress={() => router.push({ pathname: "/book/[proId]", params: { proId: pro.id } })}
              style={{ flex: 1 }}
              full
            />
          </View>
        ) : null}
        {!isMe ? (
          <View style={{ alignItems: "flex-start" }}>
            <FollowButton proUuid={pro.uuid} name={pro.name} />
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: 20, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <TextTabs
          size="body"
          value={tab}
          onChange={setTab}
          items={[
            { value: "works", label: `Tác phẩm${works.length ? ` ${works.length}` : ""}` },
            { value: "gia", label: "Bảng giá" },
            { value: "reviews", label: `Đánh giá${reviews.length ? ` ${reviews.length}` : ""}` },
            { value: "about", label: "Giới thiệu" },
          ]}
        />
      </View>

      <View style={{ paddingHorizontal: gutter, paddingTop: 16, gap: 12 }}>
        {tab === "works" ? (
          works.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
              {works.map((w) => (
                <Press key={w.id} onPress={() => router.push({ pathname: "/works/[id]", params: { id: w.id } })} accessibilityLabel={w.title} style={{ width: cell }}>
                  <Photo uri={w.images[0]} rounded={radius.sm} recyclingKey={w.id} />
                  {w.video ? (
                    <View style={{ position: "absolute", top: 6, right: 6 }}>
                      <Icon name="play" size={14} color={colors.surface} />
                    </View>
                  ) : null}
                </Press>
              ))}
            </View>
          ) : (
            <EmptyState title="Chưa có tác phẩm" text={`${pro.name} chưa đăng ảnh nào.`} />
          )
        ) : null}

        {tab === "gia" ? (
          listings.length ? (
            listings.map((s) => {
              const t = getTemplate(s.templateId)
              if (!t) return null
              return (
                <Card key={s.id}>
                  <Txt v="lead" w={700}>
                    {t.name}
                  </Txt>
                  <Txt v="meta" color={colors.inkSoft}>
                    {t.description}
                  </Txt>
                  {t.variants
                    .filter((v) => s.prices[v.id] != null)
                    .map((v) => (
                      <View key={v.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingTop: 6 }}>
                        <Txt style={{ flex: 1 }}>
                          {v.label}
                          <Txt v="meta" color={colors.muted}>
                            {"  "}
                            {formatDuration(v.durationMin)}
                          </Txt>
                        </Txt>
                        <Txt w={700} tabular>
                          {formatPrice(s.prices[v.id])}
                        </Txt>
                      </View>
                    ))}
                  {!isMe && pro.acceptingJobs ? (
                    <Button
                      label="Đặt dịch vụ này"
                      size="sm"
                      variant="secondary"
                      style={{ marginTop: 6 }}
                      onPress={() => router.push({ pathname: "/book/[proId]", params: { proId: pro.id, template: s.templateId } })}
                    />
                  ) : null}
                </Card>
              )
            })
          ) : (
            <EmptyState title="Chưa có bảng giá" text={`${pro.name} chưa đặt giá dịch vụ nào.`} />
          )
        ) : null}

        {tab === "reviews" ? (
          reviews.length ? (
            reviews.map((r) => (
              <Card key={r.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Txt w={700}>{r.author}</Txt>
                  <Txt v="meta" color={colors.muted}>
                    {r.date.split("-").reverse().join("/")}
                  </Txt>
                </View>
                <Txt v="meta" color={colors.inkSoft}>
                  {"★".repeat(Math.round(r.rating))} · {r.serviceName}
                </Txt>
                {r.text ? <Txt>{r.text}</Txt> : null}
                {r.photo ? <Photo uri={r.photo} style={{ width: 120 }} rounded={radius.sm} /> : null}
                {r.reply ? (
                  <View style={{ backgroundColor: colors.subtle, borderRadius: radius.sm, padding: 10 }}>
                    <Txt v="meta" w={700}>
                      {pro.name} trả lời
                    </Txt>
                    <Txt v="meta">{r.reply}</Txt>
                  </View>
                ) : null}
              </Card>
            ))
          ) : (
            <EmptyState title="Chưa có đánh giá" text="Đánh giá chỉ đến từ khách đã đặt và hoàn thành lịch." />
          )
        ) : null}

        {tab === "about" ? (
          <View style={{ gap: 16 }}>
            {pro.bio ? <Txt>{pro.bio}</Txt> : <Txt color={colors.inkSoft}>{pro.name} chưa viết giới thiệu.</Txt>}
            {pro.highlights.length ? (
              <View style={{ gap: 6 }}>
                {pro.highlights.map((h) => (
                  <View key={h} style={{ flexDirection: "row", gap: 8 }}>
                    <Icon name="check" size={16} />
                    <Txt style={{ flex: 1 }}>{h}</Txt>
                  </View>
                ))}
              </View>
            ) : null}
            <Card>
              <Info label="Hình thức" value={[pro.homeService ? "Đến tận nơi" : null, pro.studioAddress ? "Tại studio" : null].filter(Boolean).join(" · ") || "Chưa ghi"} />
              {pro.studioAddress ? <Info label="Studio" value={pro.studioAddress} /> : null}
              {pro.homeService ? <Info label="Đi xa tối đa" value={`${pro.maxTravelKm} km`} /> : null}
              {pro.areas.length ? <Info label="Khu vực" value={pro.areas.join(", ")} /> : null}
              {pro.yearsExp > 0 ? <Info label="Kinh nghiệm" value={`${pro.yearsExp} năm`} /> : null}
              {photoPeople && extras.equipment ? <Info label="Thiết bị" value={extras.equipment} /> : null}
            </Card>
            {extras.model ? (
              <Card>
                <Txt v="lead" w={700}>
                  Thẻ người mẫu
                </Txt>
                {extras.model.heightCm ? <Info label="Chiều cao" value={`${extras.model.heightCm} cm`} /> : null}
                {extras.model.topSize ? <Info label="Size áo" value={extras.model.topSize} /> : null}
                {extras.model.bottomSize ? <Info label="Size quần" value={extras.model.bottomSize} /> : null}
                {extras.model.shoeSize ? <Info label="Size giày" value={extras.model.shoeSize} /> : null}
                {extras.model.styles.length ? <Info label="Phong cách" value={extras.model.styles.join(", ")} /> : null}
                {extras.model.accepts.length ? <Info label="Nhận" value={extras.model.accepts.join(", ")} /> : null}
                {extras.model.refuses.length ? <Info label="Không nhận" value={extras.model.refuses.join(", ")} /> : null}
              </Card>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 4 }}>
      <Txt v="lead" w={700} tabular numberOfLines={1}>
        {value}
      </Txt>
      <Txt v="meta" color={colors.muted} center numberOfLines={1}>
        {label}
      </Txt>
    </View>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingVertical: 4 }}>
      <Txt color={colors.muted} style={{ width: 110 }}>
        {label}
      </Txt>
      <Txt style={{ flex: 1 }}>{value}</Txt>
    </View>
  )
}
