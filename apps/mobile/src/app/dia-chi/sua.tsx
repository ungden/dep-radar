import * as React from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CITIES, districtsOf } from "@/shared"
import { deleteAddress, saveAddress } from "@/data/addresses"
import { useApp } from "@/state/app"
import { useKeyboardVisible } from "@/state/keyboard"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button, IconButton } from "@/ui/button"
import { Chip, ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Txt } from "@/ui/text"

const LABELS = ["Nhà", "Công ty", "Nhà bố mẹ"]

/** Add or edit one address. Opened from Tôi › Địa chỉ and from step 3 of booking (with the city and district already chosen). */
export default function EditAddress() {
  const params = useLocalSearchParams<{ id?: string; city?: string; district?: string }>()
  const app = useApp()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardVisible()
  const existing = app.me.addresses.find((a) => a.id === params.id) ?? null
  const firstCity = existing?.city ?? (CITIES.includes(params.city ?? "") ? params.city! : (app.city ?? CITIES[0]))
  const [label, setLabel] = React.useState(existing?.label ?? "Nhà")
  const [city, setCity] = React.useState(firstCity)
  const [district, setDistrict] = React.useState(existing?.district ?? (districtsOf(firstCity).includes(params.district ?? "") ? params.district! : ""))
  const [detail, setDetail] = React.useState(existing?.detail ?? "")
  const [note, setNote] = React.useState(existing?.note ?? "")
  const [isDefault, setIsDefault] = React.useState(existing ? existing.isDefault : app.me.addresses.length === 0)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const valid = Boolean(city && district && detail.trim().length >= 3)

  const save = async () => {
    setBusy(true)
    setError(null)
    const res = await saveAddress(app.uid, { id: existing?.id, label, city, district, detail, note, isDefault })
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    await app.refreshMe()
    router.back()
  }

  const remove = () =>
    existing &&
    Alert.alert("Xoá địa chỉ này?", undefined, [
      { text: "Thôi", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          const res = await deleteAddress(existing.id)
          if (!res.ok) return setError(res.error)
          await app.refreshMe()
          router.back()
        },
      },
    ])

  const input = { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts[400], fontSize: 15, color: colors.ink } as const

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}>
      <Stack.Screen
        options={{
          title: existing ? "Sửa địa chỉ" : "Thêm địa chỉ",
          headerRight: () => <IconButton name="close" label="Đóng" onPress={() => router.back()} />,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 20 }} keyboardShouldPersistTaps="handled">
        <Group title="Tên gọi">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {LABELS.map((l) => (
              <Chip key={l} label={l} selected={label === l} onPress={() => setLabel(l)} />
            ))}
          </View>
          <TextInput value={label} onChangeText={setLabel} selectTextOnFocus maxLength={40} placeholder="Nhà" placeholderTextColor={colors.muted} style={[input, { height: 48 }]} accessibilityLabel="Tên gọi địa chỉ" />
        </Group>
        <Group title="Thành phố">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CITIES.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={city === c}
                onPress={() => {
                  setCity(c)
                  if (!districtsOf(c).includes(district)) setDistrict("")
                }}
              />
            ))}
          </View>
        </Group>
        <Group title="Quận / huyện">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {districtsOf(city).map((d) => (
              <Chip key={d} label={d} selected={district === d} onPress={() => setDistrict(d)} />
            ))}
          </View>
        </Group>
        <Group title="Số nhà, tên đường">
          <TextInput
            value={detail}
            onChangeText={setDetail}
            maxLength={200}
            placeholder="12 ngõ 45 Nguyễn Chí Thanh"
            placeholderTextColor={colors.muted}
            autoComplete="street-address"
            textContentType="streetAddressLine1"
            style={[input, { height: 48 }]}
            accessibilityLabel="Số nhà, tên đường"
          />
        </Group>
        <Group title="Ghi chú cho người làm">
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={200}
            multiline
            placeholder="Toà nhà, tầng, cổng, chỗ gửi xe…"
            placeholderTextColor={colors.muted}
            style={[input, { minHeight: 72, paddingTop: 12, textAlignVertical: "top" }]}
            accessibilityLabel="Ghi chú địa chỉ"
          />
        </Group>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}>
          <View style={{ flex: 1 }}>
            <Txt w={700}>Địa chỉ mặc định</Txt>
            <Txt v="meta" color={colors.inkSoft}>
              Dùng để tính khoảng cách và chọn sẵn khi đặt lịch.
            </Txt>
          </View>
          <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.accent, false: colors.subtleStrong }} accessibilityLabel="Địa chỉ mặc định" />
        </View>
        {error ? <ErrorNote text={error} /> : null}
        {existing ? <Button label="Xoá địa chỉ" variant="danger" icon="trash" full onPress={remove} /> : null}
      </ScrollView>
      <View style={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button label="Lưu địa chỉ" full size="lg" disabled={!valid} busy={busy} onPress={() => void save()} />
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
