import * as React from "react"
import { Stack, router, useFocusEffect, useNavigation } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CATEGORIES, POLICY, templatesByCategory, type CategoryId } from "@/shared"
import { takeLastSavedAddress } from "@/data/addresses"
import { addDays, formatDateLong, formatDuration, formatPrice, todayISO, weekdayShort } from "@/data/format"
import { postJob } from "@/data/requests"
import { CategoryTiles } from "@/components/category-icon"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Chip, EmptyState, ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

/** Half-hour starts, the same step the freelancers' own calendars use (as the web form). */
const TIMES = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

/**
 * Đăng yêu cầu: what, when, where; freelancers nearby send quotes. The same
 * form and the same post_job RPC as app/requests/new on the web. Requests
 * are for work at the customer's place; studio work is booked directly.
 */
export default function NewRequest() {
  const app = useApp()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardVisible()
  const navigation = useNavigation()
  const [category, setCategory] = React.useState<CategoryId>("nail")
  const [templateId, setTemplateId] = React.useState(templatesByCategory("nail")[0].id)
  const [variantId, setVariantId] = React.useState(templatesByCategory("nail")[0].variants[0].id)
  const [description, setDescription] = React.useState("")
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

  const dirty = !sent && (Boolean(description.trim()) || category !== "nail")
  const leaving = React.useRef(false)
  React.useEffect(() => {
    if (!dirty) return
    return navigation.addListener("beforeRemove", (e) => {
      if (leaving.current) return
      e.preventDefault()
      Alert.alert("Bỏ yêu cầu đang viết?", undefined, [
        { text: "Ở lại", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ])
    })
  }, [dirty, navigation])

  const close = <IconButton name="close" label="Đóng" onPress={() => router.back()} />
  if (!app.uid) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter, justifyContent: "center" }}>
        <Stack.Screen options={{ headerRight: () => close }} />
        <EmptyState
          title="Đăng yêu cầu, nhận báo giá"
          text="Mô tả bạn cần gì, khi nào, ở đâu; người làm gần bạn gửi báo giá, bạn chọn. Không mất phí."
          action="Đăng nhập để đăng"
          onAction={() => router.push("/login")}
        />
      </View>
    )
  }

  const templates = templatesByCategory(category)
  const tpl = templates.find((t) => t.id === templateId) ?? templates[0]
  const variant = tpl.variants.find((v) => v.id === variantId) ?? tpl.variants[0]
  const addresses = app.me.addresses
  const chosen = addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0] ?? null
  const days = Array.from({ length: 21 }, (_, i) => addDays(todayISO(), i))
  const valid = !tpl.studioOnly && Boolean(chosen) && date >= todayISO()

  const pickCategory = (c: CategoryId) => {
    setCategory(c)
    const first = templatesByCategory(c)[0]
    setTemplateId(first.id)
    setVariantId(first.variants[0].id)
  }

  const submit = async () => {
    if (!chosen) return
    if (!app.me.account?.phone) return router.push("/so-dien-thoai")
    setBusy(true)
    setError(null)
    const res = await postJob({ templateId: tpl.id, variantId: variant.id, date, time, atHome: true, addressId: chosen.id, description: description.trim() })
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    setSent(true)
    leaving.current = true
    router.replace({ pathname: "/yeu-cau/[id]", params: { id: res.data } })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <Stack.Screen options={{ gestureEnabled: !dirty, headerRight: () => close }} />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 22 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Txt color={colors.inkSoft}>Người làm gần bạn báo giá trong khung giá của 360dep. Bạn so sánh hồ sơ, đánh giá rồi chọn. Không mất phí đăng.</Txt>

        <Group title="Bạn cần làm gì?">
          <CategoryTiles items={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} value={category} onChange={(id) => pickCategory(id as CategoryId)} />
        </Group>

        <Group title="Dịch vụ">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {templates.map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                selected={t.id === tpl.id}
                onPress={() => {
                  setTemplateId(t.id)
                  setVariantId(t.variants[0].id)
                }}
              />
            ))}
          </View>
          {tpl.studioOnly ? (
            <Txt v="meta" color={colors.warning}>
              Dịch vụ này cần thiết bị tại studio: hãy đặt lịch trực tiếp với người làm.
            </Txt>
          ) : null}
        </Group>

        <Group title="Gói">
          {tpl.variants.map((v) => {
            const selected = v.id === variant.id
            return (
              <Press
                key={v.id}
                haptic="select"
                onPress={() => setVariantId(v.id)}
                accessibilityState={{ selected }}
                style={{ padding: 14, borderRadius: radius.md, backgroundColor: selected ? colors.accentSoft : colors.surface, borderWidth: 2, borderColor: selected ? colors.accent : "transparent", gap: 2 }}
              >
                <Txt w={selected ? 700 : 600}>
                  {v.label} · {formatDuration(v.durationMin)}
                </Txt>
                <Txt v="meta" color={colors.inkSoft}>
                  Khung giá {formatPrice(v.minPrice)} – {formatPrice(v.maxPrice)}
                </Txt>
              </Press>
            )
          })}
          {tpl.includes.length ? (
            <Txt v="meta" color={colors.muted}>
              Bao gồm: {tpl.includes.join(" · ")}
            </Txt>
          ) : null}
        </Group>

        <Group title="Mô tả thêm (không bắt buộc)">
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={300}
            placeholder="VD: da hơi dầu, muốn makeup trong trẻo, bền đến tối…"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Mô tả thêm"
            style={{ minHeight: 88, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink, textAlignVertical: "top" }}
          />
        </Group>

        <Group title="Ngày">
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
          </ScrollView>
        </Group>

        <Group title="Giờ bắt đầu">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }} style={{ marginHorizontal: -gutter }}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} selected={t === time} onPress={() => setTime(t)} />
            ))}
          </ScrollView>
        </Group>

        <Group title="Làm tại">
          {addresses.map((a) => {
            const selected = a.id === chosen?.id
            return (
              <Press
                key={a.id}
                haptic="select"
                onPress={() => setAddressId(a.id)}
                accessibilityState={{ selected }}
                style={{ padding: 14, borderRadius: radius.md, backgroundColor: selected ? colors.accentSoft : colors.surface, borderWidth: 2, borderColor: selected ? colors.accent : "transparent", gap: 2 }}
              >
                <Txt w={selected ? 700 : 600}>{a.label || "Địa chỉ"}</Txt>
                <Txt v="meta" color={colors.inkSoft}>
                  {[a.detail, a.district, a.city].filter(Boolean).join(", ")}
                </Txt>
              </Press>
            )
          })}
          <Button
            label={addresses.length ? "Thêm địa chỉ khác" : "Thêm địa chỉ"}
            variant={addresses.length ? "secondary" : "primary"}
            size="sm"
            icon="plus"
            onPress={() => router.push({ pathname: "/dia-chi/sua", params: { city: app.city ?? "" } })}
          />
        </Group>

        <Txt v="meta" color={colors.muted}>
          Trả tiền mặt hoặc chuyển khoản cho người làm sau khi xong, không cần cọc. Làm xa hơn {POLICY.freeTravelKm} km hoặc bắt đầu trong {POLICY.urgentWithinHours} giờ tới, báo giá sẽ kèm phí di chuyển / phí gấp.
        </Txt>
        {error ? <ErrorNote text={error} /> : null}
      </ScrollView>
      <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button label={busy ? "Đang đăng…" : "Đăng yêu cầu"} full size="lg" disabled={!valid} busy={busy} onPress={() => void submit()} />
      </View>
    </KeyboardAvoidingView>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt w={700}>{title}</Txt>
      {children}
    </View>
  )
}
