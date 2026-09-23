import * as React from "react"
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, radius } from "@/theme"
import { IconButton } from "./button"
import { Txt } from "./text"

export function useSheet() {
  const ref = React.useRef<BottomSheetModal>(null)
  return {
    ref,
    open: React.useCallback(() => ref.current?.present(), []),
    close: React.useCallback(() => ref.current?.dismiss(), []),
  }
}

/**
 * Fixed heights, so a sheet never jumps while its content changes (a filter
 * turning on, a keyboard opening). Short for a question, medium for a picker
 * or a small form, tall for filters and reports.
 */
const SNAP = { short: ["42%"], medium: ["62%"], tall: ["88%"] } as const
const FOOTER_HEIGHT = 70

/** Filters, pickers and short forms slide up from the bottom. The footer stays pinned above the home indicator. */
export function Sheet({
  sheet,
  title,
  children,
  footer,
  size = "medium",
}: {
  sheet: ReturnType<typeof useSheet>
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: keyof typeof SNAP
}) {
  const insets = useSafeAreaInsets()
  const snapPoints = React.useMemo(() => [...SNAP[size]], [size])
  const backdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} pressBehavior="close" />,
    [],
  )
  // Recreated with the footer so its buttons always see the latest state.
  const renderFooter = React.useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}
        >
          {footer}
        </View>
      </BottomSheetFooter>
    ),
    [footer, insets.bottom],
  )
  return (
    <BottomSheetModal
      ref={sheet.ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backdropComponent={backdrop}
      footerComponent={footer ? renderFooter : undefined}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: radius.lg }}
      handleIndicatorStyle={{ backgroundColor: colors.subtleStrong, width: 40 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 20, paddingRight: 8, paddingBottom: 4 }}>
        <Txt v="title" w={700} style={{ flexShrink: 1 }}>
          {title}
        </Txt>
        <IconButton name="close" label="Đóng" size={18} color={colors.inkSoft} onPress={sheet.close} />
      </View>
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: footer ? FOOTER_HEIGHT + insets.bottom + 16 : insets.bottom + 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
