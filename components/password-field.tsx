"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { inputClass } from "@/components/ui"
import { cn } from "@/lib/utils"

export function FieldError({ text }: { text: string | null | undefined }) {
  if (!text) return null
  return (
    <span role="alert" className="mt-1 block text-[13px] text-danger">
      {text}
    </span>
  )
}

/** A password input with a show/hide eye, so a phone keyboard typo can be checked. */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: "current-password" | "new-password"
  hint?: string
  error?: string | null
}) {
  const [shown, setShown] = React.useState(false)
  const inputId = React.useId()
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={shown ? "text" : "password"}
          className={cn(inputClass, "pr-12", error && "border-danger")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-muted hover:text-ink"
        >
          {shown ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      <FieldError text={error} />
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </div>
  )
}
