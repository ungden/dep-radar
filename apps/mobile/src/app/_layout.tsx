import * as React from "react"
import { BeVietnamPro_400Regular } from "@expo-google-fonts/be-vietnam-pro/400Regular"
import { BeVietnamPro_500Medium } from "@expo-google-fonts/be-vietnam-pro/500Medium"
import { BeVietnamPro_600SemiBold } from "@expo-google-fonts/be-vietnam-pro/600SemiBold"
import { BeVietnamPro_700Bold } from "@expo-google-fonts/be-vietnam-pro/700Bold"
import { BeVietnamPro_800ExtraBold } from "@expo-google-fonts/be-vietnam-pro/800ExtraBold"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { useFonts } from "expo-font"
import { Stack, router, useSegments } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { useNotificationTaps } from "@/data/push"
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
  const { ready, uid, termsAccepted } = useApp()
  const segments = useSegments()
  React.useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])
  useNotificationTaps(ready)
  // Signed in before the terms screen existed (or on another phone): ask once.
  // A fresh sign-in is sent there by the login screen itself.
  const inAuthFlow = ["login", "dieu-khoan", "so-dien-thoai", "them-email"].includes(String(segments[0] ?? ""))
  React.useEffect(() => {
    if (ready && uid && termsAccepted === false && !inAuthFlow) router.push("/dieu-khoan")
  }, [ready, uid, termsAccepted, inAuthFlow])
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
      <Stack.Screen name="dich-vu/[id]" options={{ title: "" }} />
      <Stack.Screen name="da-luu" options={{ title: "Đã lưu" }} />
      <Stack.Screen name="dia-chi/index" options={{ title: "Địa chỉ" }} />
      <Stack.Screen name="dia-chi/sua" options={{ title: "Địa chỉ", presentation: "modal" }} />
      <Stack.Screen name="yeu-cau/index" options={{ title: "Yêu cầu của tôi" }} />
      <Stack.Screen name="yeu-cau/moi" options={{ title: "Đăng yêu cầu", presentation: "modal" }} />
      <Stack.Screen name="yeu-cau/[id]" options={{ title: "Yêu cầu" }} />
      <Stack.Screen name="danh-gia/[bookingId]" options={{ title: "Đánh giá", presentation: "modal" }} />
      <Stack.Screen name="tuyen-mau/index" options={{ title: "Tuyển mẫu" }} />
      <Stack.Screen name="tuyen-mau/[id]" options={{ title: "" }} />
      <Stack.Screen name="da-chan" options={{ title: "Đã chặn" }} />
      <Stack.Screen name="gioi-thieu" options={{ title: "Giới thiệu bạn bè" }} />
      <Stack.Screen name="anh-portfolio" options={{ title: "Ảnh portfolio" }} />
      <Stack.Screen name="dieu-khoan" options={{ title: "", presentation: "modal", gestureEnabled: false }} />
      <Stack.Screen name="login" options={{ title: "", presentation: "modal" }} />
      <Stack.Screen name="so-dien-thoai" options={{ title: "Số điện thoại", gestureEnabled: false }} />
      <Stack.Screen name="them-email" options={{ title: "Email lấy lại mật khẩu" }} />
      <Stack.Screen name="doi-mat-khau" options={{ title: "Mật khẩu", presentation: "modal" }} />
      <Stack.Screen name="doi-tac" options={{ title: "360dep Đối tác" }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
    </Stack>
  )
}
