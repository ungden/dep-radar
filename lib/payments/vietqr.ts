export type BankInvoice = {
  memo: string; amount: number; bin: string; account: string; holder: string; expiresAt: string
  paidAt: string | null; payable: boolean
}
export type BookingCheckout = {
  canIssue: boolean; invoice: BankInvoice | null; refundDue: boolean; artistDue: boolean
  cashout: { kind: "refund" | "artist"; state: "queued" | "processing" | "sent"; amount: number; sentAt: string | null } | null
}

const tlv = (tag: string, value: string) => tag + String(value.length).padStart(2, "0") + value

/** NAPAS VietQR: ASCII tags with a CCITT-FALSE checksum; no third-party image call. */
export function vietQrPayload({ bin, account, amount, memo }: Pick<BankInvoice, "bin" | "account" | "amount" | "memo">): string | null {
  if (!/^\d{6}$/.test(bin) || !/^\d{4,20}$/.test(account) || !/^DB[A-F0-9]{16}$/.test(memo)
    || !Number.isSafeInteger(amount) || amount <= 0 || amount > 2_147_483_647) return null
  const receiver = tlv("00", bin) + tlv("01", account)
  const merchant = tlv("00", "A000000727") + tlv("01", receiver) + tlv("02", "QRIBFTTA")
  const body = tlv("00", "01") + tlv("01", "12") + tlv("38", merchant) + tlv("53", "704")
    + tlv("54", String(amount)) + tlv("58", "VN") + tlv("62", tlv("08", memo)) + "6304"
  let crc = 0xffff
  for (const ch of body) {
    crc ^= ch.charCodeAt(0) << 8
    for (let i = 0; i < 8; i++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff
  }
  return body + crc.toString(16).padStart(4, "0").toUpperCase()
}

export const bookingQrPath = (i: BankInvoice) =>
  "/api/payments/qr?" + new URLSearchParams({ bin: i.bin, account: i.account, amount: String(i.amount), memo: i.memo })
