import { router } from "expo-router"
import { Alert } from "react-native"
import { toggleFollow } from "@/data/actions"
import { useApp } from "@/state/app"
import { Button } from "@/ui/button"

export function FollowButton({ proUuid, name }: { proUuid: string; name: string }) {
  const { uid, me, patchMe } = useApp()
  const following = me.followedProIds.includes(proUuid)
  if (uid === proUuid) return null

  const toggle = async () => {
    if (!uid) {
      router.push("/login")
      return
    }
    const flip = (on: boolean) =>
      patchMe((m) => ({ ...m, followedProIds: on ? [...m.followedProIds, proUuid] : m.followedProIds.filter((id) => id !== proUuid) }))
    flip(!following)
    const res = await toggleFollow(uid, proUuid, following)
    if (!res.ok) {
      flip(following)
      Alert.alert(`Chưa theo dõi được ${name}`, res.error)
    }
  }

  return <Button label={following ? "Đang theo dõi" : "Theo dõi"} size="sm" variant={following ? "secondary" : "primary"} onPress={() => void toggle()} />
}
