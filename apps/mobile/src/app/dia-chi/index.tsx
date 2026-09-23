import * as React from "react"
import { router } from "expo-router"
import { ActionSheetIOS, Alert, Platform, ScrollView, View } from "react-native"
import { deleteAddress, setDefaultAddress } from "@/data/addresses"
import type { Address } from "@/data/me"
import { SignInGate } from "@/components/sign-in-gate"
import { useApp } from "@/state/app"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

/** Saved addresses: add, edit, delete, pick the default. Same table and rules as the web's /me/dia-chi. */
export default function Addresses() {
  const app = useApp()
  const [refreshing, setRefreshing] = React.useState(false)
  if (!app.uid) return <SignInGate title="Địa chỉ" text="Đăng nhập để lưu địa chỉ và đặt làm tại nhà." />
  const uid = app.uid

  const reload = async () => {
    setRefreshing(true)
    await app.refreshMe()
    setRefreshing(false)
  }

  const makeDefault = async (a: Address) => {
    const res = await setDefaultAddress(uid, a.id)
    if (!res.ok) return Alert.alert("Chưa đổi được", res.error)
    haptic.success()
    void app.refreshMe()
  }

  const remove = (a: Address) =>
    Alert.alert("Xoá địa chỉ này?", [a.detail, a.district, a.city].filter(Boolean).join(", "), [
      { text: "Thôi", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          const res = await deleteAddress(a.id)
          if (!res.ok) return Alert.alert("Chưa xoá được", res.error)
          void app.refreshMe()
        },
      },
    ])

  const edit = (a: Address) => router.push({ pathname: "/dia-chi/sua", params: { id: a.id } })

  const menu = (a: Address) => {
    const actions = [
      { label: "Sửa", run: () => edit(a) },
      ...(a.isDefault ? [] : [{ label: "Đặt làm mặc định", run: () => void makeDefault(a) }]),
      { label: "Xoá", run: () => remove(a), destructive: true },
    ]
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...actions.map((x) => x.label), "Huỷ"], cancelButtonIndex: actions.length, destructiveButtonIndex: actions.length - 1 },
        (i) => actions[i]?.run(),
      )
    } else {
      Alert.alert(a.label || "Địa chỉ", undefined, [
        ...actions.map((x) => ({ text: x.label, style: x.destructive ? ("destructive" as const) : ("default" as const), onPress: x.run })),
        { text: "Huỷ", style: "cancel" as const },
      ])
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: gutter, gap: 12 }}
      refreshControl={refreshControl(refreshing, () => void reload())}
    >
      {app.me.addresses.length ? (
        <>
          {app.me.addresses.map((a) => (
            <Press
              key={a.id}
              onPress={() => edit(a)}
              onLongPress={() => menu(a)}
              accessibilityLabel={`${a.label || "Địa chỉ"}${a.isDefault ? ", mặc định" : ""}. Sửa`}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: 16,
                gap: 4,
                borderWidth: 1.5,
                borderColor: a.isDefault ? colors.accent : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon name="home" size={18} color={a.isDefault ? colors.accent : colors.inkSoft} />
                <Txt w={700} style={{ flex: 1 }}>
                  {a.label || "Địa chỉ"}
                </Txt>
                {a.isDefault ? (
                  <View style={{ backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 2 }}>
                    <Txt v="meta" w={700} color={colors.accentDark}>
                      Mặc định
                    </Txt>
                  </View>
                ) : null}
                <Press onPress={() => menu(a)} hitSlop={10} accessibilityLabel={`Tuỳ chọn cho ${a.label || "địa chỉ"}`} style={{ padding: 4 }}>
                  <Icon name="more" size={20} color={colors.inkSoft} />
                </Press>
              </View>
              <Txt color={colors.inkSoft}>{[a.detail, a.district, a.city].filter(Boolean).join(", ")}</Txt>
              {a.note ? (
                <Txt v="meta" color={colors.muted}>
                  {a.note}
                </Txt>
              ) : null}
            </Press>
          ))}
          <Button label="Thêm địa chỉ" icon="plus" full onPress={() => router.push("/dia-chi/sua")} />
          <Txt v="meta" color={colors.muted}>
            Khoảng cách tới người làm được ước tính từ địa chỉ mặc định, theo quận.
          </Txt>
        </>
      ) : (
        <EmptyState
          title="Chưa có địa chỉ"
          text="Lưu một địa chỉ để thấy khoảng cách tới người làm và đặt làm tại nhà."
          action="Thêm địa chỉ"
          onAction={() => router.push("/dia-chi/sua")}
        />
      )}
    </ScrollView>
  )
}
