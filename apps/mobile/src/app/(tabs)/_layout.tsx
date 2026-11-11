import * as React from "react"
import { router } from "expo-router"
import { NativeTabs } from "expo-router/unstable-native-tabs"
import { countCustomerToDo } from "@/data/bookings"
import { useApp } from "@/state/app"
import { useBadgeCount } from "@/state/badge-count"
import { colors } from "@/theme"
import { tabBarProps } from "@/ui/native-tabs"

/** A freelancer opens the app straight into Studio, once per launch. */
let routedByMode = false

/** The system's own tab bar: Liquid Glass on iOS, Material on Android. */
export default function CustomerTabs() {
  const { mode, data, uid } = useApp()
  // Appointments where the customer has something to do.
  const toDo = useBadgeCount(uid ? () => countCustomerToDo(uid) : null, uid)
  React.useEffect(() => {
    if (routedByMode || !data) return
    routedByMode = true
    if (mode === "pro") router.replace("/studio")
  }, [mode, data])

  return (
    <NativeTabs {...tabBarProps}>
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Label>Khám phá</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="artist" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Label>Artist</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="paintbrush.pointed" md="brush" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lich-hen" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Label>Lịch hẹn</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        {toDo > 0 ? <NativeTabs.Trigger.Badge>{String(toDo)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="toi" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Label>Tôi</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
