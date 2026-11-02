import * as React from "react"
import { Stack, router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { CATEGORIES, POLICY, getTemplate, templatesByCategory, tierLabels, serviceQuantity, isUrgent, type CategoryId } from "@/shared"
import { takeLastSavedAddress } from "@/data/addresses"
import { addDays, formatDateLong, formatDuration, formatPrice, todayISO, weekdayShort } from "@/data/format"
import { setJobReferences, uploadReference } from "@/data/references"
import { postJob, requestPrice } from "@/data/requests"
import { ReferencePicker, type PickedPhoto } from "@/components/reference-photos"
import { BookingBar } from "@/components/booking-bar"
import { CategoryTiles } from "@/components/category-icon"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { ConductNote } from "@/components/conduct"
import { needsConductNote } from "@/shared"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Chip, ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** Half-hour starts, the same step the freelancers' own calendars use (as the web form). */
const TIMES = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

/**
 * Đặt theo dịch vụ: what, when, where, at one of the option's fixed price
 * levels (a higher level is usually taken sooner). Every Artist who can do it
 * is told and the first to take it gets it. The same post_job RPC as
 * app/requests/new on the web. Requests are for work at the customer's place;
 * studio visits are currently closed. Coming from a service page, the service
 * is already chosen and can be changed. Anyone can look through services and
 * prices here; signing in is asked for only when sending.
 */
export default function NewRequest() {
  const app = useApp()
  const keyboard = useKeyboardVisible()
  const navigation = useNavigation()
  const params = useLocalSearchParams<{ template?: string }>()
  const given = React.useMemo(() => {
    const t = params.template ? getTemplate(params.template) : undefined
    return t && !t.addon ? t : undefined
  }, [params.template])
  const [picking, setPicking] = React.useState(!given)
  const [category, setCategory] = React.useState<CategoryId>(given?.category ?? "nail")
  const [templateId, setTemplateId] = React.useState(given?.id ?? templatesByCategory("nail")[0].id)
  const [variantId, setVariantId] = React.useState((given ?? templatesByCategory("nail")[0]).variants[0].id)
  const [quantity, setQuantity] = React.useState(1)
  /** The chosen price level per person; null is "Tiêu chuẩn". */
  const [feeLimit, setFeeLimit] = React.useState<number>(POLICY.nearTravelFee)
  const [tier, setTier] = React.useState<number | null>(null)
  const [description, setDescription] = React.useState("")
  const [photos, setPhotos] = React.useState<PickedPhoto[]>([])
  const [date, setDate] = React.useState(addDays(todayISO(), 2))
  const [time, setTime] = React.useState("16:00")
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

  const dirty = !sent && (Boolean(description.trim()) || photos.length > 0)
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
  const templates = templatesByCategory(category)
  const tpl = templates.find((t) => t.id === templateId) ?? templates[0]
  const variant = tpl.variants.find((v) => v.id === variantId) ?? tpl.variants[0]
  const heads = serviceQuantity(variant, quantity)
  const price = requestPrice(variant, tier)
  const labels = tierLabels(variant)
  const addresses = app.me.addresses
  const chosen = addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0] ?? null
  const days = Array.from({ length: 21 }, (_, i) => addDays(todayISO(), i))
  const maxTotal = price * heads + feeLimit + (isUrgent(date, time) ? POLICY.urgentFee : 0)
  const valid = (variant.sessions ?? 1) === 1 && !tpl.studioOnly && date >= todayISO()
  // Said before sending, not discovered after a long wait.
  const area = chosen?.city ?? app.city
  const nobodyHere =
    Boolean(app.data) &&
    !app.data?.pros.some((p) => p.published && p.acceptingJobs && !app.blocked.has(p.uuid) && (!area || p.city === area) && app.data?.services.some((s) => s.proId === p.id && s.templateId === tpl.id && s.active))

  const pickCategory = (c: CategoryId) => {
    setCategory(c)
    const first = templatesByCategory(c)[0]
    pickVariant(first.id, first.variants[0].id)
  }
  // A different package has different levels: start again from its "Tiêu chuẩn" one.
  const pickVariant = (template: string, id: string) => {
    setTemplateId(template)
    setVariantId(id)
    setTier(null)
    setQuantity(1)
  }

  const submit = async () => {
    if (!app.uid) return router.push("/login")
    if (!chosen) return router.push({ pathname: "/dia-chi/sua", params: { city: app.city ?? "" } })
    if (!app.me.account?.phone) return router.push("/so-dien-thoai")
    setBusy(true)
    setError(null)
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
    })
    if (!res.ok) {
      setBusy(false)
      haptic.error()
      return setError(res.error)
    }
    // The request is up; its photos follow. If they fail, it still stands and says so.
    if (photos.length && app.uid) {
      try {
        const paths: string[] = []
        for (const p of photos) paths.push(await uploadReference(app.uid, p))
        const sentPhotos = await setJobReferences(res.data, paths)
        if (!sentPhotos.ok) throw new Error(sentPhotos.error)
      } catch (e) {
        Alert.alert("Đã gửi đơn", `Nhưng chưa gửi được ảnh mẫu: ${e instanceof Error ? e.message : "lỗi kết nối"}`)
      }
    }
    setBusy(false)
    haptic.success()
    setSent(true)
    leaving.current = true
    router.replace({ pathname: "/yeu-cau/[id]", params: { id: res.data } })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <Stack.Screen options={{ gestureEnabled: !dirty, headerRight: () => close }} />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 22 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {picking ? (
          <>
            <Group title="Bạn cần làm gì?">
              <CategoryTiles items={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} value={category} onChange={(id) => pickCategory(id as CategoryId)} />
            </Group>
            <Group title="Dịch vụ">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {templates.filter((t) => !t.addon).map((t) => (
                  <Chip key={t.id} label={t.name} selected={t.id === tpl.id} onPress={() => pickVariant(t.id, t.variants[0].id)} />
                ))}
              </View>
              {tpl.studioOnly ? (
                <Txt v="meta" color={colors.warning}>
                  Dịch vụ cần thiết bị tại studio hiện chưa mở. Hãy chọn dịch vụ làm tận nơi.
                </Txt>
              ) : null}
            </Group>
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6, paddingLeft: 14, paddingRight: 6, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
            <View style={{ flex: 1, gap: 1 }}>
              <Txt w={600}>{tpl.name}</Txt>
              <Txt v="meta" color={colors.muted}>
                {CATEGORIES.find((c) => c.id === category)?.label}
              </Txt>
            </View>
            <Press onPress={() => setPicking(true)} accessibilityRole="button" accessibilityLabel="Đổi dịch vụ" style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }}>
              <Txt v="meta" w={600} color={colors.accentDark}>
                Đổi
              </Txt>
            </Press>
          </View>
        )}

        <Group title="Gói">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {tpl.variants.map((v) => {
              const selected = v.id === variant.id
              return (
                <Press
                  key={v.id}
                  haptic="select"
                  onPress={() => pickVariant(tpl.id, v.id)}
                  accessibilityState={{ selected }}
                  style={{ flexGrow: 1, flexBasis: "45%", padding: 12, borderRadius: radius.md, backgroundColor: selected ? colors.accentSoft : colors.surface, borderWidth: 1.5, borderColor: selected ? colors.accent : colors.line, gap: 2 }}
                >
                  <Txt w={600} color={selected ? colors.accentDark : colors.ink}>
                    {v.label}
                  </Txt>
                  <Txt v="meta" color={colors.inkSoft}>
                    {formatDuration(v.durationMin)}
                  </Txt>
                </Press>
              )
            })}
          </View>
          {variant.perPerson ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
          {tpl.includes.length ? (
            <Txt v="meta" color={colors.muted}>
              Bao gồm: {tpl.includes.join(" · ")}
            </Txt>
          ) : null}
        </Group>

        <Group title="Mức giá" note="Mức cao thường có người nhận nhanh hơn.">
          <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
            {variant.tiers.map((t, i) => {
              const selected = t === price
              return (
                <Press
                  key={t}
                  haptic="select"
                  onPress={() => setTier(t)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={{ flex: 1, alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.md, backgroundColor: selected ? colors.accent : colors.surface, borderWidth: 1, borderColor: selected ? colors.accent : colors.line, gap: 2 }}
                >
                  <Txt v="meta" center color={selected ? colors.surface : colors.inkSoft} numberOfLines={1} adjustsFontSizeToFit>
                    {labels[i]}
                  </Txt>
                  <Txt w={700} tabular color={selected ? colors.surface : colors.ink}>
                    {formatPrice(t)}
                  </Txt>
                </Press>
              )
            })}
          </View>
        </Group>

        <Group title="Khi nào?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }} style={{ marginHorizontal: -gutter }}>
            {days.map((d) => {
              const selected = d === date
              return (
                <Press
                  key={d}
                  haptic="select"
                  onPress={() => setDate(d)}
                  accessibilityState={{ selected }}
                  accessibilityLabel={formatDateLong(d)}
                  style={{ width: 64, paddingVertical: 8, borderRadius: radius.md, alignItems: "center", backgroundColor: selected ? colors.accent : colors.surface, borderWidth: 1, borderColor: selected ? colors.accent : colors.line }}
                >
                  <Txt v="meta" color={selected ? colors.surface : colors.muted}>
                    {d === todayISO() ? "Nay" : weekdayShort(d)}
                  </Txt>
                  <Txt v="lead" w={600} tabular color={selected ? colors.surface : colors.ink}>
                    {Number(d.slice(8))}/{Number(d.slice(5, 7))}
                  </Txt>
                </Press>
              )
            })}
          </ScrollView>
          {/* Opens at the chosen time, not at 08:00 with the selection out of sight. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentOffset={{ x: Math.max(0, TIMES.indexOf(time) - 1) * 78, y: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }} style={{ marginHorizontal: -gutter }}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} selected={t === time} onPress={() => setTime(t)} />
            ))}
          </ScrollView>
        </Group>

        <Group title="Làm ở đâu?">
          {addresses.map((a) => {
            const selected = a.id === chosen?.id
            return (
              <Press
                key={a.id}
                haptic="select"
                onPress={() => setAddressId(a.id)}
                accessibilityState={{ selected }}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: selected ? colors.accentSoft : colors.surface, borderWidth: 1.5, borderColor: selected ? colors.accent : colors.line }}
              >
                <Icon name="pin" size={18} color={colors.accent} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt w={600}>{a.label || "Địa chỉ"}</Txt>
                  <Txt v="meta" color={colors.inkSoft}>
                    {[a.detail, a.district, a.city].filter(Boolean).join(", ")}
                  </Txt>
                </View>
              </Press>
            )
          })}
          {app.uid ? (
            <Button
              label={addresses.length ? "Thêm địa chỉ khác" : "Thêm địa chỉ"}
              variant={addresses.length ? "secondary" : "primary"}
              size="sm"
              icon="plus"
              onPress={() => router.push({ pathname: "/dia-chi/sua", params: { city: app.city ?? "" } })}
            />
          ) : (
            <Txt v="meta" color={colors.inkSoft}>
              Bạn thêm địa chỉ sau khi đăng nhập, ở bước gửi đơn.
            </Txt>
          )}
        </Group>

        {nobodyHere ? (
          <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: colors.highlightSoft }}>
            <Txt v="meta">Khu vực này chưa có Artist nhận dịch vụ này, có thể phải chờ lâu.</Txt>
          </View>
        ) : null}

        <Group title="Mô tả thêm (không bắt buộc)">
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={300}
            placeholder="VD: da hơi dầu, muốn makeup trong trẻo, bền đến tối…"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Mô tả thêm"
            style={{ minHeight: 88, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, fontFamily: fonts[400], fontSize: 16, color: colors.ink, textAlignVertical: "top" }}
          />
        </Group>

        <Group title="Ảnh mẫu (không bắt buộc)" note="Tối đa 3 ảnh kiểu bạn muốn. Artist xem trước khi nhận đơn.">
          <ReferencePicker value={photos} onChange={setPhotos} disabled={busy} />
        </Group>

        <Group title="Phí di chuyển tối đa đồng ý">
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[POLICY.nearTravelFee, POLICY.travelFeeCap].map((n) => (
              <Chip key={n} label={formatPrice(n)} selected={n === feeLimit} onPress={() => setFeeLimit(n)} />
            ))}
          </View>
          <Txt v="meta" color={colors.inkSoft}>
            Tổng tối đa {formatPrice(maxTotal)} (đã gồm phí gấp nếu có).
          </Txt>
        </Group>

        <Txt v="meta" color={colors.muted}>
          Trả tiền mặt hoặc chuyển khoản cho Artist sau khi xong, không cần cọc. Làm tại nhà có phí di chuyển theo khoảng cách; bắt đầu trong {POLICY.urgentWithinHours} giờ tới có thêm phí đặt gấp. Các khoản phí hiện rõ trước khi xác nhận lịch.
        </Txt>
        {(variant.sessions ?? 1) > 1 && <ErrorNote text="Gói nhiều buổi: đặt trực tiếp từ hồ sơ Artist để chọn đủ lịch." />}
        {needsConductNote(category) ? <ConductNote /> : null}
        {error ? <ErrorNote text={error} /> : null}
      </ScrollView>
      <BookingBar
        inline
        keyboard={keyboard}
        title={formatPrice(price * heads)}
        note={heads > 1 ? `${formatPrice(price)} × ${heads} người, chưa gồm phí di chuyển` : "Chưa gồm phí di chuyển"}
        action={busy ? "Đang gửi…" : !app.uid ? "Đăng nhập để đặt" : !chosen ? "Thêm địa chỉ" : "Tìm Artist"}
        disabled={!valid}
        busy={busy}
        onPress={() => void submit()}
      />
    </KeyboardAvoidingView>
  )
}

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <Txt v="title">{title}</Txt>
        {note ? (
          <Txt v="meta" color={colors.muted}>
            {note}
          </Txt>
        ) : null}
      </View>
      {children}
    </View>
  )
}
