import { Link } from "expo-router"
import { Pressable, StyleSheet, Text } from "react-native"
import { Card, Screen } from "@/components/screen"

export function SimpleTab({ title, text, action, href }: { title: string; text: string; action: string; href: "/login" | "/studio/onboarding" }) {
  return <Screen title={title} subtitle={text}><Card><Text selectable style={styles.copy}>{text}</Text><Link href={href} asChild><Pressable style={styles.button}><Text style={styles.buttonText}>{action}</Text></Pressable></Link></Card></Screen>
}
const styles = StyleSheet.create({ copy: { color: "#6E6261", lineHeight: 22 }, button: { marginTop: 8, padding: 13, borderRadius: 12, backgroundColor: "#F7E7E5", alignItems: "center" }, buttonText: { color: "#A64A53", fontWeight: "700" } })
