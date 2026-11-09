import QRCode from "qrcode"
import { vietQrPayload } from "@/lib/payments/vietqr"

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  const payload = vietQrPayload({ bin: q.get("bin") ?? "", account: q.get("account") ?? "", amount: Number(q.get("amount")), memo: q.get("memo") ?? "" })
  if (!payload) return new Response(null, { status: 400 })
  const png = await QRCode.toBuffer(payload, { type: "png", errorCorrectionLevel: "M", margin: 4, width: 384 })
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } })
}
