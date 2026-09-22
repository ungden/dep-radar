import * as React from "react"
import { BeVietnamPro_400Regular } from "@expo-google-fonts/be-vietnam-pro/400Regular"
import { BeVietnamPro_500Medium } from "@expo-google-fonts/be-vietnam-pro/500Medium"
import { BeVietnamPro_600SemiBold } from "@expo-google-fonts/be-vietnam-pro/600SemiBold"
import { BeVietnamPro_700Bold } from "@expo-google-fonts/be-vietnam-pro/700Bold"
import { BeVietnamPro_800ExtraBold } from "@expo-google-fonts/be-vietnam-pro/800ExtraBold"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AppProvider, useApp } from "@/state/app"
import { colors, fonts } from "@/theme"

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  })
  if (!fontsLoaded && !fontError) return null
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <AppProvider>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Navigator />
        </BottomSheetModalProvider>
      </AppProvider>
    </GestureHandlerRootView>
  )
}

function Navigator() {
  const { ready } = useApp()
  React.useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])
  if (!ready) return null
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts[700], fontSize: 17, color: colors.ink },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="studio" options={{ headerShown: false }} />
      <Stack.Screen name="works/[id]" options={{ headerTransparent: true, title: "" }} />
      <Stack.Screen name="pros/[id]" options={{ headerTransparent: true, title: "" }} />
      <Stack.Screen name="book/[proId]" options={{ title: "Đặt lịch", presentation: "modal" }} />
      <Stack.Screen name="bookings/[id]" options={{ title: "Lịch hẹn" }} />
      <Stack.Screen name="tin-nhan/index" options={{ title: "Tin nhắn" }} />
      <Stack.Screen name="tin-nhan/[id]" options={{ title: "" }} />
      <Stack.Screen name="thong-bao" options={{ title: "Thông báo" }} />
      <Stack.Screen name="dip/[id]" options={{ title: "" }} />
      <Stack.Screen name="da-luu" options={{ title: "Đã lưu" }} />
      <Stack.Screen name="dia-chi" options={{ title: "Địa chỉ" }} />
      <Stack.Screen name="login" options={{ title: "", presentation: "modal" }} />
      <Stack.Screen name="so-dien-thoai" options={{ title: "Số điện thoại", gestureEnabled: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
    </Stack>
  )
}
