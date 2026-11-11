import { requestCopy } from "@/shared"
import * as React from "react"
import { Stack, router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router"
import { Image } from "expo-image"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View, useWindowDimensions } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { POLICY, REQUEST_GOALS, requestCategories, requestSelection, requestTemplates, requestVariants, tierLabels, serviceQuantity, isUrgent, isTooSoon, isSpa, type CategoryId } from "@/shared"
import { takeLastSavedAddress } from "@/data/addresses"
import { addDays, formatDateLong, formatDuration, formatPrice, todayISO, weekdayShort } from "@/data/format"
import { askForPushPermission } from "@/data/push"
import { setJobReferences, uploadReference } from "@/data/references"
import { postJob, requestPrice } from "@/data/requests"
import { ReferencePicker, type PickedPhoto } from "@/components/reference-photos"
import { BookingBar } from "@/components/booking-bar"
import { CategoryTiles } from "@/components/category-icon"
import { PhotoBadge, illustration } from "@/components/tiles"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { ConductNote } from "@/components/conduct"
import { needsConductNote } from "@/shared"
import { colors, fonts, gutter, radius, hairline } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** Half-hour starts, the same step the freelancers' own calendars use (as the web form). */
const TIMES = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

/**
 * Đặt theo dịch vụ, one question to a screen: what, which package and level,
 * when, where, then a summary to send. An Artist listed at or below the level
 * can take it, so a higher level reaches more of them. Every Artist who can do
 * it is told and the first to take it gets it (post_job, as app/requests/new on
 * the web). Requests are for work at the customer's place; studio visits are
 * currently closed. Coming from a service page, the first question is skipped.
 * Anyone can look through services and prices here; signing in is asked for
 * only when sending.
 */
const STEPS = ["service", "package", "when", "where", "confirm"] as const

export default function NewRequest() {
  const app = useApp()
  const keyboard = useKeyboardVisible()
  const navigation = useNavigation()
  const params = useLocalSearchParams<{ template?: string; variant?: string }>()
  const given = requestSelection(params.template, params.variant)
  const initial = given ?? requestSelection("makeup-party", "makeup")!
  const [step, setStep] = React.useState(given ? 1 : 0)
  const { width } = useWindowDimensions()
  const [category, setCategory] = React.useState<CategoryId>(initial.template.category)
  const [templateId, setTemplateId] = React.useState(initial.template.id)
  const [variantId, setVariantId] = React.useState(initial.variant.id)
  const [quantity, setQuantity] = React.useState(1)
  /** The chosen price level per person; null is "Tiêu chuẩn". */
  const [feeLimit, setFeeLimit] = React.useState<number>(POLICY.nearTravelFee)
  const [tier, setTier] = React.useState<number | null>(null)
  const [description, setDescription] = React.useState("")
  const [photos, setPhotos] = React.useState<PickedPhoto[]>([])
  const [date, setDate] = React.useState(addDays(todayISO(), 2))
  const [time, setTime] = React.useState("16:00")
  // Nothing is chosen for the customer: a service and a time are picked, not accepted by pressing "Tiếp tục".
  const [serviceChosen, setServiceChosen] = React.useState(Boolean(given))
  const [timeChosen, setTimeChosen] = React.useState(false)
  const [addressId, setAddressId] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  useFocusEffect(
    React.useCallback(() => {
      const saved = takeLastSavedAddress()
      if (saved) setAddressId(saved)
    }, []),
  )

  const dirty = !sent && (step > 1 || timeChosen || Boolean(description.trim()) || photos.length > 0)
  const leaving = React.useRef(false)
  React.useEffect(() => {
    if (!dirty) return
    return navigation.addListener("beforeRemove", (e) => {
      if (leaving.current) return
      e.preventDefault()
      Alert.alert("Bỏ đơn đang đặt?", undefined, [
        { text: "Ở lại", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ])
    })
  }, [dirty, navigation])

  const close = <IconButton name="close" label="Đóng" onPress={() => router.back()} />
  const back = <IconButton name="back" label="Quay lại" onPress={() => setStep((n) => n - 1)} />
  const templates = requestTemplates(category)
  const tpl = templates.find((t) => t.id === templateId) ?? templates[0]
  const variant = requestSelection(tpl.id, variantId)!.variant
  const heads = serviceQuantity(variant, quantity)
  const price = requestPrice(variant, tier)
  const labels = tierLabels(variant)
  const addresses = app.me.addresses
  const chosen = addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0] ?? null
  const days = Array.from({ length: 21 }, (_, i) => addDays(todayISO(), i))
  const maxTotal = price * heads + feeLimit + (isUrgent(date, time) ? POLICY.urgentFee : 0)
  const valid = (variant.sessions ?? 1) === 1 && !tpl.studioOnly && date >= todayISO()
  // Said before sending, not discovered after a long wait. Hours, distance and
  // the partner's wallet are checked when it is posted (jobs.notified).
  const area = chosen?.city ?? app.city
  const nobodyHere =
    Boolean(app.data) &&
    !app.data?.pros.some(
      (p) =>
        !isSpa(p) && p.homeService && p.published &&
        p.acceptingJobs &&
        !app.blocked.has(p.uuid) &&
        (!area || p.city === area) &&
        app.data?.services.some((s) => s.proId === p.id && s.templateId === tpl.id && s.active && s.prices[variant.id] != null && s.prices[variant.id] <= price),
    )

  const name = STEPS[step]
  const openTimes = TIMES.filter((t) => !isTooSoon(date, t))
  const canContinue =
    name === "package" ? (variant.sessions ?? 1) === 1 && !tpl.studioOnly : name === "service" ? serviceChosen && !tpl.studioOnly : name === "when" ? timeChosen && openTimes.includes(time) : true
  const timeWidth = Math.floor((width - gutter * 2 - 20) / 3)

  const pickCategory = (c: CategoryId) => {
    setCategory(c)
    const first = requestTemplates(c)[0]
    pickVariant(first.id, requestSelection(first.id)!.variant.id)
  }
  // A different package has different levels: start again from its "Tiêu chuẩn" one.
  const pickVariant = (template: string, id: string) => {
    setServiceChosen(true)
    setTemplateId(template)
    setVariantId(id)
    setTier(null)
    setQuantity(1)
  }

  const submitting = React.useRef(false)
  const submit = async () => {
    if (submitting.current) return
    if (!openTimes.includes(time)) return setError("Hãy chọn giờ còn đủ thời gian để Artist nhận và di chuyển.")
    if (!app.uid) return router.push("/login")
    if (!chosen) return router.push({ pathname: "/dia-chi/sua", params: { city: app.city ?? "" } })
    if (!app.me.account?.phone) return router.push("/so-dien-thoai")
    submitting.current = true
    setBusy(true)
    setError(null)
    // Photos go up first, so partners told about the order can already see them.
    const paths: string[] = []
    try {
      for (const p of photos) paths.push(await uploadReference(app.uid, p))
    } catch (e) {
      submitting.current = false
      setBusy(false)
      haptic.error()
      return setError(`Chưa tải được ảnh mẫu: ${e instanceof Error ? e.message : "lỗi kết nối"}`)
    }
    const res = await postJob({
      templateId: tpl.id,
      variantId: variant.id,
      date,
      time,
      atHome: true,
      addressId: chosen.id,
      quantity: heads,
      description: description.trim(),
      price,
      maxTotal,
    }).catch(() => ({ ok: false as const, error: "Chưa gửi được yêu cầu. Kiểm tra kết nối và thử lại." }))
    if (!res.ok) {
      submitting.current = false
      setBusy(false)
      haptic.error()
      return setError(res.error)
    }
    if (paths.length) {
      const sentPhotos = await setJobReferences(res.data, paths).catch(() => ({ ok: false as const, error: "Kiểm tra kết nối rồi thử lại." }))
      if (!sentPhotos.ok) Alert.alert("Đã gửi đơn", `Nhưng chưa gắn được ảnh mẫu: ${sentPhotos.error}`)
    }
    submitting.current = false
    setBusy(false)
    haptic.success()
    setSent(true)
    leaving.current = true
    // The waiting screen promises a notification when someone takes it.
    void askForPushPermission(app.uid)
    // A card screen, opened after this modal has gone.
    router.dismiss()
    router.push({ pathname: "/yeu-cau/[id]", params: { id: res.data } })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <Stack.Screen options={{ gestureEnabled: !dirty, headerRight: () => close, headerLeft: step > 0 ? () => back : undefined }} />
      <View style={{ height: 3, marginHorizontal: gutter, borderRadius: 2, backgroundColor: colors.line }} accessibilityLabel={`Bước ${step + 1} trên ${STEPS.length}`}>
        <View style={{ height: 3, width: `${((step + 1) / (STEPS.length)) * 100}%`, borderRadius: 2, backgroundColor: colors.accent }} />
      </View>
      <ScrollView key={name} contentContainerStyle={{ padding: gutter, paddingTop: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Animated.View entering={FadeIn.duration(220)} style={{ gap: 32 }}>
          {name === "service" ? (
            <>
              <Question title={requestCopy.vi.goalPrompt} />
              <Txt color={colors.inkSoft}>{requestCopy.vi.noArtist}</Txt>
              <View style={{ gap: 8 }}>
                {REQUEST_GOALS.map((g) => <Option key={g.templateId} title={g.label} selected={false} onPress={() => {
                  const choice = requestSelection(g.templateId, g.variantId)
                  if (choice) { setCategory(choice.template.category); pickVariant(choice.template.id, choice.variant.id); setStep(1) }
                }} />)}
              </View>
              <CategoryTiles items={requestCategories.map((c) => ({ id: c.id, label: c.label }))} value={category} onChange={(id) => pickCategory(id as CategoryId)} />
              <View style={{ gap: 12 }}>
                {templates.filter((t) => !t.addon).map((t) => (
                  <Option key={t.id} title={t.name} selected={serviceChosen && t.id === tpl.id} onPress={() => pickVariant(t.id, requestSelection(t.id)!.variant.id)} />
                ))}
              </View>
              {tpl.studioOnly ? (
                <Txt v="meta" color={colors.warning}>
                  Dịch vụ cần thiết bị tại studio hiện chưa mở. Hãy chọn dịch vụ làm tận nơi.
                </Txt>
              ) : null}
            </>
          ) : null}

          {name === "package" ? (
            <>
              <Press onPress={() => setStep(0)} accessibilityLabel={`${tpl.name}. Đổi dịch vụ`} style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface }}>
                <View style={{ height: 150 }}>
                  <Image source={{ uri: illustration(category, 1) }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
                  <PhotoBadge text="Ảnh minh hoạ" position="tl" />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="title">{tpl.name}</Txt>
                    {tpl.includes.length ? (
                      <Txt v="meta" color={colors.muted} numberOfLines={2}>
                        {tpl.includes.join(" · ")}
                      </Txt>
                    ) : null}
                  </View>
                  <Txt v="meta" w={600} color={colors.accentDark}>
                    Đổi
                  </Txt>
                </View>
              </Press>
              <View style={{ gap: 12 }}>
                <Txt v="title">Chọn gói</Txt>
                {requestVariants(tpl).map((v) => (
                  <Option key={v.id} title={v.label} note={formatDuration(v.durationMin)} selected={v.id === variant.id} onPress={() => pickVariant(tpl.id, v.id)} />
                ))}
                {variant.perPerson ? (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
                    <Txt w={600}>Số người</Txt>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <Button label="−" variant="secondary" size="sm" disabled={heads <= (variant.minQuantity ?? 1)} onPress={() => setQuantity(heads - 1)} />
                      <Txt v="lead" w={700} tabular accessibilityLabel={`${heads} người`}>
                        {heads}
                      </Txt>
                      <Button label="+" variant="secondary" size="sm" disabled={heads >= (variant.maxQuantity ?? 1)} onPress={() => setQuantity(heads + 1)} />
                    </View>
                  </View>
                ) : null}
                {(variant.sessions ?? 1) > 1 ? <ErrorNote text="Gói nhiều buổi: đặt trực tiếp từ hồ sơ Artist để chọn đủ lịch." /> : null}
              </View>
              <View style={{ gap: 12 }} accessibilityRole="radiogroup">
                <View style={{ gap: 2 }}>
                  <Txt v="title">Chọn mức giá</Txt>
                  <Txt v="meta" color={colors.muted}>
                    Mức càng cao, càng nhiều Artist nhận được.
                  </Txt>
                </View>
                {variant.tiers.map((t, i) => (
                  <Option key={t} title={labels[i]} trailing={formatPrice(t)} selected={t === price} onPress={() => setTier(t)} />
                ))}
              </View>
            </>
          ) : null}

          {name === "when" ? (
            <>
              <Question title="Khi nào bạn muốn làm?" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: gutter }} style={{ marginHorizontal: -gutter }}>
                {days.map((d) => {
                  const selected = d === date
                  return (
                    <Press
                      key={d}
                      haptic="select"
                      onPress={() => setDate(d)}
                      accessibilityState={{ selected }}
                      accessibilityLabel={formatDateLong(d)}
                      style={{ width: 68, paddingVertical: 14, gap: 4, borderRadius: radius.md, alignItems: "center", backgroundColor: selected ? colors.accent : colors.surface }}
                    >
                      <Txt v="meta" color={selected ? colors.surface : colors.muted}>
                        {d === todayISO() ? "Nay" : weekdayShort(d)}
                      </Txt>
                      <Txt v="title" tabular color={selected ? colors.surface : colors.ink}>
                        {Number(d.slice(8))}
                      </Txt>
                    </Press>
                  )
                })}
              </ScrollView>
              {[
                { label: "Sáng", from: "00:00", to: "12:00" },
                { label: "Chiều", from: "12:00", to: "18:00" },
                { label: "Tối", from: "18:00", to: "24:00" },
              ].map((part) => {
                const times = openTimes.filter((t) => t >= part.from && t < part.to)
                if (!times.length) return null
                return (
                  <View key={part.label} style={{ gap: 12 }}>
                    <Txt w={600} color={colors.inkSoft}>
                      {part.label}
                    </Txt>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      {times.map((t) => {
                        const selected = timeChosen && t === time
                        return (
                          <Press
                            key={t}
                            haptic="select"
                            onPress={() => { setTime(t); setTimeChosen(true) }}
                            accessibilityState={{ selected }}
                            style={{ width: timeWidth, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: selected ? colors.accent : colors.surface }}
                          >
                            <Txt w={600} tabular color={selected ? colors.surface : colors.ink}>
                              {t}
                            </Txt>
                          </Press>
                        )
                      })}
                    </View>
                  </View>
                )
              })}
            </>
          ) : null}

          {name === "where" ? (
            <>
              <Question title="Artist đến đâu?" />
              <View style={{ gap: 12 }}>
                {addresses.map((a) => (
                  <Option key={a.id} title={a.label || "Địa chỉ"} note={[a.detail, a.district, a.city].filter(Boolean).join(", ")} selected={a.id === chosen?.id} onPress={() => setAddressId(a.id)} />
                ))}
                {app.uid ? (
                  <Button
                    label={addresses.length ? "Thêm địa chỉ khác" : "Thêm địa chỉ"}
                    variant={addresses.length ? "secondary" : "primary"}
                    icon="plus"
                    full
                    onPress={() => router.push({ pathname: "/dia-chi/sua", params: { city: app.city ?? "" } })}
                  />
                ) : (
                  <Txt color={colors.inkSoft}>Bạn thêm địa chỉ sau khi đăng nhập, ở bước gửi đơn.</Txt>
                )}
              </View>
              <View style={{ gap: 12 }}>
                <View style={{ gap: 2 }}>
                  <Txt v="title">Artist ở xa tới đâu?</Txt>
                  <Txt v="meta" color={colors.muted}>
                    Xa hơn thì phí di chuyển cao hơn, nhưng nhiều Artist nhận được đơn hơn.
                  </Txt>
                </View>
                {[POLICY.nearTravelFee, POLICY.travelFeeCap].map((n) => (
                  <Option key={n} title={n === POLICY.nearTravelFee ? `Gần tôi, dưới ${POLICY.nearTravelKm} km` : "Xa hơn cũng được"} trailing={n === POLICY.nearTravelFee ? formatPrice(n) : `tối đa ${formatPrice(n)}`} selected={n === feeLimit} onPress={() => setFeeLimit(n)} />
                ))}
              </View>
            </>
          ) : null}

          {name === "confirm" ? (
            <>
              <Question title="Xem lại đơn của bạn" />
              <View style={{ borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: 16 }}>
                <Summary label="Dịch vụ" value={`${tpl.name}, ${variant.label}${heads > 1 ? `, ${heads} người` : ""}`} onEdit={() => setStep(1)} />
                <Summary label="Mức giá" value={`${labels[variant.tiers.indexOf(price)] ?? ""} · ${formatPrice(price * heads)}`} onEdit={() => setStep(1)} />
                <Summary label="Thời gian" value={`${time}, ${formatDateLong(date)}`} onEdit={() => setStep(2)} />
                <Summary label="Địa chỉ" value={chosen ? [chosen.detail, chosen.district, chosen.city].filter(Boolean).join(", ") : "Thêm ở bước gửi đơn"} onEdit={() => setStep(3)} last />
              </View>
              {nobodyHere ? (
                <View style={{ padding: 16, borderRadius: radius.md, backgroundColor: colors.highlightSoft }}>
                  <Txt v="meta">Khu vực này chưa có Artist nhận dịch vụ này ở mức giá đã chọn, có thể phải chờ lâu.</Txt>
                </View>
              ) : null}
              <View style={{ gap: 12 }}>
                <Txt v="title">Thêm cho Artist</Txt>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={300}
                  placeholder="VD: da hơi dầu, muốn makeup trong trẻo… (không bắt buộc)"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Mô tả thêm"
                  style={{ minHeight: 96, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, fontFamily: fonts[400], fontSize: 17, color: colors.ink, textAlignVertical: "top" }}
                />
                <Txt v="meta" color={colors.muted}>{requestCopy.vi.privacy}</Txt>
                <ReferencePicker value={photos} onChange={setPhotos} disabled={busy} />
                <Txt v="meta" color={colors.muted}>
                  Tối đa 3 ảnh kiểu bạn muốn. Artist xem trước khi nhận đơn.
                </Txt>
              </View>
              {needsConductNote(category) ? <ConductNote /> : null}
              <Txt v="meta" color={colors.muted}>
                Tổng tối đa {formatPrice(maxTotal)}, đã gồm phí di chuyển và phí gấp nếu có. Trả tiền mặt hoặc chuyển khoản cho Artist sau khi xong, không cần cọc.
              </Txt>
              {error ? <ErrorNote text={error} /> : null}
            </>
          ) : null}
        </Animated.View>
      </ScrollView>
      <BookingBar
        inline
        keyboard={keyboard}
        title={serviceChosen ? formatPrice(price * heads) : "Chọn dịch vụ"}
        note={!serviceChosen ? "Giá hiện khi bạn chọn" : heads > 1 ? `${formatPrice(price)} × ${heads} người, chưa gồm phí di chuyển` : "Chưa gồm phí di chuyển"}
        action={name !== "confirm" ? (name === "when" && !timeChosen ? "Chọn giờ" : "Tiếp tục") : busy ? "Đang gửi…" : !app.uid ? "Đăng nhập để đặt" : !chosen ? "Thêm địa chỉ" : !app.me.account?.phone ? "Thêm số điện thoại" : "Tìm Artist"}
        disabled={name === "confirm" ? !valid : !canContinue}
        busy={busy}
        onPress={() => (name === "confirm" ? void submit() : setStep((n) => n + 1))}
      />
    </KeyboardAvoidingView>
  )
}

function Question({ title }: { title: string }) {
  return <Txt v="h1">{title}</Txt>
}

/** One choice on its own row, tall enough to breathe; the ring says which is chosen. */
function Option({ title, note, trailing, selected, onPress }: { title: string; note?: string; trailing?: string; selected: boolean; onPress: () => void }) {
  return (
    <Press
      haptic="select"
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, minHeight: 64, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 2, borderColor: selected ? colors.accent : colors.surface }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt w={600}>{title}</Txt>
        {note ? (
          <Txt v="meta" color={colors.inkSoft}>
            {note}
          </Txt>
        ) : null}
      </View>
      {trailing ? (
        <Txt w={700} tabular color={selected ? colors.accentDark : colors.ink}>
          {trailing}
        </Txt>
      ) : null}
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: selected ? 0 : 1.5, borderColor: colors.line, backgroundColor: selected ? colors.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
        {selected ? <Icon name="check" size={13} color={colors.surface} /> : null}
      </View>
    </Press>
  )
}

function Summary({ label, value, onEdit, last }: { label: string; value: string; onEdit: () => void; last?: boolean }) {
  return (
    <Press onPress={onEdit} accessibilityLabel={`${label}: ${value}. Sửa`} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 14, borderBottomWidth: last ? 0 : hairline, borderBottomColor: colors.line }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="meta" color={colors.muted}>
          {label}
        </Txt>
        <Txt w={500}>{value}</Txt>
      </View>
      <Icon name="right" size={13} color={colors.muted} />
    </Press>
  )
}
