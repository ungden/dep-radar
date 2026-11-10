import * as React from "react"
import { Redirect } from "expo-router"
import { NativeTabs } from "expo-router/unstable-native-tabs"
import { countPendingForPro } from "@/data/bookings"
import { useApp } from "@/state/app"
import { useBadgeCount } from "@/state/badge-count"
import { colors } from "@/theme"
import { tabBarProps } from "@/ui/native-tabs"

const TABS = [
  { name: "index", label: "Hôm nay", sf: "house", md: "home" },
  { name: "viec-moi", label: "Đơn", sf: "bolt", md: "bolt" },
  { name: "dang", label: "Đăng", sf: "plus", md: "add" },
  { name: "lich", label: "Lịch", sf: "calendar", md: "calendar_month" },
  { name: "toi", label: "Tôi", sf: "person", md: "person" },
] as const

/** Studio: the freelancer's side of the same app, on the system's own tab bar. */
export default function StudioTabs() {
  const { uid, myPro, data, me, switchMode } = useApp()
  // Being in Studio is partner mode: say so once per visit, so the next launch opens here too.
  const marked = React.useRef(false)
  React.useEffect(() => {
    if (marked.current || !uid || !myPro || !me.account) return
    marked.current = true
    if (me.account.activeRole !== "pro") void switchMode("pro")
  }, [uid, myPro, me.account, switchMode])
  // Bookings waiting for an answer, on the tab that lists them.
  const waiting = useBadgeCount(uid && myPro ? () => countPendingForPro(uid) : null, uid)
  if (data && (!uid || !myPro)) return <Redirect href="/" />
  return (
    <NativeTabs {...tabBarProps}>
      {TABS.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name} contentStyle={{ backgroundColor: colors.canvas }}>
          <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={t.sf} md={t.md} />
          {t.name === "viec-moi" && waiting > 0 ? <NativeTabs.Trigger.Badge>{String(waiting)}</NativeTabs.Trigger.Badge> : null}
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  )
}
