import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native"
import { POLICY, buildQuote, getTemplate, isUrgent, travelDistanceKm } from "@/shared"
import { createBooking, fetchSlots } from "@/data/bookings"
import { addDays, formatDuration, formatKm, formatPrice, todayISO, weekdayShort } from "@/data/format"
import { webLink } from "@/data/links"
import { askForPushPermission } from "@/data/push"
import { BookingBar } from "@/components/booking-bar"
import { useApp, usePro } from "@/state/app"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, EmptyState, ErrorNote, Line } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/**
 * Three steps: what, when, where. The price shown is the same preview the web
 * shows (lib/pricing); the database prices it again in create_booking and its
 * answer is the one that counts. A refusal is shown word for word.
 */
export default function Book() {
  const params = useLocalSearchParams<{ proId: string; template?: string }>()
  const app = useApp()
  const pro = usePro(params.proId)

  const listings = React.useMemo(
    () => (pro ? (app.data?.services ?? []).filter((s) => s.proId === pro.id && s.active && Object.keys(s.prices).length && getTemplate(s.templateId)) : []),
    [app.data, pro],
  )
  const [step, setStep] = React.useState(1)
  const [templateId, setTemplateId] = React.useState<string | null>(null)
  const [variantId, setVariantId] = React.useState<string | null>(null)
  const [quantity, setQuantity] = React.useState(1)
  const [atHomePref, setAtHomePref] = React.useState(true)
  const [date, setDate] = React.useState(addDays(todayISO(), 1))
  const [time, setTime] = React.useState<{ startsAt: string; time: string } | null>(null)
  const [addressId, setAddressId] = React.useState<string | null>(null)
  const [note, setNote] = React.useState("")
  const [slots, setSlots] = React.useState<{ key: string; list: { startsAt: string; time: string }[] } | null>(null)
  const [slotError, setSlotError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [doneId, setDoneId] = React.useState<string | null>(null)

  // Start on the service the customer came from, or the first one listed.
  const listing = listings.find((s) => s.templateId === templateId) ?? listings.find((s) => s.templateId === params.template) ?? listings[0]
  const template = listing ? getTemplate(listing.templateId) : undefined
  const offered = template && listing ? template.variants.filter((v) => listing.prices[v.id] != null) : []
  const variant = offered.find((v) => v.id === variantId) ?? offered[0]
  const heads = variant?.perPerson ? Math.min(Math.max(quantity, 1), variant.maxQuantity ?? 1) : 1
  const unit = variant && listing ? listing.prices[variant.id] : 0
  const servicePrice = unit * heads

  const canStudio = Boolean(pro?.studioAddress)
  const canHome = Boolean(pro?.homeService) && !template?.studioOnly
  const atHome = canHome && (atHomePref || !canStudio)
  const addresses = app.me.addresses
  const chosenId = addressId ?? (addresses.find((a) => a.isDefault) ?? addresses[0])?.id ?? null
  const address = addresses.find((a) => a.id === chosenId) ?? null
  const km = atHome && pro && address ? travelDistanceKm(pro.city, pro.district, address.city, address.district) : null
  const tooFar = atHome && pro && address ? km === null || km > pro.maxTravelKm : false

  const slotKey = [pro?.uuid, listing?.templateId, variant?.id, heads, date, atHome, atHome ? chosenId : null].join("|")
  React.useEffect(() => {
    if (!pro || !listing || !variant) return
    let live = true
    setSlotError(null)
    fetchSlots({ proUuid: pro.uuid, templateId: listing.templateId, variantId: variant.id, quantity: heads, date, atHome, addressId: atHome ? chosenId : null })
      .then((list) => live && setSlots({ key: slotKey, list }))
      .catch((e: Error) => live && setSlotError(e.message))
    return () => {
      live = false
    }
  }, [slotKey, pro, listing, variant, heads, date, atHome, chosenId])
  const daySlots = slots?.key === slotKey ? slots.list : null
  const picked = time && daySlots?.some((s) => s.startsAt === time.startsAt) ? time : null

  const quote = picked ? buildQuote({ servicePrice, atHome, distanceKm: km, urgent: isUrgent(date, picked.time) }) : null

  if (!pro) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }}>{app.data ? <EmptyState title="Không tìm thấy người làm" /> : null}</View>
  }
  if (!listings.length || !template || !variant) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter }}>
        <EmptyState title="Chưa đặt được" text={`${pro.name} chưa đặt giá dịch vụ nào để nhận lịch.`} action="Quay lại" onAction={() => router.back()} />
      </View>
    )
  }

  if (doneId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter, justifyContent: "center", gap: 12 }}>
        <Stack.Screen options={{ title: "Đã gửi lịch", headerBackVisible: false, gestureEnabled: false }} />
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
          <Icon name="check" size={30} color={colors.success} />
        </View>
        <Txt v="h2" center>
          Đã gửi lịch hẹn
        </Txt>
        <Txt color={colors.inkSoft} center>
          {pro.name} sẽ gọi cho bạn để xác nhận trong vòng {POLICY.confirmWithinHours} giờ. Nếu không, lịch tự huỷ và bạn không mất gì.
        </Txt>
        <Button
          label="Xem lịch hẹn"
          full
          onPress={() => {
            router.dismissAll()
            router.push({ pathname: "/bookings/[id]", params: { id: doneId } })
          }}
        />
        <Button label="Về Khám phá" variant="ghost" full onPress={() => router.dismissAll()} />
      </View>
    )
  }

  const submit = async () => {
    if (!app.uid) return router.push("/login")
    if (!app.me.account?.phone) return router.push("/so-dien-thoai")
    if (!picked) return
    setBusy(true)
    setError(null)
    const res = await createBooking({
      proUuid: pro.uuid,
      templateId: template.id,
      variantId: variant.id,
      startsAt: picked.startsAt,
      atHome,
      addressId: atHome ? chosenId : null,
      quantity: heads,
      note: note.trim(),
    })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setDoneId(res.data)
    void app.refreshMe()
    // The confirmation call is time-critical; this is the moment to ask.
    void askForPushPermission()
  }

  const next = () => (step < 3 ? setStep(step + 1) : void submit())
  const canNext = step === 1 ? true : step === 2 ? Boolean(picked) : Boolean(picked) && (!atHome || (address && !tooFar))
  const days = Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i))

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen
        options={{
          title: `Bước ${step}/3`,
          headerLeft: step > 1 ? () => <Button label="Quay lại" variant="ghost" size="sm" onPress={() => setStep(step - 1)} /> : undefined,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <Txt v="h2">{step === 1 ? "Chọn dịch vụ" : step === 2 ? "Chọn ngày giờ" : "Địa điểm và giá"}</Txt>

        {step === 1 ? (
          <>
            <View style={{ gap: 8 }}>
              {listings.map((s) => {
                const t = getTemplate(s.templateId)!
                const selected = s.templateId === template.id
                return (
                  <Option
                    key={s.templateId}
                    selected={selected}
                    title={t.name}
                    subtitle={`Từ ${formatPrice(Math.min(...Object.values(s.prices)))}`}
                    onPress={() => {
                      setTemplateId(s.templateId)
                      setVariantId(null)
                      setTime(null)
                    }}
                  />
                )
              })}
            </View>
            <View style={{ gap: 8 }}>
              <Txt v="lead" w={700}>
                Gói
              </Txt>
              {offered.map((v) => (
                <Option
                  key={v.id}
                  selected={v.id === variant.id}
                  title={v.label}
                  subtitle={`${formatDuration(v.durationMin)}${v.perPerson ? " · mỗi người" : ""}`}
                  right={formatPrice(listing!.prices[v.id])}
                  onPress={() => {
                    setVariantId(v.id)
                    setTime(null)
                  }}
                />
              ))}
            </View>
            {variant.perPerson ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Txt w={600}>Số người</Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <Button label="−" variant="secondary" size="sm" disabled={heads <= 1} onPress={() => setQuantity(heads - 1)} />
                  <Txt v="lead" w={700} tabular>
                    {heads}
                  </Txt>
                  <Button label="+" variant="secondary" size="sm" disabled={heads >= (variant.maxQuantity ?? 1)} onPress={() => setQuantity(heads + 1)} />
                </View>
              </View>
            ) : null}
            {canHome && canStudio ? (
              <View style={{ gap: 8 }}>
                <Txt v="lead" w={700}>
                  Làm ở đâu
                </Txt>
                <Option selected={atHome} title={template.onLocation ? "Tại địa điểm bạn chọn" : "Tại nhà bạn"} onPress={() => setAtHomePref(true)} />
                <Option selected={!atHome} title="Tại studio" subtitle={pro.studioAddress} onPress={() => setAtHomePref(false)} />
              </View>
            ) : (
              <Txt v="meta" color={colors.inkSoft}>
                {atHome ? (template.onLocation ? "Làm tại địa điểm bạn chọn." : "Làm tại nhà bạn.") : `Làm tại studio: ${pro.studioAddress ?? ""}`}
              </Txt>
            )}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -gutter }}>
              <View style={{ width: gutter - 8 }} />
              {days.map((d) => {
                const selected = d === date
                return (
                  <Press
                    key={d}
                    onPress={() => {
                      setDate(d)
                      setTime(null)
                    }}
                    accessibilityState={{ selected }}
                    accessibilityLabel={d}
                    style={{ width: 56, paddingVertical: 10, borderRadius: radius.md, alignItems: "center", backgroundColor: selected ? colors.accent : colors.surface }}
                  >
                    <Txt v="meta" color={selected ? colors.surface : colors.muted}>
                      {d === todayISO() ? "Nay" : weekdayShort(d)}
                    </Txt>
                    <Txt v="lead" w={700} color={selected ? colors.surface : colors.ink}>
                      {Number(d.slice(8))}
                    </Txt>
                  </Press>
                )
              })}
              <View style={{ width: gutter - 8 }} />
            </ScrollView>
            {slotError ? (
              <ErrorNote text={slotError} />
            ) : !daySlots ? (
              <ActivityIndicator color={colors.ink} />
            ) : daySlots.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {daySlots.map((s) => {
                  const selected = picked?.startsAt === s.startsAt
                  return (
                    <Press
                      key={s.startsAt}
                      onPress={() => setTime(s)}
                      accessibilityState={{ selected }}
                      style={{ width: "23%", height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: selected ? colors.accent : colors.surface }}
                    >
                      <Txt w={700} tabular color={selected ? colors.surface : colors.ink}>
                        {s.time}
                      </Txt>
                    </Press>
                  )
                })}
              </View>
            ) : (
              <Txt color={colors.inkSoft}>Không còn giờ trống ngày này. Thử ngày khác nhé.</Txt>
            )}
            {picked && isUrgent(date, picked.time) ? (
              <Txt v="meta" color={colors.warning}>
                Lịch trong {POLICY.urgentWithinHours} giờ tới có phí gấp {formatPrice(POLICY.urgentFee)}.
              </Txt>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            {atHome ? (
              <View style={{ gap: 8 }}>
                <Txt v="lead" w={700}>
                  {template.onLocation ? "Địa điểm" : "Địa chỉ"}
                </Txt>
                {addresses.length ? (
                  addresses.map((a) => (
                    <Option
                      key={a.id}
                      selected={a.id === chosenId}
                      title={a.label || a.detail}
                      subtitle={[a.detail, a.district, a.city].filter(Boolean).join(", ")}
                      onPress={() => setAddressId(a.id)}
                    />
                  ))
                ) : (
                  <Txt color={colors.inkSoft}>Bạn chưa lưu địa chỉ nào.</Txt>
                )}
                <Button
                  label="Thêm địa chỉ trên web"
                  variant="secondary"
                  size="sm"
                  icon="external"
                  onPress={async () => {
                    await WebBrowser.openBrowserAsync(webLink("/me/dia-chi"))
                    void app.refreshMe()
                  }}
                />
                {tooFar ? (
                  <Txt v="meta" color={colors.danger}>
                    {pro.name} chỉ đi tối đa {pro.maxTravelKm} km{km !== null ? `; địa chỉ này cách ${formatKm(km)}` : ", địa chỉ này ở thành phố khác"}.
                  </Txt>
                ) : null}
              </View>
            ) : (
              <Card>
                <Txt w={700}>Tại studio</Txt>
                <Txt color={colors.inkSoft}>{pro.studioAddress}</Txt>
              </Card>
            )}
            <View style={{ gap: 8 }}>
              <Txt v="lead" w={700}>
                Ghi chú cho {pro.name}
              </Txt>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Mẫu bạn thích, dị ứng, chỗ đỗ xe…"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                style={{ minHeight: 88, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
              />
            </View>
            {time && daySlots && !picked ? (
              <View style={{ gap: 8 }}>
                <Txt color={colors.danger}>Giờ {time.time} không còn trống với địa điểm này.</Txt>
                <Button label="Chọn lại giờ" variant="secondary" size="sm" onPress={() => setStep(2)} />
              </View>
            ) : null}
            {quote && picked ? (
              <Card>
                <Txt w={700}>
                  {template.name} · {variant.label}
                  {heads > 1 ? ` × ${heads}` : ""}
                </Txt>
                <Txt v="meta" color={colors.inkSoft}>
                  {date.split("-").reverse().join("/")} lúc {picked.time}
                </Txt>
                <Line label="Dịch vụ" value={formatPrice(quote.servicePrice)} />
                {quote.travelFee ? <Line label={`Phí di chuyển${quote.distanceKm !== null ? ` (~${formatKm(quote.distanceKm)})` : ""}`} value={formatPrice(quote.travelFee)} /> : null}
                {quote.urgentFee ? <Line label="Phí gấp" value={formatPrice(quote.urgentFee)} /> : null}
                <Line label="Tổng, trả sau khi làm xong" value={formatPrice(quote.total)} strong />
                <Txt v="meta" color={colors.muted}>
                  Khoảng cách ước tính theo quận. Giá cuối cùng do hệ thống tính lại khi gửi. Huỷ miễn phí trước giờ hẹn {POLICY.freeCancelHours} tiếng.
                </Txt>
              </Card>
            ) : null}
            {error ? <ErrorNote text={error} /> : null}
          </>
        ) : null}
      </ScrollView>

      <BookingBar
        title={quote ? `Tổng ${formatPrice(quote.total)}` : servicePrice ? formatPrice(servicePrice) : null}
        note={picked ? `${date.split("-").reverse().slice(0, 2).join("/")} · ${picked.time}` : variant.label}
        action={step < 3 ? "Tiếp tục" : app.uid ? "Gửi lịch hẹn" : "Đăng nhập để đặt"}
        disabled={!canNext}
        busy={busy}
        onPress={next}
      />
    </View>
  )
}

function Option({ selected, title, subtitle, right, onPress }: { selected: boolean; title: string; subtitle?: string; right?: string; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      accessibilityState={{ selected }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: selected ? colors.accent : "transparent",
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt w={selected ? 700 : 600}>{title}</Txt>
        {subtitle ? (
          <Txt v="meta" color={colors.inkSoft}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right ? (
        <Txt w={700} tabular>
          {right}
        </Txt>
      ) : null}
    </Press>
  )
}
