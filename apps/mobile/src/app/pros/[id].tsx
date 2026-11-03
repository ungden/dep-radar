import * as React from "react"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { Image } from "expo-image"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { Alert, ScrollView, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CATEGORY_TINTS, serviceLocationOpen, providerLocationOpen, categoryLabel, getTemplate, perUnitSuffix, showsAverage, verticalOf, type Pro, tierLabels } from "@/shared"
import { formatDuration, formatKm, formatPrice, formatRating, formatResponseTime } from "@/data/format"
import { loadProExtras } from "@/data/public"
import { replyReview } from "@/data/reviews"
import { BookingBar } from "@/components/booking-bar"
import { FollowButton } from "@/components/follow-button"
import { useSafetyMenu } from "@/components/safety"
import { useApp, useProLookup } from "@/state/app"
import { colors, fonts, gutter, radius, hairline } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Avatar, Card, EmptyState, Photo, VerifiedMark } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Sheet, useSheet } from "@/ui/sheet"
import { Txt } from "@/ui/text"

/** How much shows before "Xem tất cả". */
const WORKS_FIRST = 6
const REVIEWS_FIRST = 3

/**
 * Everything about an Artist on one page: their work on top, who they are in
 * real numbers, what they do and what it costs, then photos and clips, what
 * customers said, and their own introduction. Booking stays at the bottom.
 */
export default function ProProfile() {
  const studioBookingOpen = useApp().studioBookingOpen

  const params = useLocalSearchParams<{ id: string; tab?: string; service?: string }>()
  const app = useApp()
  const { pro, searching } = useProLookup(params.id)
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [allWorks, setAllWorks] = React.useState(false)
  const [allReviews, setAllReviews] = React.useState(false)
  // Arriving to read reviews (after writing one) lands on them.
  const scroller = React.useRef<ScrollView>(null)
  const landed = React.useRef(params.tab !== "reviews")
  // The service being looked at, with the customer's package; both start from where they came from.
  const [picked, setPicked] = React.useState<{ template?: string; variant?: string }>({ template: params.service })
  const [extras, setExtras] = React.useState<{ equipment?: string; model?: Pro["model"] }>({})

  const isMine = Boolean(pro && app.uid === pro.uuid)
  const safety = useSafetyMenu(pro && !isMine ? { accountId: pro.uuid, name: pro.name, onBlocked: () => router.back() } : null)
  // A reported review disappears from this screen at once. A review's id is its booking id.
  const [flagged, setFlagged] = React.useState<{ bookingId: string; author: string } | null>(null)
  const [hiddenReviews, setHiddenReviews] = React.useState<ReadonlySet<string>>(new Set())
  const reviewSafety = useSafetyMenu(
    flagged
      ? {
          name: `đánh giá của ${flagged.author}`,
          reviewBookingId: flagged.bookingId,
          onReported: () => setHiddenReviews((s) => new Set(s).add(flagged.bookingId)),
        }
      : null,
  )
  const replySheet = useSheet()
  const [replyTo, setReplyTo] = React.useState<{ id: string; author: string } | null>(null)
  const [replyText, setReplyText] = React.useState("")
  const [replying, setReplying] = React.useState(false)
  const openReply = (id: string, author: string) => {
    setReplyTo({ id, author })
    setReplyText("")
    replySheet.open()
  }
  const sendReply = async () => {
    if (!replyTo) return
    setReplying(true)
    const res = await replyReview(replyTo.id, replyText.trim())
    setReplying(false)
    if (!res.ok) return Alert.alert("Chưa gửi được", res.error)
    replySheet.close()
    void app.refresh()
  }

  const reportReview = (bookingId: string, author: string) => {
    if (!app.uid) return router.push("/login")
    setFlagged({ bookingId, author })
    reviewSafety.report()
  }

  React.useEffect(() => {
    if (pro) void loadProExtras(pro.uuid).then(setExtras).catch(() => {})
  }, [pro])

  if (!pro) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
        <Stack.Screen options={{ headerTransparent: false }} />
        {searching ? null : <EmptyState title="Không tìm thấy hồ sơ" text="Có thể hồ sơ đã tạm ẩn." action="Về Khám phá" onAction={() => router.replace("/")} />}
      </View>
    )
  }

  if (app.blocked.has(pro.uuid)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 60, paddingHorizontal: gutter }}>
        <Stack.Screen options={{ headerTransparent: false }} />
        <EmptyState title={`Bạn đã chặn ${pro.name}`} text="Hồ sơ, bài đăng và tin nhắn của người này đang ẩn trên máy bạn." action="Bỏ chặn" onAction={() => void app.unblock(pro.uuid)} />
      </View>
    )
  }

  const works = app.data?.works.filter((w) => w.proId === pro.id) ?? []
  const reviews = app.data?.reviews.filter((r) => r.proId === pro.id && !hiddenReviews.has(r.id)) ?? []
  const listings = app.data?.services.filter((s) => s.proId === pro.id && providerLocationOpen(pro, studioBookingOpen) && serviceLocationOpen(getTemplate(s.templateId), studioBookingOpen) && s.active && Object.keys(s.prices).length) ?? []
  const km = app.distanceTo(pro)
  const response = formatResponseTime(pro.stats.responseMinutes)
  const isMe = app.uid === pro.uuid
  const photoPeople = pro.categories.some((c) => verticalOf(c) === "photo")
  // Add-ons are chosen on the booking screen, on top of a main service.
  const main = listings.filter((s) => getTemplate(s.templateId) && !getTemplate(s.templateId)?.addon)
  const addons = listings.filter((s) => getTemplate(s.templateId)?.addon)
  const current = main.find((s) => s.templateId === picked.template) ?? main[0]
  const currentTemplate = current ? getTemplate(current.templateId) : undefined
  const priced = currentTemplate?.variants.filter((v) => current?.prices[v.id] != null) ?? []
  const lowest = [...priced].sort((a, b) => (current?.prices[a.id] ?? 0) - (current?.prices[b.id] ?? 0))[0]
  const variant = priced.find((v) => v.id === picked.variant) ?? lowest
  const canBook = !isMe && pro.acceptingJobs && Boolean(currentTemplate && variant)

  const cell = (width - gutter * 2 - 8) / 3
  const cover = works.filter((w) => w.images[0]).slice(0, 3)
  const coverHeight = insets.top + 200
  const shownWorks = allWorks ? works : works.slice(0, WORKS_FIRST)
  const shownReviews = allReviews ? reviews : reviews.slice(0, REVIEWS_FIRST)

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
    <ScrollView ref={scroller} style={{ flex: 1 }} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: isMe ? insets.bottom + 32 : 132 }}>
      {!isMe ? (
        <Stack.Screen
          options={{ headerRight: () => <IconButton name="more" label="Báo cáo hoặc chặn" background="rgba(255,255,255,0.92)" onPress={safety.open} /> }}
        />
      ) : null}
      {safety.element}
      {reviewSafety.element}

      {/* Their own work, edge to edge; nobody's picture stands in when there is none. */}
      {cover.length ? (
        <View style={{ flexDirection: "row", gap: 2, height: coverHeight }}>
          {cover.map((w) => (
            <Image key={w.id} source={{ uri: w.images[0] }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
          ))}
        </View>
      ) : (
        <View style={{ height: insets.top + 96, backgroundColor: CATEGORY_TINTS[pro.categories[0] ?? "nail"].bg }} />
      )}

      <View style={{ paddingHorizontal: gutter, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: -40 }}>
          <View style={{ borderWidth: 4, borderColor: colors.canvas, borderRadius: 48 }}>
            <Avatar name={pro.name} uri={pro.avatar} artist tone={pro.tone} size={80} />
          </View>
          {!isMe ? (
            <View>
              <FollowButton proUuid={pro.uuid} name={pro.name} />
            </View>
          ) : null}
        </View>
        <View style={{ gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Txt v="h1" style={{ flexShrink: 1 }}>
              {pro.name}
            </Txt>
            {pro.identity === "verified" ? <VerifiedMark size={20} /> : null}
          </View>
          <Txt color={colors.inkSoft}>{pro.title || pro.categories.map(categoryLabel).join(" · ")}</Txt>
          <Txt v="meta" color={colors.muted}>
            {pro.district}, {pro.city}
            {km !== null ? ` · cách bạn ${formatKm(km)}` : ""}
          </Txt>
          {pro.identity === "verified" ? (
            <Txt v="meta" color={colors.success}>
              Đã xác minh danh tính bằng CCCD
            </Txt>
          ) : null}
        </View>

        {/* Three real numbers, or the honest absence of one */}
        <View style={{ flexDirection: "row", paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: hairline, borderColor: colors.line }}>
          <Stat value={String(pro.stats.completedJobs)} label="lịch đã xong" />
          <Stat
            star={showsAverage(pro.rating.count)}
            value={showsAverage(pro.rating.count) ? formatRating(pro.rating.average) : "Mới"}
            label={pro.rating.count > 0 ? `${pro.rating.count} đánh giá` : "chưa có đánh giá"}
          />
          <Stat value={response ?? "—"} label={response ? "phản hồi" : "chưa đủ dữ liệu"} />
        </View>

        {/* What they do and what it costs: the decision, before the proof */}
        <View style={{ gap: 10, marginTop: 10 }}>
          <Txt v="h2">Dịch vụ và giá</Txt>
          {main.length ? null : <Txt color={colors.inkSoft}>{pro.name} chưa đặt giá dịch vụ nào.</Txt>}
          {main.map((s) => {
            const t = getTemplate(s.templateId)
            if (!t) return null
            const open = s.templateId === current?.templateId
            const options = t.variants.filter((v) => s.prices[v.id] != null)
            if (!open) {
              return (
                <Press
                  key={s.id}
                  haptic="select"
                  onPress={() => setPicked({ template: s.templateId })}
                  accessibilityLabel={`${t.name}, từ ${formatPrice(Math.min(...options.map((v) => s.prices[v.id])))}`}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: hairline, borderColor: colors.line }}
                >
                  <Txt w={600} style={{ flex: 1 }}>
                    {t.name}
                  </Txt>
                  <Txt v="meta" color={colors.muted} tabular>
                    Từ{" "}
                    <Txt w={700} color={colors.accentDark}>
                      {formatPrice(Math.min(...options.map((v) => s.prices[v.id])))}
                    </Txt>
                  </Txt>
                </Press>
              )
            }
            return (
              <View key={s.id} style={{ padding: 14, gap: 10, borderRadius: radius.md, backgroundColor: colors.accentSoft, borderWidth: 1.5, borderColor: colors.accent }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Txt w={600} style={{ flex: 1 }}>
                    {t.name}
                  </Txt>
                  <Icon name="check" size={18} color={colors.accent} />
                </View>
                <Txt v="meta" color={colors.inkSoft}>
                  {t.description}
                </Txt>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup">
                  {options.map((v) => {
                    const selected = v.id === variant?.id
                    return (
                      <Press
                        key={v.id}
                        haptic="select"
                        onPress={() => setPicked({ template: s.templateId, variant: v.id })}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        style={{ flexGrow: 1, flexBasis: "45%", paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: selected ? colors.accent : colors.surface }}
                      >
                        <Txt v="meta" color={selected ? colors.surface : colors.inkSoft}>
                          {v.label} · {formatDuration(v.durationMin)}
                        </Txt>
                        <Txt w={700} tabular color={selected ? colors.surface : colors.ink}>
                          {formatPrice(s.prices[v.id])}
                          {perUnitSuffix(v)}
                        </Txt>
                      </Press>
                    )
                  })}
                </View>
                {variant ? (
                  <Txt v="meta" color={colors.inkSoft}>
                    Mức {tierLabels(variant)[variant.tiers.indexOf(s.prices[variant.id])]}
                    {variant.deliverable ?? t.deliverable ? ` · ${variant.deliverable ?? t.deliverable}` : ""}
                    {variant.revisions ? ` · ${variant.revisions} lượt sửa` : ""}
                    {variant.sessions ? ` · ${variant.sessions} buổi` : ""}
                    {variant.followupDays ? ` · dặm trong ${variant.followupDays} ngày` : ""}
                  </Txt>
                ) : null}
                {/* The partner's own words on a package; without them the catalogue's description above stands. */}
                {variant && s.notes?.[variant.id] ? (
                  <View style={{ padding: 10, borderRadius: radius.sm, backgroundColor: colors.surface, gap: 2 }}>
                    <Txt v="meta" w={600} color={colors.inkSoft}>
                      {pro.name} ghi rõ gói {variant.label}
                    </Txt>
                    <Txt v="meta">{s.notes[variant.id]}</Txt>
                  </View>
                ) : null}
              </View>
            )
          })}
          {addons.length ? (
            <Txt v="meta" color={colors.muted}>
              Chọn thêm khi đặt lịch: {addons.map((s) => getTemplate(s.templateId)?.name).join(", ")}
            </Txt>
          ) : null}
          {!isMe && pro.acceptingJobs && main.length ? (
            <Txt v="meta" color={colors.muted}>
              Nhắn tin với {pro.name} mở khi họ nhận lịch của bạn.
            </Txt>
          ) : null}
        </View>
      </View>

      {/* Photos and clips */}
      <View style={{ paddingHorizontal: gutter, paddingTop: 24, gap: 10 }}>
        <Heading title="Ảnh và clip" count={works.length} first={WORKS_FIRST} open={allWorks} onToggle={() => setAllWorks((v) => !v)} />
        {works.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {shownWorks.map((w) => (
              <Press key={w.id} onPress={() => router.push({ pathname: "/works/[id]", params: { id: w.id } })} accessibilityLabel={`${w.title}${w.video ? ", clip" : ""}`} style={{ width: cell }}>
                <Photo uri={w.images[0]} rounded={radius.sm} recyclingKey={w.id} />
                {w.video ? (
                  <View style={{ position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3, height: 20, paddingHorizontal: 7, borderRadius: radius.full, backgroundColor: "rgba(20,18,19,0.66)" }}>
                    <Icon name="play" size={10} color={colors.surface} />
                    <Txt v="label" color={colors.surface} style={{ fontSize: 13, lineHeight: 17 }}>
                      Clip
                    </Txt>
                  </View>
                ) : null}
              </Press>
            ))}
          </View>
        ) : (
          <Txt color={colors.inkSoft}>{pro.name} chưa đăng ảnh hay clip nào.</Txt>
        )}
      </View>

      {/* What customers said */}
      <View
        style={{ paddingHorizontal: gutter, paddingTop: 24, gap: 10 }}
        onLayout={(e) => {
          if (landed.current) return
          landed.current = true
          scroller.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: false })
        }}
      >
        <Heading title="Khách đánh giá" count={reviews.length} first={REVIEWS_FIRST} open={allReviews} onToggle={() => setAllReviews((v) => !v)} />
        {reviews.length ? (
          shownReviews.map((r) => (
            <View key={r.id} style={{ padding: 14, gap: 6, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: hairline, borderColor: colors.line }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Txt w={600} style={{ flexShrink: 1 }}>
                  {r.author}
                </Txt>
                <Txt v="meta" color={colors.muted}>
                  {r.date.split("-").reverse().join("/")}
                </Txt>
              </View>
              <Txt v="meta" color={colors.inkSoft} accessibilityLabel={`${Math.round(r.rating)} sao, ${r.serviceName}`}>
                <Txt v="meta" color={colors.highlight}>
                  {"★".repeat(Math.round(r.rating))}
                </Txt>
                {" · "}
                {r.serviceName}
              </Txt>
              {r.text || r.photo ? (
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <Txt style={{ flex: 1 }}>{r.text}</Txt>
                  {r.photo ? <Photo uri={r.photo} style={{ width: 64 }} rounded={radius.sm} /> : null}
                </View>
              ) : null}
              {r.reply ? (
                <View style={{ backgroundColor: colors.subtle, borderRadius: radius.sm, padding: 10, gap: 2 }}>
                  <Txt v="meta" w={600}>
                    {pro.name} trả lời
                  </Txt>
                  <Txt v="meta">{r.reply}</Txt>
                </View>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                {isMine && !r.reply ? (
                  <Press onPress={() => openReply(r.id, r.author)} accessibilityRole="button" accessibilityLabel={`Trả lời đánh giá của ${r.author}`} style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 }}>
                    <Icon name="chat" size={13} color={colors.accentDark} />
                    <Txt v="meta" w={600} color={colors.accentDark}>
                      Trả lời
                    </Txt>
                  </Press>
                ) : null}
                <Press
                  onPress={() => reportReview(r.id, r.author)}
                  accessibilityRole="button"
                  accessibilityLabel={`Báo cáo đánh giá của ${r.author}`}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 }}
                >
                  <Icon name="flag" size={13} color={colors.muted} />
                  <Txt v="meta" color={colors.muted}>
                    Báo cáo
                  </Txt>
                </Press>
              </View>
            </View>
          ))
        ) : (
          <Txt color={colors.inkSoft}>Chưa có đánh giá. Đánh giá chỉ đến từ khách đã đặt và hoàn thành lịch.</Txt>
        )}
      </View>

      {/* In their own words */}
      <View style={{ paddingHorizontal: gutter, paddingTop: 24, gap: 10 }}>
        <Txt v="h2">Giới thiệu</Txt>
        {pro.bio ? <Txt color={colors.inkSoft}>{pro.bio}</Txt> : <Txt color={colors.inkSoft}>{pro.name} chưa viết giới thiệu.</Txt>}
        {pro.highlights.length ? (
          <View style={{ gap: 6 }}>
            {pro.highlights.map((h) => (
              <View key={h} style={{ flexDirection: "row", gap: 8 }}>
                <Icon name="check" size={16} color={colors.success} />
                <Txt style={{ flex: 1 }}>{h}</Txt>
              </View>
            ))}
          </View>
        ) : null}
        <Card style={{ borderWidth: hairline, borderColor: colors.line }}>
          <Info label="Hình thức" value={[pro.homeService ? "Đến tận nơi" : null, studioBookingOpen && pro.studioAddress ? "Tại studio" : null].filter(Boolean).join(" · ") || "Chưa ghi"} />
          {studioBookingOpen && pro.studioAddress ? <Info label="Studio" value={pro.studioAddress} /> : null}
          {pro.homeService ? <Info label="Đi xa tối đa" value={`${pro.maxTravelKm} km`} /> : null}
          {pro.areas.length ? <Info label="Khu vực" value={pro.areas.join(", ")} /> : null}
          {pro.yearsExp > 0 ? <Info label="Kinh nghiệm" value={`${pro.yearsExp} năm`} /> : null}
          {photoPeople && extras.equipment ? <Info label="Thiết bị" value={extras.equipment} /> : null}
        </Card>
        {extras.model ? (
          <Card style={{ borderWidth: hairline, borderColor: colors.line }}>
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
      {isMine ? (
        <Sheet sheet={replySheet} title={replyTo ? `Trả lời ${replyTo.author}` : "Trả lời"} footer={<Button label="Gửi trả lời" full busy={replying} disabled={replyText.trim().length < 2} onPress={() => void sendReply()} />}>
          <Txt color={colors.inkSoft}>Câu trả lời hiện công khai trên hồ sơ và chỉ gửi được một lần.</Txt>
          <BottomSheetTextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Cảm ơn bạn đã tin tưởng…"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            style={{ minHeight: 88, backgroundColor: colors.subtle, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 17, color: colors.ink, textAlignVertical: "top" }}
          />
        </Sheet>
      ) : null}
    </ScrollView>
      {/* The page scrolls under the status bar: this keeps the clock readable on photos and text. */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top, backgroundColor: "rgba(250,248,245,0.88)" }} />
      {!isMe ? (
        <BookingBar
          title={current && variant ? `${formatPrice(current.prices[variant.id])}${perUnitSuffix(variant)}` : null}
          note={currentTemplate && variant ? `${currentTemplate.name} · ${variant.label}` : undefined}
          action={pro.acceptingJobs ? "Chọn lịch" : "Đang tạm nghỉ"}
          disabled={!canBook}
          onPress={() => router.push({ pathname: "/book/[proId]", params: { proId: pro.id, template: currentTemplate?.id ?? "", variant: variant?.id ?? "" } })}
        />
      ) : null}
    </View>
  )
}

/** A section title; "Xem tất cả" only when there is more than the first few. */
function Heading({ title, count, first, open, onToggle }: { title: string; count: number; first: number; open: boolean; onToggle: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 32 }}>
      <Txt v="h2" style={{ flexShrink: 1 }}>
        {title}
      </Txt>
      {count > first ? (
        <Press onPress={onToggle} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
          <Txt v="meta" w={600} color={colors.accentDark}>
            {open ? "Thu gọn" : `Xem tất cả ${count}`}
          </Txt>
        </Press>
      ) : null}
    </View>
  )
}

function Stat({ value, label, star }: { value: string; label: string; star?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {star ? <Icon name="star" size={15} color={colors.highlight} /> : null}
        <Txt v="lead" w={700} tabular numberOfLines={1}>
          {value}
        </Txt>
      </View>
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
