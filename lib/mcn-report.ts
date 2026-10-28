import type { McnNetworkStats } from "./mcn-admin-types";
export const eventNames: Record<string, string> = {
  "organization:apply": "Gửi hồ sơ network",
  "organization:approved": "Duyệt / mở lại network",
  "organization:rejected": "Từ chối hồ sơ",
  "organization:suspended": "Tạm dừng network",
  "membership:invite": "Gửi lời mời",
  "membership:support": "Cập nhật hỗ trợ thành viên",
  "membership:accepted": "KTV chấp thuận gia nhập",
  "membership:declined": "KTV từ chối",
  "membership:left": "KTV rời network",
  "membership:removed": "Kết thúc quản lý",
  "commission:reverse": "Điều chỉnh / thu hồi hoa hồng",
  "payout:record": "Ghi nhận chuyển khoản",
  "policy:policy": "Đặt lịch chính sách",
  "policy:cancel_policy": "Huỷ lịch chính sách",
};
export function sumMcn(rows: McnNetworkStats[], key: keyof McnNetworkStats) {
  return rows.reduce(
    (sum, r) => sum + (typeof r[key] === "number" ? (r[key] as number) : 0),
    0,
  );
}
export function ratio(n: number, d: number) {
  return d ? `${((100 * n) / d).toFixed(1)}%` : "—";
}
/** Spreadsheet formula injection guard, including whitespace before a formula. */
export function mcnCsv(headers: string[], rows: unknown[][]) {
  const cell = (value: unknown) => {
    let s = String(value ?? "");
    if (/^\s*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  return (
    "\uFEFF" +
    [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") +
    "\r\n"
  );
}
