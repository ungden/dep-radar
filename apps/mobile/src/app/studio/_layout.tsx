import { Redirect } from "expo-router"
import { NativeTabs } from "expo-router/unstable-native-tabs"
import { useApp } from "@/state/app"
import { colors } from "@/theme"

const TABS = [
  { name: "index", label: "Hôm nay", sf: "house", md: "home" },
  { name: "viec-moi", label: "Việc mới", sf: "bolt", md: "bolt" },
  { name: "dang", label: "Đăng", sf: "plus", md: "add" },
  { name: "lich", label: "Lịch", sf: "calendar", md: "calendar_month" },
  { name: "toi", label: "Tôi", sf: "person", md: "person" },
] as const

/** Studio: the freelancer's side of the same app, on the system's own tab bar. */
export default function StudioTabs() {
  const { uid, myPro, data } = useApp()
  if (data && (!uid || !myPro)) return <Redirect href="/" />
  return (
    <NativeTabs tintColor={colors.accent}>
      {TABS.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name} contentStyle={{ backgroundColor: colors.canvas }}>
          <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={t.sf} md={t.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  )
}
