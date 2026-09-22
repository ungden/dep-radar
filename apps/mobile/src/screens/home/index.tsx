import * as React from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { Link } from "expo-router"
import { Card, Screen } from "@/components/screen"
import { listPros } from "@/lib/api"

export function Home() {
  const [pros, setPros] = React.useState<Awaited<ReturnType<typeof listPros>>>([])
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => { void listPros().then(setPros).catch((e) => setError(e.message)) }, [])
  return <Screen title="360dep" subtitle="Đặt lịch với chuyên viên làm đẹp gần bạn">
    <Link href="/login" asChild><Pressable style={styles.cta}><Text style={styles.ctaText}>Đăng nhập</Text></Pressable></Link>
    <Text style={styles.heading}>Chuyên viên nổi bật</Text>
    {error ? <Card><Text selectable>{error}</Text></Card> : pros.length === 0 ? <ActivityIndicator color="#C65E68" /> : pros.map((pro) =>
      <Link key={pro.id} href={{ pathname: "/pro/[slug]", params: { slug: pro.slug } }} asChild>
        <Pressable><Card><View style={styles.row}><View><Text style={styles.name}>{pro.display_name}</Text><Text style={styles.detail}>{pro.title} · {pro.district}, {pro.city}</Text></View><Text style={styles.rating}>★ {Number(pro.rating_avg).toFixed(1)}</Text></View></Card></Pressable>
      </Link>)}
  </Screen>
}
const styles = StyleSheet.create({ cta: { backgroundColor: "#C65E68", padding: 15, borderRadius: 14, alignItems: "center" }, ctaText: { color: "white", fontWeight: "700" }, heading: { fontSize: 18, fontWeight: "700", marginTop: 10 }, row: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, name: { fontSize: 17, fontWeight: "700", color: "#2A2020" }, detail: { color: "#6E6261", marginTop: 4 }, rating: { color: "#A64A53", fontVariant: ["tabular-nums"] } })
