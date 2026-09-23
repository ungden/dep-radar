import { router } from "expo-router"
import { Alert, View } from "react-native"
import { toggleSavedWork } from "@/data/actions"
import type { AppWork } from "@/data/public"
import { useApp } from "@/state/app"
import { colors } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"

/** The saved heart: one of the three places the accent colour is allowed. */
export function SaveHeart({ work, onPhoto }: { work: Pick<AppWork, "dbId" | "title">; onPhoto?: boolean }) {
  const { uid, me, patchMe } = useApp()
  const saved = me.savedWorkIds.includes(work.dbId)

  const toggle = async () => {
    if (!uid) {
      router.push("/login")
      return
    }
    const flip = (on: boolean) =>
      patchMe((m) => ({ ...m, savedWorkIds: on ? [...m.savedWorkIds, work.dbId] : m.savedWorkIds.filter((id) => id !== work.dbId) }))
    flip(!saved)
    const res = await toggleSavedWork(uid, work.dbId, saved)
    if (!res.ok) {
      flip(saved)
      Alert.alert("Chưa lưu được", res.error)
    }
  }

  return (
    <Press
      onPress={() => void toggle()}
      haptic="select"
      accessibilityLabel={saved ? `Bỏ lưu ${work.title}` : `Lưu ${work.title}`}
      accessibilityState={{ selected: saved }}
      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    >
      <View
        style={
          onPhoto
            ? { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" }
            : undefined
        }
      >
        <Icon name={saved ? "heartFill" : "heart"} size={onPhoto ? 18 : 24} color={saved ? colors.accent : colors.ink} />
      </View>
    </Press>
  )
}
