import * as React from "react"
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet"
import { View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, radius } from "@/theme"
import { Txt } from "./text"

export function useSheet() {
  const ref = React.useRef<BottomSheetModal>(null)
  return {
    ref,
    open: React.useCallback(() => ref.current?.present(), []),
    close: React.useCallback(() => ref.current?.dismiss(), []),
  }
}

/** Filters, pickers and short forms slide up from the bottom. */
export function Sheet({
  sheet,
  title,
  children,
  footer,
  maxHeight = 0.85,
}: {
  sheet: ReturnType<typeof useSheet>
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Share of the screen height. */
  maxHeight?: number
}) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const backdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} />,
    [],
  )
  return (
    <BottomSheetModal
      ref={sheet.ref}
      enableDynamicSizing
      maxDynamicContentSize={Math.round(height * maxHeight)}
      backdropComponent={backdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: radius.lg }}
      handleIndicatorStyle={{ backgroundColor: colors.subtleStrong, width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: footer ? 12 : insets.bottom + 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Txt v="title" w={700}>
          {title}
        </Txt>
        {children}
      </BottomSheetScrollView>
      {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>{footer}</View> : null}
    </BottomSheetModal>
  )
}
