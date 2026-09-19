import { useLocalSearchParams } from "expo-router"
import { Text } from "react-native"
import { Card, Screen } from "@/components/screen"
export default function ProProfile() { const { slug } = useLocalSearchParams<{ slug: string }>(); return <Screen title="Hồ sơ chuyên viên" subtitle={slug}><Card><Text selectable>Đặt lịch, yêu cầu báo giá và chat sẽ dùng cùng các RPC được kiểm soát quyền như web.</Text></Card></Screen> }
