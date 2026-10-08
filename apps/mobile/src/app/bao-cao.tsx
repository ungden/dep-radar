import * as React from "react"
import { router } from "expo-router"
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native"
import { EvidenceGrid, EvidencePicker } from "@/components/evidence"
import { timeAgo } from "@/data/format"
import {
  EVIDENCE_MAX,
  GENERAL_REPORT_REASONS,
  addReportEvidence,
  fileReport,
  loadMyReports,
  removeEvidence,
  type MyReport,
} from "@/data/safety"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, fonts, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, Chip, EmptyState, ErrorNote } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

const STATUS: Record<MyReport["status"], { label: string; bg: string; fg: string }> = {
  open: { label: "Đã gửi, chờ xem", bg: colors.subtle, fg: colors.inkSoft },
  reviewing: { label: "Đang xử lý", bg: colors.warningSoft, fg: colors.warning },
  resolved: { label: "Đã xử lý", bg: colors.successSoft, fg: colors.success },
  rejected: { label: "Đã xem, không vi phạm", bg: colors.subtle, fg: colors.muted },
}

const inputStyle = {
  minHeight: 96,
  backgroundColor: colors.subtle,
  borderRadius: radius.md,
  padding: 14,
  fontFamily: fonts[400],
  fontSize: 15,
  color: colors.ink,
  textAlignVertical: "top" as const,
}

/**
 * "Báo cáo vấn đề": a problem during a job, after it, or with the app, sent
 * with photos and clips; then followed here (status, the staff's questions,
 * the outcome), with more evidence while it is open. Same table and rules as
 * the web (/bao-cao).
 */
export default function Reports() {
  const { uid } = useApp()
  const reports = useAsync(uid ? () => loadMyReports(uid) : null, [uid])
  const [writing, setWriting] = React.useState(false)

  if (!uid) return <EmptyState title="Cần đăng nhập" action="Đăng nhập" onAction={() => router.push("/login")} />

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.canvas }}
        contentContainerStyle={{ padding: gutter, gap: 12, paddingBottom: 48 }}
        refreshControl={refreshControl(reports.refreshing, () => void reports.refresh())}
        keyboardShouldPersistTaps="handled"
      >
        <Txt color={colors.inkSoft}>
          Gặp vấn đề trong lúc dùng 360dep hoặc sau buổi làm? Gửi kèm ảnh, clip làm bằng chứng. Đội ngũ xem trong 24 giờ làm việc, có thể hỏi
          thêm, và báo kết quả tại đây. Phía bên kia không biết ai báo.
        </Txt>
        {writing ? (
          <NewReport
            uid={uid}
            onDone={() => {
              setWriting(false)
              void reports.reload()
            }}
            onCancel={() => setWriting(false)}
          />
        ) : (
          <Button label="Gửi báo cáo mới" icon="flag" onPress={() => setWriting(true)} />
        )}
        <Txt w={700} style={{ marginTop: 8 }}>
          Báo cáo của bạn
        </Txt>
        {reports.error ? <ErrorNote text={reports.error} onRetry={() => void reports.reload()} /> : null}
        {reports.value && reports.value.length === 0 ? (
          <EmptyState title="Bạn chưa gửi báo cáo nào" text="Khi gửi, báo cáo và kết quả xử lý hiện ở đây." />
        ) : null}
        {(reports.value ?? []).map((r) => (
          <ReportItem key={r.id} uid={uid} report={r} onChanged={() => void reports.reload()} />
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function NewReport({ uid, onDone, onCancel }: { uid: string; onDone: () => void; onCancel: () => void }) {
  const [reason, setReason] = React.useState<string>(GENERAL_REPORT_REASONS[0])
  const [detail, setDetail] = React.useState("")
  const [evidence, setEvidence] = React.useState<string[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const submit = async () => {
    if (detail.trim().length < 10 && !evidence.length) return setError("Mô tả ngắn gọn chuyện đã xảy ra (ít nhất 10 ký tự) hoặc gửi kèm ảnh, clip.")
    setBusy(true)
    setError(null)
    const res = await fileReport(uid, { reason, detail, evidencePaths: evidence })
    setBusy(false)
    if (!res.ok) {
      haptic.error()
      return setError(res.error)
    }
    haptic.success()
    onDone()
  }

  return (
    <Card style={{ padding: 14, gap: 12 }}>
      <Txt w={700}>Chuyện gì đã xảy ra?</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {GENERAL_REPORT_REASONS.map((r) => (
          <Chip key={r} label={r} selected={r === reason} onPress={() => setReason(r)} />
        ))}
      </View>
      <TextInput
        value={detail}
        onChangeText={setDetail}
        placeholder="Kể lại: lúc nào, ở đâu, ai liên quan. Liên quan lịch hẹn thì gửi từ chi tiết lịch hẹn sẽ nhanh hơn."
        placeholderTextColor={colors.muted}
        multiline
        maxLength={2000}
        style={inputStyle}
        accessibilityLabel="Chi tiết báo cáo"
      />
      <Txt w={600}>Ảnh, clip làm bằng chứng (nếu có)</Txt>
      <EvidencePicker uid={uid} onChange={setEvidence} onBusyChange={setUploading} />
      {error ? <ErrorNote text={error} /> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          label="Huỷ"
          variant="ghost"
          onPress={() => {
            void removeEvidence(evidence)
            onCancel()
          }}
        />
        <Button label={uploading ? "Đang tải tệp…" : "Gửi báo cáo"} busy={busy} disabled={uploading} onPress={() => void submit()} style={{ flex: 1 }} />
      </View>
    </Card>
  )
}

function ReportItem({ uid, report: r, onChanged }: { uid: string; report: MyReport; onChanged: () => void }) {
  const [adding, setAdding] = React.useState(false)
  const [note, setNote] = React.useState("")
  const [paths, setPaths] = React.useState<string[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const open = r.status === "open" || r.status === "reviewing"
  const status = STATUS[r.status]
  const room = EVIDENCE_MAX - r.evidence.length

  const send = async () => {
    setBusy(true)
    setError(null)
    const res = await addReportEvidence(r.id, paths, note)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    haptic.success()
    setAdding(false)
    setNote("")
    onChanged()
  }

  return (
    <Card style={{ padding: 14, gap: 8, borderWidth: r.staffQuestion && open ? 2 : 0, borderColor: colors.warningSoft }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <View style={{ backgroundColor: status.bg, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Txt v="meta" w={700} color={status.fg}>
            {status.label}
          </Txt>
        </View>
        <Txt w={700} style={{ flexShrink: 1 }}>
          {r.reason}
        </Txt>
      </View>
      <Txt v="meta" color={colors.muted}>
        Gửi {timeAgo(r.createdAt)}
      </Txt>
      {r.detail ? <Txt>{r.detail}</Txt> : null}
      {r.evidence.length ? <EvidenceGrid items={r.evidence} /> : null}
      {r.staffQuestion && open ? (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: 10 }}>
          <Txt>
            <Txt w={700}>360dep cần thêm thông tin: </Txt>
            {r.staffQuestion}
          </Txt>
        </View>
      ) : null}
      {r.resolution && !open ? (
        <View style={{ backgroundColor: colors.subtle, borderRadius: radius.md, padding: 10 }}>
          <Txt>
            <Txt w={700}>Kết quả: </Txt>
            {r.resolution}
          </Txt>
        </View>
      ) : null}
      {r.bookingId ? (
        <Button label="Xem lịch hẹn" variant="ghost" size="sm" onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: r.bookingId! } })} />
      ) : null}
      {open && !adding ? (
        <Button
          label={r.staffQuestion ? "Trả lời & gửi thêm bằng chứng" : "Bổ sung thông tin, ảnh, clip"}
          variant={r.staffQuestion ? "primary" : "secondary"}
          size="sm"
          onPress={() => setAdding(true)}
        />
      ) : null}
      {open && adding ? (
        <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={r.staffQuestion ? "Trả lời câu hỏi của 360dep" : "Thêm chi tiết hoặc diễn biến mới"}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            style={inputStyle}
            accessibilityLabel="Thông tin bổ sung"
          />
          {room > 0 ? <EvidencePicker uid={uid} max={room} onChange={setPaths} onBusyChange={setUploading} /> : <Txt v="meta" color={colors.muted}>Báo cáo đã đủ 8 ảnh, clip.</Txt>}
          {error ? <ErrorNote text={error} /> : null}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label="Huỷ"
              variant="ghost"
              size="sm"
              onPress={() => {
                void removeEvidence(paths)
                setAdding(false)
              }}
            />
            <Button
              label={uploading ? "Đang tải tệp…" : "Gửi bổ sung"}
              size="sm"
              busy={busy}
              disabled={uploading || (!note.trim() && !paths.length)}
              onPress={() => void send()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : null}
    </Card>
  )
}
