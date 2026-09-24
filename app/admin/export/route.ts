import { isAdmin } from "@/lib/api/admin"
import { supabaseServer } from "@/lib/supabase/server"
import { localDate, localTime } from "@/lib/utils"

/**
 * CSV files for the accountant: /admin/export?kind=bookings|pros|wallet&from=YYYY-MM-DD&to=YYYY-MM-DD.
 *
 *  * bookings: every booking completed (or created, if not completed) in the
 *    period, with the price breakdown and 360đẹp's commission, which is the
 *    company's revenue to invoice and declare.
 *  * pros: per freelancer, the revenue they took from customers and the fee,
 *    with the name on their ID card: what a platform reports to the tax office
 *    about its sellers.
 *  * wallet: every wallet movement (transfers in, fees, corrections), to match
 *    against the bank statement.
 *
 * Admins only: the middleware already turns others away, and each RPC checks
 * is_admin() again. UTF-8 with a BOM, so Excel shows Vietnamese correctly.
 */
const DATE = /^\d{4}-\d{2}-\d{2}$/

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n"
const at = (v: unknown) => (v ? `${localDate(String(v))} ${localTime(String(v))}` : "")

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 })
  const url = new URL(req.url)
  const kind = url.searchParams.get("kind")
  const from = url.searchParams.get("from") ?? ""
  const to = url.searchParams.get("to") ?? ""
  if (!DATE.test(from) || !DATE.test(to) || from > to) return new Response("Khoảng ngày không hợp lệ", { status: 400 })
  const supabase = await supabaseServer()
  const args = { p_from: from, p_to: to } as never

  let body: string
  if (kind === "bookings") {
    const { data, error } = await supabase.rpc("admin_finance_bookings" as never, args)
    if (error) return new Response(error.message, { status: 500 })
    body = csv(
      ["Mã lịch", "Tạo lúc", "Giờ hẹn", "Hoàn thành lúc", "Trạng thái", "Khách", "Người làm", "Dịch vụ", "Gói", "Số lượng",
       "Giá dịch vụ", "Phí di chuyển", "Phí đặt gấp", "Voucher 360dep", "Tổng khách trả", "Tỷ lệ hoa hồng", "Hoa hồng 360dep", "Thanh toán"],
      ((data ?? []) as Record<string, unknown>[]).map((r) => [
        r.booking_id, at(r.created_at), at(r.starts_at), at(r.completed_at), r.status, r.customer_name, r.pro_name,
        r.template_id, r.variant_id, r.quantity, r.service_price, r.travel_fee, r.urgent_fee, r.discount, r.total,
        r.commission_rate, r.commission, r.payment_method === "cash" ? "Trả trực tiếp" : "Online",
      ]),
    )
  } else if (kind === "pros") {
    const { data, error } = await supabase.rpc("admin_finance_by_pro" as never, args)
    if (error) return new Response(error.message, { status: 500 })
    body = csv(
      ["Người làm", "Họ tên trên CCCD", "Xác minh", "Số điện thoại", "Quận/huyện", "Tỉnh/thành", "Số lịch hoàn thành",
       "Doanh thu từ khách", "Hoa hồng 360dep", "Đã nạp ví", "Số dư ví hiện tại", "Hồ sơ"],
      ((data ?? []) as Record<string, unknown>[]).map((r) => [
        r.display_name, r.name_on_card ?? "", r.identity === "verified" ? "Đã xác minh" : "Chưa", r.phone, r.district, r.city,
        r.completed, r.gmv, r.commission, r.topups, r.balance, `https://www.360dep.vn/pros/${r.slug}`,
      ]),
    )
  } else if (kind === "wallet") {
    const { data, error } = await supabase.rpc("admin_wallet_entries" as never, args)
    if (error) return new Response(error.message, { status: 500 })
    const kinds: Record<string, string> = {
      topup: "Nạp ví", commission: "Phí dịch vụ", adjustment: "Điều chỉnh", refund: "Hoàn tiền",
      no_show_comp: "Bù khách vắng mặt", voucher: "Voucher 360dep trả", referral: "Thưởng giới thiệu",
    }
    body = csv(
      ["Mã", "Thời điểm", "Người làm", "Loại", "Số tiền", "Mã giao dịch", "Ghi chú", "Mã lịch"],
      ((data ?? []) as Record<string, unknown>[]).map((r) => [
        r.entry_id, at(r.created_at), r.pro_name, kinds[String(r.kind)] ?? r.kind, r.amount, r.ref ?? "", r.note ?? "", r.booking_id ?? "",
      ]),
    )
  } else {
    return new Response("kind phải là bookings, pros hoặc wallet", { status: 400 })
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="360dep-${kind}-${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
