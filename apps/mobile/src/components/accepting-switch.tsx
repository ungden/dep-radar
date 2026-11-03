import * as React from "react"
import { Alert, Switch } from "react-native"
import { setAcceptingJobs } from "@/data/actions"
import { useApp } from "@/state/app"
import { colors } from "@/theme"

/** "Nhận lịch mới": the same setting in Hôm nay and Tôi. */
export function AcceptingSwitch() {
  const app = useApp()
  const uid = app.uid
  const shown = app.myPro?.acceptingJobs ?? true
  const [accepting, setAccepting] = React.useState(shown)
  React.useEffect(() => setAccepting(shown), [shown])
  const toggle = async (value: boolean) => {
    if (!uid) return
    setAccepting(value)
    const res = await setAcceptingJobs(uid, value)
    if (!res.ok) {
      setAccepting(!value)
      return Alert.alert("Chưa đổi được", res.error)
    }
    void app.refresh()
  }
  return <Switch value={accepting} onValueChange={(v) => void toggle(v)} trackColor={{ true: colors.success, false: colors.subtleStrong }} accessibilityLabel="Nhận lịch mới" />
}
