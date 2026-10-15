import * as React from "react"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { Stack, router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router"
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View, useWindowDimensions } from "react-native"
import { appointmentAt, CITIES, POLICY, buildQuote, districtsOf, getTemplate, isUrgent, travelDistanceKm, serviceQuantity, type PriceQuote } from "@/shared"
import { takeLastSavedAddress } from "@/data/addresses"
import { rpc } from "@/data/supabase"
import { toTimestamptz } from "@/data/format"
import { createBooking, fetchSlots } from "@/data/bookings"
import { addDays, formatDateLong, formatDuration, formatKm, formatPrice, todayISO, weekdayShort } from "@/data/format"
import { askForPushPermission } from "@/data/push"
import { WardPicker } from "@/components/ward-picker"
import { DateField } from "@/components/date-field"
import { TimeField } from "@/components/time-field"
import { BookingBar } from "@/components/booking-bar"
import { useApp, usePro } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { ConductNote } from "@/components/conduct"
import { needsConductNote } from "@/shared"
import { colors, controlMetrics, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Card, Chip, EmptyState, ErrorNote, Line } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const SLOT_GAP = 8

/**
 * Three steps: what, when, where. The price shown is the same preview the web
 * shows (lib/pricing); the database prices it again in create_booking and its
 * answer is the one that counts. A refusal is shown word for word.
 *
 * Signed out, step 3 still works: the customer picks a city and district for
 * the estimate, then "Đăng nhập để đặt" opens sign-in on top of this screen,
 * which stays mounted, so every choice is still here when they come back.
 */
export default function Book() {
  // Picker portals belong to this native modal, above its content and footer.
  return <BottomSheetModalProvider><BookingFlow /></BottomSheetModalProvider>
}

function BookingFlow() {
  const params = useLocalSearchParams<{ proId: string; template?: string; variant?: string }>()
  const app = useApp()
  const pro = usePro(params.proId)
  const navigation = useNavigation()
  const keyboard = useKeyboardVisible()
  const { width, fontScale } = useWindowDimensions()
  const content = React.useRef<ScrollView>(null)
  const largeText = fontScale >= 1.5

  const listings = React.useMemo(
    () => (pro ? (app.data?.services ?? []).filter((s) => s.proId === pro.id && s.active && Object.keys(s.prices).length && getTemplate(s.templateId)) : []),
    [app.data, pro],
  )
  const [step, setStep] = React.useState(1)
  React.useEffect(() => { content.current?.scrollTo({ y: 0, animated: false }) }, [step])
  const [templateId, setTemplateId] = React.useState<string | null>(null)
  const [variantId, setVariantId] = React.useState<string | null>(null)
  const [quantity, setQuantity] = React.useState(1)
  const [atHomePref, setAtHomePref] = React.useState(true)
  const [date, setDate] = React.useState(addDays(todayISO(), 1))
  const [time, setTime] = React.useState<{ startsAt: string; time: string } | null>(null)
  const [addressId, setAddressId] = React.useState<string | null>(null)
  const [estCity, setEstCity] = React.useState<string | null>(null)
  const [estDistrict, setEstDistrict] = React.useState<string | null>(null)
  const [note, setNote] = React.useState("")
  const [noteOpen, setNoteOpen] = React.useState(false)
  const [slots, setSlots] = React.useState<{ key: string; list: { startsAt: string; time: string }[] } | null>(null)
  const [slotRetry, retrySlots] = React.useReducer((n: number) => n + 1, 0)
  const [slotError, setSlotError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [doneId, setDoneId] = React.useState<string | null>(null)

  // Back from the address editor: choose the address just saved.
  useFocusEffect(
    React.useCallback(() => {
      const saved = takeLastSavedAddress()
      if (saved) setAddressId(saved)
    }, []),
  )

  // Start on the service the customer came from, or the first one listed.
  const listing = listings.find((s) => s.templateId === templateId) ?? listings.find((s) => s.templateId === params.template) ?? listings[0]
  const template = listing ? getTemplate(listing.templateId) : undefined
  const offered = template && listing ? template.variants.filter((v) => listing.prices[v.id] != null) : []
  const variant = offered.find((v) => v.id === variantId) ?? offered.find((v) => v.id === params.variant) ?? offered[0]
  const heads = variant ? serviceQuantity(variant, quantity) : 1
  const unit = variant && listing ? listing.prices[variant.id] : 0
  const servicePrice = unit * heads

  const canStudio = Boolean(pro?.studioAddress)
  const canHome = Boolean(pro?.homeService) && !template?.studioOnly
  const atHome = canHome && (atHomePref || !canStudio)
  const addresses = app.uid ? app.me.addresses : []
  const chosenId = addressId && addresses.some((a) => a.id === addressId) ? addressId : ((addresses.find((a) => a.isDefault) ?? addresses[0])?.id ?? null)
  const address = addresses.find((a) => a.id === chosenId) ?? null

  // Without a saved address: an estimate from a city and ward the customer picks.
  const city = estCity ?? (pro && CITIES.includes(pro.city) ? pro.city : (app.city ?? CITIES[0]))
  const district = estDistrict && districtsOf(city).includes(estDistrict) ? estDistrict : null
  const place = address ? { city: address.city, district: address.district } : district ? { city, district } : null
  const km = atHome && pro && place ? travelDistanceKm(pro.city, pro.district, place.city, place.district) : null
  const tooFar = atHome && pro && place ? km === null || km > pro.maxTravelKm : false

  const slotKey = [pro?.uuid, listing?.templateId, variant?.id, heads, date, atHome, atHome ? chosenId : null].join("|")
  React.useEffect(() => {
    if (!pro || !listing || !variant) return
    let live = true
    setSlotError(null)
    setSlots(null)
    fetchSlots({ proUuid: pro.uuid, templateId: listing.templateId, variantId: variant.id, quantity: heads, date, atHome, addressId: atHome ? chosenId : null })
      .then((list) => live && setSlots({ key: slotKey, list }))
      .catch((e: Error) => live && setSlotError(e.message))
    return () => {
      live = false
    }
  }, [slotKey, pro, listing, variant, heads, date, atHome, chosenId, slotRetry])
  const daySlots = slots?.key === slotKey ? slots.list : null
  const picked = time && daySlots?.some((s) => s.startsAt === time.startsAt) ? time : null

  const quoteKey = [slotKey, picked?.startsAt, app.uid, app.me?.account?.phone].join("|")
  const [quoteRetry, retryQuote] = React.useReducer((n: number) => n + 1, 0)
  const [verified, setVerified] = React.useState<{ key: string; quote?: PriceQuote & { unitPrice: number; expiresAt: string }; error?: string } | null>(null)
  const [secondDate, setSecondDate] = React.useState("")
  const [secondTime, setSecondTime] = React.useState("09:00")
  React.useEffect(() => {
    if (!app.uid || !pro || !listing || !variant || !picked || (atHome && !address)) return
    let live = true
    setVerified(null)
    void rpc<PriceQuote & { unitPrice: number; expiresAt: string }>("booking_quote", { p_pro: pro.uuid, p_template: listing.templateId, p_variant: variant.id, p_starts_at: picked.startsAt, p_at_home: atHome, p_address_id: atHome ? chosenId : null, p_quantity: heads }).then((r) => { if (live) setVerified({ key: quoteKey, ...(r.ok ? { quote: r.data } : { error: r.error }) }) }).catch(() => { if (live) setVerified({ key: quoteKey, error: "Không xác nhận được tổng tiền. Kiểm tra kết nối và thử lại." }) })
    return () => { live = false }
  }, [quoteKey, app.uid, pro, listing, variant, picked, atHome, address, chosenId, heads, quoteRetry])
  const confirmedQuote = verified?.key === quoteKey ? verified.quote : null
  const quote = confirmedQuote ?? (picked ? buildQuote({ servicePrice, atHome, distanceKm: km, urgent: isUrgent(date, picked.time) }) : null)


  // Leaving with choices made asks first; a sent booking leaves freely.
  const dirty = !doneId && (step > 1 || Boolean(time) || Boolean(note.trim()) || templateId !== null)
  React.useEffect(() => {
    if (!dirty) return
    return navigation.addListener("beforeRemove", (e) => {
      e.preventDefault()
      Alert.alert("Bỏ lịch đang đặt?", "Những gì bạn đã chọn sẽ mất.", [
        { text: "Ở lại", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ])
    })
  }, [dirty, navigation])

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
        <Stack.Screen options={{ title: "Đã gửi lịch", headerBackVisible: false, gestureEnabled: false, headerLeft: () => null, headerRight: () => null }} />
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
          <Icon name="check" size={30} color={colors.success} />
        </View>
        <Txt v="h2" center>
          Đã gửi lịch hẹn
        </Txt>
        <Txt color={colors.inkSoft} center>
          {pro.name} sẽ xem và nhận lịch trong vòng {POLICY.confirmWithinHours} giờ. Nhận xong, hai bên nhắn tin, gọi được cho nhau. Nếu không nhận, lịch tự huỷ và bạn không mất gì.
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

  const addAddress = () => router.push({ pathname: "/dia-chi/sua", params: { city, district: district ?? "" } })

  const submit = async () => {
    if (!app.uid) return router.push("/login")
    if (atHome && !address) return addAddress()
    if (!app.me.account?.phone) return router.push("/so-dien-thoai")
    if (!picked) return
    if (!confirmedQuote) return setError(verified?.error ?? "Đang kiểm tra tổng tiền.")
    const secondAt = appointmentAt(secondDate, secondTime)
    if ((variant.sessions ?? 1) > 1 && (!secondAt || secondAt <= picked.startsAt)) return setError("Chọn ngày, giờ hợp lệ cho buổi thứ hai sau buổi đầu.")
    setBusy(true)
    setError(null)
    try {
    const res = await createBooking({
      proUuid: pro.uuid,
      templateId: template.id,
      variantId: variant.id,
      startsAt: picked.startsAt,
      atHome,
      addressId: atHome ? chosenId : null,
      quantity: heads,
      note: note.trim(),
      expectedTotal: confirmedQuote.total, expectedUnit: confirmedQuote.unitPrice,
      sessions: (variant.sessions ?? 1) > 1 ? [secondAt!] : [],
    })
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    setDoneId(res.data)
    void app.refreshMe()
    // The confirmation call is time-critical; this is the moment to ask.
    void askForPushPermission(app.uid)
    } catch { setError("Không gửi được lịch. Kiểm tra kết nối và thử lại.") }
    finally { setBusy(false) }
  }

  const next = () => (step < 3 ? setStep(step + 1) : void submit())
  // Step 3 never dead-ends: signed out it leads to sign-in, without an address to the address form.
  const canNext = step === 1 ? true : step === 2 ? Boolean(picked) : Boolean(picked) && !tooFar
  const action =
    step < 3 ? "Tiếp tục" : !app.uid ? "Đăng nhập để đặt" : atHome && !address ? "Thêm địa chỉ" : !app.me.account?.phone ? "Thêm số điện thoại" : "Gửi lịch hẹn"
  const days = Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i))
  const controlScale = Math.min(fontScale, controlMetrics.maxFontSizeMultiplier)
  const slotColumns = Math.max(1, Math.min(4, Math.floor((width - gutter * 2 + SLOT_GAP) / (Math.max(76, 72 * controlScale) + SLOT_GAP))))
  const slotWidth = Math.floor((width - gutter * 2 - SLOT_GAP * (slotColumns - 1)) / slotColumns)
  const slotGroups = [
    { label: "Buổi sáng", from: 0, to: 12 },
    { label: "Buổi chiều", from: 12, to: 18 },
    { label: "Buổi tối", from: 18, to: 24 },
  ].map(group => ({ ...group, slots: daySlots?.filter(slot => Number(slot.time.slice(0, 2)) >= group.from && Number(slot.time.slice(0, 2)) < group.to) ?? [] })).filter(group => group.slots.length)
  const chooseDate = (value: string) => { setDate(value); setTime(null) }
  const priceLabel = quote ? confirmedQuote ? "Tổng tiền" : "Tạm tính" : "Giá dịch vụ"
  const displayedPrice = formatPrice(quote?.total ?? servicePrice)
  const needsQuote = Boolean(app.uid && app.me.account?.phone && picked && (!atHome || address))

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <Stack.Screen
        options={{
          title: step === 1 ? "Chọn dịch vụ" : step === 2 ? "Chọn lịch" : "Xác nhận lịch",
          gestureEnabled: !dirty,
          headerLeft: step > 1 ? () => <IconButton name="back" label="Quay lại bước trước" onPress={() => setStep(step - 1)} /> : undefined,
          headerRight: () => <IconButton name="close" label="Đóng" onPress={() => router.back()} />,
        }}
      />
      <ScrollView ref={content} style={{ flex: 1 }} contentContainerStyle={{ padding: gutter, gap: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }} accessibilityLabel={`Bước ${step} trên 3`} accessible>
          <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
            {[1, 2, 3].map(number => <View key={number} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: number <= step ? colors.accent : colors.subtleStrong }} />)}
          </View>
          <Txt v="controlMeta" color={colors.inkSoft}>{step}/3</Txt>
        </View>

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
              <Txt v="controlMeta" w={600}>
                Gói
              </Txt>
              {offered.map((v) => (
                <Option
                  key={v.id}
                  selected={v.id === variant.id}
                  title={v.label}
                  subtitle={`${formatDuration(v.durationMin)}${v.perPerson ? v.durationRule === "fixed" ? " · cả nhóm, giá mỗi người" : " · mỗi người" : ""}`}
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
                <Txt v="control" w={600}>Số người</Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <Button compact label="−" variant="secondary" size="sm" disabled={heads <= (variant.minQuantity ?? 1)} onPress={() => setQuantity(heads - 1)} />
                  <Txt v="control" w={600} tabular accessibilityLabel={`${heads} người`}>
                    {heads}
                  </Txt>
                  <Button compact label="+" variant="secondary" size="sm" disabled={heads >= (variant.maxQuantity ?? 1)} onPress={() => setQuantity(heads + 1)} />
                </View>
              </View>
            ) : null}
            {canHome && canStudio ? (
              <View style={{ gap: 8 }}>
                <Txt v="controlMeta" w={600}>
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
            {largeText ? <DateField compact label="Ngày hẹn" hideLabel value={date} onChange={chooseDate} maxDate={days[days.length - 1]} /> : <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon name="calendar" size={20} color={colors.accentDark} />
                <Txt v="control" w={600}>{formatDateLong(date)} · {date.slice(0, 4)}</Txt>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }} style={{ marginHorizontal: -gutter }}>
                {days.map((d) => {
                  const selected = d === date
                  return (
                    <Press
                      key={d}
                      haptic="select"
                      onPress={() => chooseDate(d)}
                      accessibilityState={{ selected }}
                      accessibilityLabel={d === todayISO() ? `Hôm nay, ${formatDateLong(d)}` : formatDateLong(d)}
                      style={{ width: Math.max(56, 44 * controlScale), minHeight: controlMetrics.minHeight, paddingVertical: 8, gap: 2, borderRadius: radius.md, borderWidth: 1, borderColor: selected ? colors.accentDark : colors.line, alignItems: "center", backgroundColor: selected ? colors.accent : colors.surface }}
                    >
                      <Txt v="controlMeta" color={selected ? colors.surface : colors.muted}>
                        {d === todayISO() ? "Nay" : weekdayShort(d)}
                      </Txt>
                      <Txt v="control" w={600} color={selected ? colors.surface : colors.ink}>
                        {Number(d.slice(8))}
                      </Txt>
                    </Press>
                  )
                })}
              </ScrollView>
            </View>}
            {slotError ? (
              <ErrorNote text="Không tải được giờ trống. Kiểm tra kết nối và thử lại." onRetry={retrySlots} />
            ) : !daySlots ? (
              <ActivityIndicator color={colors.accent} />
            ) : daySlots.length ? (
              <View style={{ gap: 16 }}>
                {slotGroups.map(group => <View key={group.label} style={{ gap: 8 }}>
                  <Txt v="controlMeta" w={500} color={colors.inkSoft}>{group.label}</Txt>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SLOT_GAP }}>
                    {group.slots.map((s) => {
                      const selected = picked?.startsAt === s.startsAt
                      return (
                        <Press
                          key={s.startsAt}
                          haptic="select"
                          onPress={() => setTime(s)}
                          accessibilityState={{ selected }}
                          accessibilityLabel={`${s.time}, ${formatDateLong(date)}`}
                          style={{ width: slotWidth, minHeight: controlMetrics.minHeight, paddingVertical: controlMetrics.paddingVertical, borderRadius: radius.sm, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.accentDark : colors.lineStrong, alignItems: "center", justifyContent: "center", backgroundColor: selected ? colors.accentSoft : colors.surface }}
                        >
                          <Txt v="control" w={selected ? 600 : 500} tabular color={selected ? colors.accentDark : colors.ink}>
                            {s.time}
                          </Txt>
                        </Press>
                      )
                    })}
                  </View>
                </View>)}
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
                {addresses.map((a) => (
                  <Option
                    key={a.id}
                    selected={a.id === chosenId}
                    title={a.label || a.detail}
                    subtitle={[a.detail, a.district, a.city].filter(Boolean).join(", ")}
                    onPress={() => setAddressId(a.id)}
                  />
                ))}
                {!address ? (
                  <Card style={{ gap: 12 }}>
                    <Txt color={colors.inkSoft}>
                      {app.uid ? "Chọn khu vực để xem phí di chuyển, rồi thêm địa chỉ cụ thể." : "Chọn khu vực để xem phí di chuyển. Địa chỉ cụ thể nhập sau khi đăng nhập."}
                    </Txt>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {CITIES.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          selected={c === city}
                          onPress={() => {
                            setEstCity(c)
                            setEstDistrict(null)
                          }}
                        />
                      ))}
                    </View>
                    <WardPicker
                      city={city}
                      value={district ?? ""}
                      locate
                      onChange={(choice) => {
                        setEstCity(choice.city)
                        setEstDistrict(choice.district)
                      }}
                    />
                  </Card>
                ) : null}
                {app.uid ? <Button label="Thêm địa chỉ mới" variant="secondary" size="sm" icon="plus" onPress={addAddress} /> : null}
                {tooFar ? (
                  <Txt v="meta" color={colors.danger}>
                    {pro.name} chỉ đi tối đa {pro.maxTravelKm} km{km !== null ? `; nơi này cách ${formatKm(km)}` : ", nơi này ở thành phố khác"}.
                  </Txt>
                ) : null}
              </View>
            ) : (
              <Card>
                <Txt v="controlMeta" w={600}>Tại studio</Txt>
                <Txt color={colors.inkSoft}>{pro.studioAddress}</Txt>
              </Card>
            )}
            {time && daySlots && !picked ? (
              <View style={{ gap: 8 }}>
                <Txt color={colors.danger}>Giờ {time.time} không còn trống với địa điểm này.</Txt>
                <Button label="Chọn lại giờ" variant="secondary" size="sm" onPress={() => setStep(2)} />
              </View>
            ) : null}
            {needsQuote && !confirmedQuote && (verified?.key === quoteKey && verified.error ? <ErrorNote text={verified.error} onRetry={retryQuote} /> : <Txt v="meta" color={colors.inkSoft}>Đang xác nhận tổng tiền…</Txt>)}
            {(variant.sessions ?? 1) > 1 && <View style={{ gap: 8 }}><Txt v="control" w={600}>Buổi thứ hai (đã gồm trong giá)</Txt><DateField compact label="Ngày buổi thứ hai" value={secondDate} onChange={setSecondDate} minDate={date} /><TimeField compact label="Giờ buổi thứ hai" value={secondTime} onChange={setSecondTime} /><Txt v="meta">Hệ thống giữ cả hai buổi cùng lúc và kiểm tra giờ trống khi gửi.</Txt></View>}
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
                <Line label={confirmedQuote ? "Tổng tiền" : "Tạm tính"} value={formatPrice(quote.total)} strong />
                <Txt v="meta" color={colors.muted}>
                  Thanh toán sau khi làm xong. {atHome ? "Khoảng cách ước tính theo quận. " : ""}Giá được xác nhận lại khi gửi lịch. Huỷ trước giờ hẹn không mất phí; nên huỷ trước {POLICY.freeCancelHours} tiếng để người làm kịp sắp xếp.
                </Txt>
              </Card>
            ) : null}
            {noteOpen ? <View style={{ gap: 8 }}>
              <Txt v="control" w={600}>
                Ghi chú (không bắt buộc)
              </Txt>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Mẫu bạn thích, dị ứng, chỗ đỗ xe…"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                accessibilityLabel={`Ghi chú cho ${pro.name}`}
                style={{ minHeight: 88, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
              />
            </View> : <Button compact label="Thêm ghi chú" icon="plus" variant="secondary" full onPress={() => setNoteOpen(true)} />}
            {template && needsConductNote(template.category) ? <ConductNote /> : null}
            {error ? <ErrorNote text={error} /> : null}
          </>
        ) : null}
      </ScrollView>

      <BookingBar
        compact
        inline
        keyboard={keyboard}
        title={displayedPrice}
        summaryLabel={priceLabel}
        actionOnly={largeText && step === 3}
        action={action}
        disabled={!canNext || (step === 3 && needsQuote && !confirmedQuote)}
        busy={busy}
        onPress={next}
      />
    </KeyboardAvoidingView>
  )
}

function Option({ selected, title, subtitle, right, onPress }: { selected: boolean; title: string; subtitle?: string; right?: string; onPress: () => void }) {
  const { fontScale, width } = useWindowDimensions()
  const stacked = Boolean(right) && (fontScale > 1.2 || width < 360)
  return (
    <Press
      onPress={onPress}
      haptic="select"
      accessibilityState={{ selected }}
      style={{
        flexDirection: stacked ? "column" : "row",
        alignItems: stacked ? "stretch" : "center",
        gap: 8,
        padding: 12,
        borderRadius: radius.md,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        borderWidth: 2,
        borderColor: selected ? colors.accent : "transparent",
      }}
    >
      <View style={{ flex: stacked ? undefined : 1, gap: 2 }}>
        <Txt v="control" w={600}>{title}</Txt>
        {subtitle ? (
          <Txt v="controlMeta" color={colors.inkSoft}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right ? (
        <Txt v="control" w={600} tabular>
          {right}
        </Txt>
      ) : null}
    </Press>
  )
}
