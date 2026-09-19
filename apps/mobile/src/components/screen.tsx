import { type ReactNode } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text selectable style={styles.subtitle}>{subtitle}</Text> : null}
    <View style={styles.body}>{children}</View>
  </ScrollView>
}

export function Card({ children }: { children: ReactNode }) { return <View style={styles.card}>{children}</View> }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FAF6F4" },
  content: { padding: 20, gap: 8 },
  title: { fontSize: 30, fontWeight: "700", color: "#2A2020" },
  subtitle: { fontSize: 15, color: "#6E6261", lineHeight: 22 },
  body: { gap: 12, paddingTop: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, gap: 6, borderCurve: "continuous", boxShadow: "0 1px 3px rgba(42,32,32,0.08)" },
})
