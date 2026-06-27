"use client"

import { useState } from "react"
import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"

export function Footer() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    setErrorMsg("")

    if (!isSupabaseSchemaReady) {
      setStatus("success")
      setEmail("")
      return
    }

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email })

    if (error) {
      setStatus("error")
      if (error.code === "23505") {
        setErrorMsg("Email này đã được đăng ký rồi!")
      } else {
        setErrorMsg("Đã xảy ra lỗi. Vui lòng thử lại!")
      }
    } else {
      setStatus("success")
      setEmail("")
    }
  }

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-slate-400 py-16">
      <div className="container mx-auto px-4 md:px-6 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-6">
          <BrandLogo variant="dark" />
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            360 độ đẹp - nền tảng catalogue, review mỹ phẩm và kiến thức làm đẹp có kiểm chứng cho người dùng Việt Nam.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-slate-400 hover:text-white transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-white transition-colors">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-white transition-colors">
              <Youtube className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
            Chuyên mục
          </h4>
          <ul className="space-y-3 text-sm font-medium">
            <li>
              <Link href="/catalogue/da-mat" className="hover:text-rose-500 transition-colors">
                Da mặt / Skincare
              </Link>
            </li>
            <li>
              <Link href="/catalogue/tri-mun" className="hover:text-rose-500 transition-colors">
                Trị mụn
              </Link>
            </li>
            <li>
              <Link href="/catalogue/sang-da-chong-nang" className="hover:text-rose-500 transition-colors">
                Sáng da & chống nắng
              </Link>
            </li>
            <li>
              <Link href="/catalogue/product-radar" className="hover:text-rose-500 transition-colors">
                Review sản phẩm
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
            Thông tin
          </h4>
          <ul className="space-y-3 text-sm font-medium">
            <li>
              <Link href="#" className="hover:text-rose-500 transition-colors">
                Về chúng tôi
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-rose-500 transition-colors">
                Liên hệ quảng cáo
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-rose-500 transition-colors">
                Chính sách bảo mật
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-rose-500 transition-colors">
                Điều khoản sử dụng
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
            Newsletter
          </h4>
          <p className="text-sm text-slate-400">
            Đăng ký để nhận những bài viết mới nhất và xu hướng làm đẹp mỗi tuần.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex h-12 w-full rounded-xl border border-slate-700 bg-slate-800 dark:bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-rose-600 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Đang gửi..." : "Đăng ký ngay"}
            </button>
            {status === "success" && (
              <p className="text-sm text-emerald-400 font-medium">Đăng ký thành công!</p>
            )}
            {status === "error" && (
              <p className="text-sm text-rose-400 font-medium">{errorMsg}</p>
            )}
          </form>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        <div>&copy; {new Date().getFullYear()} 360 độ đẹp. All rights reserved.</div>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  )
}
