import { isAdmin } from "@/lib/api/admin";
import { mcnAdminReport } from "@/lib/api/mcn";
import { supabaseAdmin } from "@/lib/supabase/server";
import { mcnCsv, eventNames } from "@/lib/mcn-report";
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const q = new URL(req.url).searchParams;
  const from = q.get("from") ?? "",
    to = q.get("to") ?? "",
    kind = q.get("kind") ?? "",
    org = q.get("org");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    from > to ||
    !["networks", "commissions", "payouts", "events"].includes(kind) ||
    (org && !/^[0-9a-f-]{36}$/i.test(org))
  )
    return new Response("Bộ lọc không hợp lệ", { status: 400 });
  const report = await mcnAdminReport(from, to, org);
  if (!report.ok) return new Response(report.error, { status: 400 });
  let headers: string[], rows: unknown[][];
  if (kind === "networks") {
    headers = [
      "Network ID",
      "Network",
      "Trạng thái",
      "KTV hiện tại",
      "Mời trong kỳ",
      "Đã gia nhập",
      "Có đơn đầu tiên",
      "KTV có đơn trong kỳ",
      "Đơn tạo",
      "Huỷ",
      "Vắng",
      "Có báo cáo",
      "Hoàn thành",
      "Dịch vụ",
      "Phí KTV",
      "MCN phát sinh",
      "Sàn giữ trước chi phí",
      "Đã chi trong kỳ",
      "Đủ điều kiện hiện tại",
      "Đang giữ hiện tại",
      "Cần thu hồi",
    ];
    rows = report.data.networks.map((r) => [
      r.id,
      r.name,
      r.status,
      r.active,
      r.invited,
      r.joined,
      r.activated,
      r.working,
      r.created,
      r.cancelled,
      r.no_shows,
      r.reported,
      r.completed,
      r.revenue,
      r.fee,
      r.earned,
      r.fee - r.earned,
      r.paid,
      r.eligible,
      r.held,
      r.recovery,
    ]);
  } else {
    const table = {
      commissions: "mcn_commissions",
      payouts: "mcn_payouts",
      events: "mcn_events",
    }[kind]!;
    const date =
      kind === "commissions"
        ? "completed_at"
        : kind === "payouts"
          ? "paid_at"
          : "created_at";
    const names = new Map(report.data.networks.map((r) => [r.id, r.name]));
    const all: Record<string, unknown>[] = [];
    const service = supabaseAdmin();
    const upper = new Date(to + "T00:00:00+07:00");
    upper.setUTCDate(upper.getUTCDate() + 1);
    for (let offset = 0; ; offset += 1000) {
      let query = service
        .from(table as never)
        .select("*")
        .gte(date, from + "T00:00:00+07:00")
        .lt(date, upper.toISOString())
        .order(date)
        .order("id")
        .range(offset, offset + 999);
      if (org) query = query.eq("organization_id", org);
      const { data, error } = await query;
      if (error)
        return new Response("Không xuất được báo cáo", { status: 500 });
      const page = data as unknown as Record<string, unknown>[];
      all.push(...page);
      if (page.length < 1000) break;
      if (all.length >= 100000)
        return new Response("Báo cáo quá lớn; hãy thu hẹp khoảng ngày.", {
          status: 413,
        });
    }
    const columns =
      kind === "commissions"
        ? [
            "id",
            "booking_id",
            "pro_id",
            "service_price",
            "commission",
            "amount",
            "platform_amount",
            "status",
            "completed_at",
            "available_at",
            "paid_at",
            "payout_id",
            "adjustment_reason",
            "recovery_payout_id",
          ]
        : kind === "payouts"
          ? [
              "id",
              "gross_amount",
              "recovery_amount",
              "amount",
              "bank_reference",
              "paid_at",
              "note",
              "recorded_by",
            ]
          : ["id", "actor_id", "action", "target_id", "detail", "created_at"];
    headers = ["Network ID", "Network", ...columns];
    rows = all.map((r) => [
      r.organization_id,
      names.get(String(r.organization_id)) ?? "Chính sách toàn hệ thống",
      ...columns.map((c) =>
        c === "detail"
          ? JSON.stringify(r[c])
          : c === "action"
            ? (eventNames[String(r[c])] ?? r[c])
            : r[c],
      ),
    ]);
  }
  return new Response(mcnCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="360dep-mcn-${kind}-${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
