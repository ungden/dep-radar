"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PasswordField } from "@/components/password-field"
import { RequireSession } from "@/components/require-session"
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui"
import { deleteAccount, updateAccount } from "@/lib/api/me"
import { changePassword } from "@/lib/auth/actions"
import { MIN_PASSWORD_LENGTH, isPhoneEmail } from "@/lib/auth/identifier"
import { newPasswordProblem } from "@/lib/auth/password-rules"
import { formatPhone } from "@/lib/auth/phone"
import { useApp, useRefresh } from "@/lib/store"
import { EmailForm } from "../email/email-form"

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
  const login = session?.login
  // An account made with a phone number has a stand-in address until a real one is confirmed.
  const realEmail = login?.email && !isPhoneEmail(login.email) ? login.email : null

  return (
    <div className="space-y-5">
      <Field label="Họ và tên">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>

      {session?.phone ? (
        <Field label="Số điện thoại" hint="Người làm thấy số này khi đã nhận lịch của bạn, cho tới khi lịch kết thúc. Muốn đổi số, liên hệ hỗ trợ.">
          <input className={inputClass} value={formatPhone(session.phone)} disabled />
        </Field>
      ) : (
        <Card className="p-4">
          <p className="font-semibold">Chưa có số điện thoại</p>
          <p className="mt-1 text-[13px] text-ink-soft">Cần số điện thoại trước khi đặt lịch.</p>
          <Link href="/me/so-dien-thoai?next=/me/cai-dat" className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-2">
            Thêm số điện thoại
          </Link>
        </Card>
      )}

      {realEmail ? (
        <Field
          label="Email"
          hint={
            login?.password
              ? "Dùng để đăng nhập và để lấy lại mật khẩu khi quên."
              : "Email của tài khoản bạn dùng để đăng nhập."
          }
        >
          <input className={inputClass} value={realEmail} disabled />
        </Field>
      ) : login ? (
        <Card className="p-4">
          <p className="font-semibold">Chưa có email</p>
          <p className="mt-1 text-[13px] text-ink-soft">Thêm email để lấy lại mật khẩu khi quên. Email cần được xác nhận qua link 360dep gửi tới.</p>
          <div className="mt-3">
            <EmailForm pending={login.pendingEmail} embedded />
          </div>
        </Card>
      ) : null}

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

      {/* Only accounts that have a password; Google and Apple accounts sign in without one. */}
      {login?.password && <ChangePassword />}

      <Card className="p-4">
        <p className="font-semibold">Dữ liệu của bạn</p>
        <p className="mt-1 text-[13px] text-ink-soft">
          360dep lưu tên, số điện thoại, email, địa chỉ bạn tự nhập và lịch sử đặt lịch. Ảnh CCCD và ảnh selfie khi xác minh
          không được lưu ở đâu cả. Chi tiết trong{" "}
          <Link href="/chinh-sach" className="text-accent underline underline-offset-2">
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
          Xoá tên, số điện thoại, email, địa chỉ, mẫu đã lưu và quyền đăng nhập của bạn. Các lịch đã hoàn thành và đánh giá vẫn
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

function ChangePassword() {
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  return (
    <Card className="p-4">
      <p className="font-semibold">Đổi mật khẩu</p>
      <form
        className="mt-3 space-y-3"
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          const problem = newPasswordProblem(next)
          if (!current) return setError("Nhập mật khẩu hiện tại.")
          if (problem) return setError(problem)
          setBusy(true)
          setError(null)
          setDone(false)
          const result = await changePassword({ current, next })
          setBusy(false)
          if (!result.ok) return setError(result.error)
          setCurrent("")
          setNext("")
          setDone(true)
        }}
      >
        <PasswordField label="Mật khẩu hiện tại" value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField
          label="Mật khẩu mới"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự, không chỉ có số.`}
        />
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
        {done && (
          <p role="status" className="text-sm text-success">
            Đã đổi mật khẩu.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" disabled={busy}>
            {busy ? "Đang đổi…" : "Đổi mật khẩu"}
          </Button>
          <Link href="/quen-mat-khau" className="inline-flex min-h-11 items-center text-[13px] text-ink-soft underline underline-offset-2">
            Quên mật khẩu hiện tại?
          </Link>
        </div>
      </form>
    </Card>
  )
}

