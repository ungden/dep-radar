import * as React from "react"
import * as Location from "expo-location"
import { FlatList, Modal, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LOCATION_DENIED, LOCATION_FAILED, isLegacyDistrict, searchWards, wardOfPoint } from "@/shared"
import { colors, fonts, gutter, radius } from "@/theme"
import { IconButton } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

export interface WardChoice {
  city: string
  district: string
  /** Set when it came from the phone's position: the exact point, not the ward's centre. */
  point?: { lat: number; lng: number }
}

/**
 * The phường / xã of an address (lib/geo.ts). A city has a hundred or more, so
 * it is a search, not a row of chips: today's name or the old quận and phường
 * it was formed from both find it. "Dùng vị trí hiện tại" picks the ward from
 * the phone and keeps the exact point, so travel is measured from the door.
 */
export function WardPicker({
  city,
  value,
  onChange,
  locate,
  label = "Phường / xã",
}: {
  city: string
  value: string
  onChange: (choice: WardChoice) => void
  /** Offer "Dùng vị trí hiện tại" (addresses; not where a freelancer is based). */
  locate?: boolean
  label?: string
}) {
  const insets = useSafeAreaInsets()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [locating, setLocating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const results = React.useMemo(() => searchWards(city, query), [city, query])
  const legacy = Boolean(value) && isLegacyDistrict(city, value)

  const close = () => {
    setOpen(false)
    setQuery("")
    setError(null)
  }

  const pick = (choice: WardChoice) => {
    onChange(choice)
    close()
  }

  const useHere = async () => {
    setLocating(true)
    setError(null)
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) return setError(LOCATION_DENIED)
      const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const point = { lat: here.coords.latitude, lng: here.coords.longitude }
      const ward = wardOfPoint([point.lat, point.lng])
      if (!ward) return setError("Vị trí này ngoài khu vực 360dep đang phục vụ (Hà Nội, TP.HCM, Đà Nẵng).")
      pick({ ...ward, point })
    } catch {
      setError(LOCATION_FAILED)
    } finally {
      setLocating(false)
    }
  }

  return (
    <View style={{ gap: 6 }}>
      <Press
        onPress={() => setOpen(true)}
        accessibilityLabel={`${label}: ${value || "chưa chọn"}`}
        style={{
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: legacy ? 1 : 0,
          borderColor: colors.accent,
        }}
      >
        <Icon name="pin" size={18} color={value ? colors.accent : colors.muted} />
        <Txt style={{ flex: 1 }} color={value ? colors.ink : colors.muted}>
          {value || "Chọn phường / xã"}
        </Txt>
        <Icon name="down" size={16} color={colors.muted} />
      </Press>
      {legacy ? (
        <Txt v="meta" color={colors.accent}>
          "{value}" là quận cũ, không còn trên địa chỉ từ 1/7/2025. Chọn phường / xã mới.
        </Txt>
      ) : null}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: gutter, gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Txt v="h2">{label}</Txt>
              <Txt v="meta" color={colors.muted}>
                {city} · theo địa chỉ mới từ 1/7/2025
              </Txt>
            </View>
            <IconButton name="close" label="Đóng" onPress={close} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            placeholder="Tìm tên phường, xã hoặc quận cũ"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={{
              marginHorizontal: gutter,
              marginTop: 12,
              height: 46,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              paddingHorizontal: 14,
              fontFamily: fonts[400],
              fontSize: 16,
              color: colors.ink,
            }}
            accessibilityLabel="Tìm phường, xã"
          />
          {locate ? (
            <Press
              onPress={() => void useHere()}
              disabled={locating}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: gutter, marginTop: 12, paddingVertical: 10 }}
            >
              <Icon name="directions" size={18} color={colors.accent} />
              <Txt w={600} color={colors.accent}>
                {locating ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}
              </Txt>
            </Press>
          ) : null}
          {error ? (
            <Txt v="meta" color={colors.danger} style={{ marginHorizontal: gutter }}>
              {error}
            </Txt>
          ) : null}
          <FlatList
            data={results}
            keyExtractor={(w) => w.name}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
            ListEmptyComponent={
              <Txt color={colors.inkSoft} style={{ paddingTop: 24 }}>
                Không thấy "{query}" ở {city}. Thử tên phường cũ hoặc tên quận.
              </Txt>
            }
            renderItem={({ item }) => {
              const selected = item.name === value
              return (
                <Press
                  onPress={() => pick({ city, district: item.name })}
                  accessibilityState={{ selected }}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt w={selected ? 700 : 500}>{item.name}</Txt>
                    {item.formerly ? (
                      <Txt v="meta" color={colors.muted} numberOfLines={2}>
                        Trước đây: {item.formerly}
                      </Txt>
                    ) : null}
                  </View>
                  {selected ? <Icon name="check" size={18} color={colors.accent} /> : null}
                </Press>
              )
            }}
          />
        </View>
      </Modal>
    </View>
  )
}
