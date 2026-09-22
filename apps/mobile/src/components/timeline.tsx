import { View } from "react-native"
import { formatDateLong, localDate, localTime } from "@/data/format"
import { colors } from "@/theme"
import { Txt } from "@/ui/text"

export interface TimelineStep {
  label: string
  /** When it happened. Null means it has not happened (yet). */
  at: string | null
  detail?: string
  /** A step that ended the booking early (cancelled, declined…). */
  stop?: boolean
}

/** Status history, each step with the real time it happened; nothing is filled in by guess. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View>
      {steps.map((s, i) => {
        const done = Boolean(s.at)
        const last = i === steps.length - 1
        return (
          <View key={s.label} style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ alignItems: "center", width: 14 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  marginTop: 5,
                  backgroundColor: done ? (s.stop ? colors.danger : colors.ink) : colors.surface,
                  borderWidth: 2,
                  borderColor: done ? (s.stop ? colors.danger : colors.ink) : colors.subtleStrong,
                }}
              />
              {!last ? <View style={{ flex: 1, width: 2, backgroundColor: done ? colors.ink : colors.subtleStrong }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
              <Txt w={done ? 700 : 500} color={done ? (s.stop ? colors.danger : colors.ink) : colors.muted}>
                {s.label}
              </Txt>
              {s.at ? (
                <Txt v="meta" color={colors.inkSoft}>
                  {localTime(s.at)} · {formatDateLong(localDate(s.at))}
                </Txt>
              ) : null}
              {s.detail ? (
                <Txt v="meta" color={colors.inkSoft}>
                  {s.detail}
                </Txt>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}
