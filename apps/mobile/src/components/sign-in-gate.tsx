import { router } from "expo-router"
import type { ReactNode } from "react"
import { ScrollView, View } from "react-native"
import { colors, gutter } from "@/theme"
import { EmptyState } from "@/ui/bits"
import { PageBand } from "./page-band"

/** A tab that needs an account says so, with one button. */
export function SignInGate({ title, text, footer }: { title: string; text: string; footer?: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageBand title={title} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, paddingTop: 8, paddingHorizontal: gutter, paddingBottom: 96 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <EmptyState title="Bạn chưa đăng nhập" text={text} action="Đăng nhập" onAction={() => router.push("/login")} />
      </View>
      {footer}
      </ScrollView>
    </View>
  )
}
