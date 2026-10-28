import Link from "next/link";
import { mcnAdminReport } from "@/lib/api/mcn";
import { sumMcn } from "@/lib/mcn-report";
import { formatPrice, todayISO } from "@/lib/utils";
export async function McnOverview() {
  const today = todayISO(),
    result = await mcnAdminReport(today.slice(0, 7) + "-01", today);
  if (!result.ok)
    return (
      <Link
        className="mb-5 block rounded-lg border border-line p-4"
        href="/admin/mcn"
      >
        MCN · Chưa tải được số liệu; mở bàn MCN để kiểm tra.
      </Link>
    );
  const rows = result.data.networks,
    pending = rows.filter((r) => r.status === "pending").length;
  const payable = rows.filter(
    (r) =>
      r.status === "approved" &&
      r.eligible - r.recovery >= result.data.policy.minimumPayout,
  );
  return (
    <section className="mb-6 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="font-bold">MCN · Việc cần xử lý & tháng này</h2>
        <Link href="/admin/mcn" className="underline">
          Mở dashboard MCN
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <p>{pending} network chờ duyệt</p>
        <p>
          {payable.length} network đủ ngưỡng chi ·{" "}
          {formatPrice(
            payable.reduce((s, r) => s + r.eligible - r.recovery, 0),
          )}
        </p>
        <p>MCN phát sinh tháng này: {formatPrice(sumMcn(rows, "earned"))}</p>
        <p>Cần thu hồi hiện tại: {formatPrice(sumMcn(rows, "recovery"))}</p>
      </div>
    </section>
  );
}
