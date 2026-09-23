"use client"

import * as React from "react"
import { X } from "lucide-react"
import { actions } from "@/lib/client-actions"
import { useApp, useRefresh } from "@/lib/store"

/**
 * A friend's link is https://www.360dep.vn/?ref=CODE. The code is kept on this
 * device until the visitor has signed in; then it is entered for them, once,
 * and forgotten whatever the answer. Only a new account that nobody has
 * referred yet is ever asked (claim_referral decides the rest).
 */
const KEY = "dep360_ref"
const CODE = /^[A-HJ-NP-Z2-9]{6}$/

/** A stored friend's code, for the form on /gioi-thieu. Storage can be off: then there is none. */
export function readReferralCode(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function forgetReferralCode() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing stored, nothing to forget.
  }
}

export function ReferralCapture() {
  const { session, referral } = useApp()
  const refresh = useRefresh()
  const tried = React.useRef(false)
  const [notice, setNotice] = React.useState<string | null>(null)

  // Any page can be the landing page; the URL is read once, on arrival.
  React.useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase()
    if (!ref || !CODE.test(ref)) return
    try {
      localStorage.setItem(KEY, ref)
    } catch {
      // Private browsing: the friend can still type the code on /gioi-thieu.
    }
  }, [])

  React.useEffect(() => {
    // Without the referral columns (referral is null) there is nothing to claim against yet.
    if (tried.current || !session || !referral) return
    const code = readReferralCode()
    if (!code) return
    tried.current = true
    if (referral.referredBy) return forgetReferralCode()
    void actions.claimReferral(code).then((result) => {
      forgetReferralCode()
      if ("name" in result) {
        setNotice(`Đã nhận lời giới thiệu từ ${result.name}`)
        refresh()
      }
    })
  }, [session, referral, refresh])

  React.useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(t)
  }, [notice])

  if (!notice) return null
  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[var(--radius-lg)] bg-accent px-4 py-3 text-[14px] font-semibold text-white shadow-[var(--shadow-overlay)]"
    >
      <span className="flex-1">{notice}</span>
      <button type="button" aria-label="Đóng" onClick={() => setNotice(null)} className="-mr-1 inline-flex size-8 items-center justify-center rounded-full hover:bg-white/15">
        <X className="size-4" />
      </button>
    </div>
  )
}
