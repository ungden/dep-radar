import { Redirect } from "expo-router"
import { Tabs } from "expo-router/js-tabs"
import { TabBar, type TabSpec } from "@/components/tab-bar"
import { useApp } from "@/state/app"
import { colors } from "@/theme"

const SPECS: Record<string, TabSpec> = {
  index: { label: "Hôm nay", icon: "today" },
  "viec-moi": { label: "Việc mới", icon: "briefcase" },
  dang: { label: "Đăng", icon: "plus", center: true },
  lich: { label: "Lịch", icon: "calendar" },
  toi: { label: "Tôi", icon: "person" },
}

/** Studio: the freelancer's side of the same app. */
export default function StudioTabs() {
  const { uid, myPro, data } = useApp()
  if (data && (!uid || !myPro)) return <Redirect href="/" />
  return (
    <Tabs tabBar={(props) => <TabBar {...props} specs={SPECS} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="viec-moi" />
      <Tabs.Screen name="dang" />
      <Tabs.Screen name="lich" />
      <Tabs.Screen name="toi" />
    </Tabs>
  )
}
