import * as React from "react"
import { router } from "expo-router"
import { Tabs } from "expo-router/js-tabs"
import { TabBar, type TabSpec } from "@/components/tab-bar"
import { useApp } from "@/state/app"
import { colors } from "@/theme"

const SPECS: Record<string, TabSpec> = {
  index: { label: "Khám phá", icon: "explore" },
  artist: { label: "Artist", icon: "brush" },
  "lich-hen": { label: "Lịch hẹn", icon: "calendar" },
  toi: { label: "Tôi", icon: "person" },
}

/** A freelancer opens the app straight into Studio, once per launch. */
let routedByMode = false

export default function CustomerTabs() {
  const { mode, data } = useApp()
  React.useEffect(() => {
    if (routedByMode || !data) return
    routedByMode = true
    if (mode === "pro") router.replace("/studio")
  }, [mode, data])

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} specs={SPECS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="artist" />
      {/* Search, opened from Khám phá: it has no tab of its own. */}
      <Tabs.Screen name="tim" />
      <Tabs.Screen name="lich-hen" />
      <Tabs.Screen name="toi" />
    </Tabs>
  )
}
