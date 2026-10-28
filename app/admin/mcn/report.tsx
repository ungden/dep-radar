"use client";
import { useEffect, useState } from "react";
import {
  mcnAdminReport,
  scheduleMcnPolicy,
  cancelMcnPolicy,
} from "@/lib/api/mcn";
import type { McnAdminReport } from "@/lib/mcn-admin-types";
import { sumMcn, ratio, eventNames } from "@/lib/mcn-report";
import { formatPrice, todayISO } from "@/lib/utils";
import { Card, Button, inputClass } from "@/app/admin/ui";
import { McnFeedback, useMcnAction } from "@/app/mcn/common";

export function McnReport({
  onSelect,
  organizations,
}: {
  onSelect: (id: string) => void;
  organizations: { id: string; name: string }[];
}) {
  const today = todayISO();
  const [from, setFrom] = useState(today.slice(0, 7) + "-01");
  const [to, setTo] = useState(today);
  const [org, setOrg] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<McnAdminReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState("");
  const [sort, setSort] = useState<"revenue" | "eligible" | "recovery">(
    "revenue",
  );
  const action = useMcnAction();
  const requestKey = `${from}|${to}|${org}|${offset}|${action.busy}`;
  useEffect(() => {
    let live = true;
    if (action.busy) return;
    void mcnAdminReport(from, to, org || null, offset)
      .then((r) => {
        if (!live) return;
        setLoadedKey(requestKey);
        if (r.ok) {
          setData(r.data);
          setError("");
        } else {
          setData(null);
          setError(r.error);
        }
        setLoading(false);
      })
      .catch(() => {
        if (live) {
          setLoadedKey(requestKey);
          setError("Chưa tải được báo cáo. Hãy thử lại.");
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [from, to, org, offset, action.busy, requestKey]);
  const rows = data?.networks ?? [];
  const sum = (k: Parameters<typeof sumMcn>[1]) => sumMcn(rows, k);
  const range = `from=${from}&to=${to}${org ? "&org=" + org : ""}`;
  return (
    <section aria-label="Dashboard MCN" className="mb-8 space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <label className="text-meta">
          Từ ngày
          <input
            aria-label="Báo cáo từ ngày"
            type="date"
            value={from}
            max={to}
            className={inputClass}
            onChange={(e) => {
              setFrom(e.target.value);
              setOffset(0);
            }}
          />
        </label>
        <label className="text-meta">
          Đến ngày
          <input
            aria-label="Báo cáo đến ngày"
            type="date"
            value={to}
            min={from}
            className={inputClass}
            onChange={(e) => {
              setTo(e.target.value);
              setOffset(0);
            }}
          />
        </label>
        <Button
          variant="ghost"
          onClick={() => {
            setFrom(today.slice(0, 7) + "-01");
            setTo(today);
            setOffset(0);
          }}
        >
          Tháng này
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setFrom(
              new Date(new Date(today + "T00:00:00Z").getTime() - 29 * 86400000)
                .toISOString()
                .slice(0, 10),
            );
            setTo(today);
            setOffset(0);
          }}
        >
          30 ngày
        </Button>
        <label className="text-meta">
          Network
          <select
            className={inputClass}
            value={org}
            onChange={(e) => {
              setOrg(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Tất cả network</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </Card>
      {loading || loadedKey !== requestKey ? (
        <p role="status">Đang tải báo cáo…</p>
      ) : error ? (
        <p role="alert" className="text-danger">
          {error}
        </p>
      ) : (
        data && (
          <>
            <p className="text-meta text-muted">
              Doanh thu và phí theo ngày hoàn thành; chi trả theo ngày chuyển.
              Công nợ và trạng thái network là số hiện tại. Múi giờ Việt Nam.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Network hoạt động / chờ duyệt",
                  `${rows.filter((r) => r.status === "approved").length} / ${rows.filter((r) => r.status === "pending").length}`,
                ],
                [
                  "KTV đang tham gia / có đơn trong kỳ",
                  `${sum("active")} / ${sum("working")}`,
                ],
                ["Giá trị dịch vụ hoàn thành", formatPrice(sum("revenue"))],
                [
                  "Phí KTV / sàn giữ trước chi phí",
                  `${formatPrice(sum("fee"))} / ${formatPrice(sum("fee") - sum("earned"))}`,
                ],
                ["Hoa hồng MCN phát sinh", formatPrice(sum("earned"))],
                ["Đã chuyển trong kỳ", formatPrice(sum("paid"))],
                [
                  "Đủ điều kiện / đang giữ hiện tại",
                  `${formatPrice(sum("eligible"))} / ${formatPrice(sum("held"))}`,
                ],
                [
                  "Cần thu hồi / có thể chi sau bù trừ",
                  `${formatPrice(sum("recovery"))} / ${formatPrice(rows.reduce((s, r) => s + (r.status === "approved" && r.eligible - r.recovery >= data.policy.minimumPayout ? r.eligible - r.recovery : 0), 0))}`,
                ],
              ].map(([label, value]) => (
                <Card key={label} className="p-4">
                  <p className="text-label text-muted">{label}</p>
                  <p className="mt-2 text-lg font-bold break-words">{value}</p>
                </Card>
              ))}
            </div>
            <Card className="p-4">
              <h2 className="font-bold">Tuyển chọn & chất lượng</h2>
              <p className="mt-2 text-meta">
                {sum("invited")} lời mời trong kỳ → {sum("joined")} đã gia nhập
                ({ratio(sum("joined"), sum("invited"))}) → {sum("activated")} đã
                có đơn hoàn thành ({ratio(sum("activated"), sum("joined"))}).
                Kết quả của nhóm lời mời trong kỳ, tính đến hiện tại.
              </p>
              <p className="mt-2 text-meta">
                {sum("completed")} đơn hoàn thành trong kỳ. Trong{" "}
                {sum("created")} đơn tạo trong kỳ: huỷ{" "}
                {ratio(sum("cancelled"), sum("created"))}, vắng{" "}
                {ratio(sum("no_shows"), sum("created"))}, có báo cáo{" "}
                {ratio(sum("reported"), sum("created"))}. Đơn chưa kết thúc vẫn
                nằm trong mẫu số.
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="font-bold">
                Giá trị dịch vụ hoàn thành theo ngày
              </h2>
              {!data.daily.length ? (
                <p className="mt-3 text-meta text-muted">
                  Chưa có đơn hoàn thành trong kỳ.
                </p>
              ) : (
                <div className="mt-4 max-h-64 overflow-auto space-y-2">
                  {data.daily.map((d) => (
                    <div
                      key={d.day}
                      className="grid grid-cols-[6rem_1fr_7rem] gap-2 items-center text-label"
                    >
                      <span>{d.day}</span>
                      <div className="bg-subtle rounded">
                        <div
                          className="h-5 rounded bg-accent"
                          style={{
                            width: `${Math.max(1, (100 * d.revenue) / Math.max(...data.daily.map((x) => x.revenue), 1))}%`,
                          }}
                        />
                      </div>
                      <span className="text-right">
                        {formatPrice(d.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-4">
              <div className="flex flex-wrap gap-3 justify-between">
                <h2 className="font-bold">
                  So sánh network & đối soát tập trung
                </h2>
                <select
                  aria-label="Sắp xếp network"
                  className={inputClass}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                >
                  <option value="revenue">Doanh thu cao nhất</option>
                  <option value="eligible">Đủ điều kiện cao nhất</option>
                  <option value="recovery">Cần thu hồi cao nhất</option>
                </select>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-meta">
                  <thead>
                    <tr>
                      {[
                        "Network",
                        "KTV",
                        "Dịch vụ",
                        "Phí",
                        "MCN",
                        "Sàn giữ",
                        "Đã chi",
                        "Đủ điều kiện",
                        "Đang giữ",
                        "Thu hồi",
                        "Thực chi dự kiến",
                      ].map((h) => (
                        <th key={h} className="p-2 text-left whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows]
                      .sort((a, b) => b[sort] - a[sort])
                      .map((r) => (
                        <tr key={r.id} className="border-t border-line">
                          <td className="p-2">
                            <button
                              className="underline text-left"
                              onClick={() => onSelect(r.id)}
                            >
                              {r.name}
                            </button>
                          </td>
                          {[
                            r.active,
                            ...[
                              r.revenue,
                              r.fee,
                              r.earned,
                              r.fee - r.earned,
                              r.paid,
                              r.eligible,
                              r.held,
                              r.recovery,
                            ].map(formatPrice),
                            r.status === "approved" &&
                            r.eligible - r.recovery >= data.policy.minimumPayout
                              ? formatPrice(r.eligible - r.recovery)
                              : "Chưa đủ điều kiện",
                          ].map((v, i) => (
                            <td key={i} className="p-2 whitespace-nowrap">
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!rows.length && (
                <p className="p-3 text-muted">Chưa có network phù hợp.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  ["networks", "Tổng hợp network"],
                  ["commissions", "Sổ hoa hồng"],
                  ["payouts", "Lịch sử chi trả"],
                  ["events", "Nhật ký"],
                ].map(([kind, label]) => (
                  <a
                    key={kind}
                    className="underline text-meta"
                    href={`/admin/mcn/export?kind=${kind}&${range}`}
                  >
                    CSV · {label}
                  </a>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h2 className="font-bold">Nhật ký MCN</h2>
              <p className="mt-1 text-label text-muted">
                Theo khoảng ngày và network đã chọn. Mỗi trang 200 thao tác.
              </p>
              <ul className="mt-3 max-h-96 overflow-auto divide-y divide-line">
                {data.events.slice(0, 200).map((e) => (
                  <li key={e.id} className="py-3 text-meta">
                    <p className="font-semibold">
                      {eventNames[e.action] ?? e.action} ·{" "}
                      {e.organization ?? "Chính sách toàn hệ thống"}
                    </p>
                    <p>
                      {e.actor} ·{" "}
                      {new Date(e.created_at).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </p>
                    <p className="break-all text-label text-muted">
                      Đối tượng: {e.target_id ?? "—"} ·{" "}
                      {JSON.stringify(e.detail)}
                    </p>
                  </li>
                ))}
              </ul>
              {!data.events.length && (
                <p className="mt-3 text-meta text-muted">
                  Không có thao tác trong kỳ.
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="ghost"
                  disabled={!offset}
                  onClick={() => setOffset(Math.max(0, offset - 200))}
                >
                  Trang trước
                </Button>
                <Button
                  variant="ghost"
                  disabled={data.events.length <= 200}
                  onClick={() => setOffset(offset + 200)}
                >
                  Trang sau
                </Button>
              </div>
            </Card>
            <PolicyPanel data={data} action={action} />
          </>
        )
      )}
    </section>
  );
}
function PolicyPanel({
  data,
  action,
}: {
  data: McnAdminReport;
  action: ReturnType<typeof useMcnAction>;
}) {
  const [now] = useState(() => Date.now());
  const [share, setShare] = useState(data.policy.feeShareRate * 100),
    [hold, setHold] = useState(data.policy.holdDays),
    [minimum, setMinimum] = useState(data.policy.minimumPayout),
    [date, setDate] = useState(""),
    [reason, setReason] = useState(""),
    [confirm, setConfirm] = useState(false);
  return (
    <Card className="p-4">
      <h2 className="font-bold">Chính sách MCN & lịch hiệu lực</h2>
      <p className="mt-2 text-meta">
        Phí KTV 20%. Hiện MCN nhận {data.policy.feeShareRate * 100}% khoản phí;
        giữ {data.policy.holdDays} ngày; chi tối thiểu{" "}
        {formatPrice(data.policy.minimumPayout)}. Thay đổi báo trước ít nhất 24
        giờ. Booking mới chốt tỷ lệ và thời gian giữ; ngưỡng chi áp dụng tại lúc
        đối soát.
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void action
            .run(
              () =>
                scheduleMcnPolicy({
                  effectiveAt: new Date(date + ":00+07:00").toISOString(),
                  feeShareRate: share / 100,
                  holdDays: hold,
                  minimumPayout: minimum,
                  reason,
                }),
              "Đã đặt lịch chính sách.",
            )
            .then((ok) => {
              if (ok) {
                setConfirm(false);
                setReason("");
              }
            });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["MCN nhận % khoản phí", share, setShare, 0, 50],
            ["Giữ đối soát (ngày)", hold, setHold, 7, 90],
            ["Chi tối thiểu (đ)", minimum, setMinimum, 100000, 10000000],
          ].map(([label, value, set, min, max]) => (
            <label className="text-meta" key={String(label)}>
              {String(label)}
              <input
                className={inputClass}
                type="number"
                required
                min={Number(min)}
                max={Number(max)}
                step={1}
                value={Number(value)}
                onChange={(e) =>
                  (set as (v: number) => void)(Number(e.target.value))
                }
              />
            </label>
          ))}
          <label className="text-meta">
            Hiệu lực (giờ Việt Nam)
            <input
              required
              type="datetime-local"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <label className="block text-meta">
          Lý do / thông báo chính sách
          <textarea
            required
            minLength={10}
            maxLength={1000}
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <label className="flex gap-2 text-meta">
          <input
            type="checkbox"
            required
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          Đã rà soát điều khoản và kế hoạch thông báo cho đối tác.
        </label>
        <McnFeedback value={action.feedback} />
        <Button disabled={action.busy || !confirm}>Đặt lịch áp dụng</Button>
      </form>
      <ul className="mt-5 divide-y divide-line">
        {data.policies.map((p) => (
          <li key={p.id} className="py-3 text-meta">
            <strong>
              {new Date(p.effective_at).toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </strong>{" "}
            · MCN {p.share_rate * 100}% phí · {p.hold_days} ngày ·{" "}
            {formatPrice(p.minimum_payout)}
            {p.cancelled_at ? " · Đã huỷ" : ""}
            <p className="mt-1">{p.reason}</p>
            {!p.cancelled_at && new Date(p.effective_at).getTime() > now && (
              <Button
                variant="ghost"
                disabled={action.busy || reason.trim().length < 10}
                onClick={() =>
                  void action.run(
                    () => cancelMcnPolicy(p.id, reason),
                    "Đã huỷ lịch chính sách.",
                  )
                }
              >
                Huỷ lịch (nhập lý do ở trên)
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
