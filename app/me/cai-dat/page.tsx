"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RequireSession } from "@/components/require-session"
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui"
import { deleteAccount, updateAccount } from "@/lib/api/me"
import { formatPhone } from "@/lib/auth/phone"
import { useApp, useRefresh } from "@/lib/store"

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Cài đặt tài khoản" back="/me" />
      <RequireSession>
        <Settings />
      </RequireSession>
    </div>
  )
}

function Settings() {
  const router = useRouter()
  const refresh = useRefresh()
  const { session } = useApp()
  const [name, setName] = React.useState(session?.name ?? "")
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  return (
    <div className="space-y-5">
      <Field label="Họ và tên">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>

      <Field
        label="Số điện thoại"
        hint="Số điện thoại là tài khoản của bạn. Muốn đổi số, liên hệ hỗ trợ để xác minh lại."
      >
        <input className={inputClass} value={formatPhone(session?.phone ?? "")} disabled />
      </Field>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-success">{message}</p>}

      <Button
        disabled={busy || name.trim().length < 2}
        onClick={async () => {
          setBusy(true)
          setError(null)
          setMessage(null)
          const result = await updateAccount({ fullName: name })
          setBusy(false)
          if (!result.ok) return setError(result.error)
          setMessage("Đã lưu.")
          refresh()
        }}
      >
        {busy ? "Đang lưu…" : "Lưu thay đổi"}
      </Button>

      <Card className="p-4">
        <p className="font-semibold">Dữ liệu của bạn</p>
        <p className="mt-1 text-[13px] text-ink-soft">
          360dep lưu tên, số điện thoại, địa chỉ bạn tự nhập và lịch sử đặt lịch. Ảnh CCCD và ảnh selfie khi xác minh
          không được lưu ở đâu cả. Chi tiết trong{" "}
          <Link href="/chinh-sach" className="text-rose underline underline-offset-2">
            chính sách
          </Link>
          .
        </p>
      </Card>

      {/* Deleting an account is a right under Decree 13/2023, so it is a real
          button here rather than an email to support. */}
      <Card className="p-4 ring-1 ring-danger/30">
        <p className="font-semibold text-danger">Xoá tài khoản</p>
        <p className="mt-1 text-[13px] text-ink-soft">
          Xoá tên, số điện thoại, địa chỉ, mẫu đã lưu và quyền đăng nhập của bạn. Các job đã hoàn thành và đánh giá vẫn
          còn, nhưng không còn gắn với tên bạn — vì đó cũng là hồ sơ của phía bên kia. Không thể hoàn tác.
        </p>
        {confirmDelete ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Giữ tài khoản
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setError(null)
                const result = await deleteAccount()
                setBusy(false)
                if (!result.ok) {
                  setConfirmDelete(false)
                  return setError(result.error)
                }
                router.replace("/")
              }}
            >
              {busy ? "Đang xoá…" : "Xoá vĩnh viễn"}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="mt-3 text-danger" onClick={() => setConfirmDelete(true)}>
            Xoá tài khoản của tôi
          </Button>
        )}
      </Card>
    </div>
  )
}
