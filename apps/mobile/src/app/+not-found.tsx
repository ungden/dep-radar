import { router } from "expo-router"
import { View } from "react-native"
import { colors } from "@/theme"
import { EmptyState } from "@/ui/bits"

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: "center" }}>
      <EmptyState title="Không có trang này" action="Về Khám phá" onAction={() => router.replace("/")} />
    </View>
  )
}
