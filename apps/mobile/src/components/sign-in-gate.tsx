import { router } from "expo-router"
import type { ReactNode } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, gutter } from "@/theme"
import { EmptyState } from "@/ui/bits"
import { Txt } from "@/ui/text"

/** A tab that needs an account says so, with one button. */
export function SignInGate({ title, text, footer }: { title: string; text: string; footer?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 8, paddingHorizontal: gutter, paddingBottom: 24 }}>
      <Txt v="h1">{title}</Txt>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <EmptyState title="Bạn chưa đăng nhập" text={text} action="Đăng nhập" onAction={() => router.push("/login")} />
      </View>
      {footer}
    </ScrollView>
  )
}
