import * as React from "react"
import { TextInput, View, type TextInputProps } from "react-native"
import { colors, fonts, radius } from "@/theme"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { Txt } from "@/ui/text"

const input = {
  flex: 1,
  height: 52,
  paddingHorizontal: 16,
  fontFamily: fonts[400],
  fontSize: 16,
  color: colors.ink,
} as const

const box = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.lineStrong,
} as const

/** A labelled text field, as in the sign-in and account screens. */
export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt v="meta" w={600} color={colors.inkSoft}>
        {label}
      </Txt>
      <View style={box}>
        <TextInput placeholderTextColor={colors.muted} accessibilityLabel={label} {...props} style={input} />
      </View>
      {hint ? (
        <Txt v="meta" color={colors.muted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  )
}

/** A password with a show / hide eye. */
export function PasswordField({ label = "Mật khẩu", hint, isNew, ...props }: TextInputProps & { label?: string; hint?: string; isNew?: boolean }) {
  const [shown, setShown] = React.useState(false)
  return (
    <View style={{ gap: 6 }}>
      <Txt v="meta" w={600} color={colors.inkSoft}>
        {label}
      </Txt>
      <View style={box}>
        <TextInput
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          secureTextEntry={!shown}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={isNew ? "new-password" : "current-password"}
          textContentType={isNew ? "newPassword" : "password"}
          {...props}
          style={input}
        />
        <Press
          onPress={() => setShown((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          hitSlop={6}
          style={{ width: 48, height: 52, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name={shown ? "eyeOff" : "eye"} size={20} color={colors.muted} />
        </Press>
      </View>
      {hint ? (
        <Txt v="meta" color={colors.muted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  )
}

/** Good news in the same shape as ErrorNote. */
export function InfoNote({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: colors.successSoft, borderRadius: radius.md, padding: 14 }}>
      <Txt color={colors.success} selectable>
        {text}
      </Txt>
    </View>
  )
}
