/**
 * Identity check (client side): validate and shrink the CCCD + selfie photos, then
 * send them to /api/identity where a vision AI (Gemini) reads the card and compares
 * the portrait with the selfie. Photos stay in memory in the browser and are not
 * stored by dep360 on the server.
 */

export type IdentityImageKind = "front" | "back" | "selfie"

export interface IdentityImage {
  file: File
  url: string
  width: number
  height: number
}

const MAX_BYTES = 15 * 1024 * 1024
/** Longest side sent to the server; keeps the request under hosting body limits. */
const UPLOAD_SIZE = 1600

export function loadImage(file: File): Promise<IdentityImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ file, url, width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Không đọc được ảnh"))
    }
    img.src = url
  })
}

/** Quick quality checks before uploading. Returns a message or null. */
export function checkImage(kind: IdentityImageKind, image: IdentityImage): string | null {
  if (!image.file.type.startsWith("image/")) return "File phải là ảnh (JPG, PNG, HEIC)."
  if (image.file.size > MAX_BYTES) return "Ảnh lớn hơn 15MB, hãy chụp lại."
  const long = Math.max(image.width, image.height)
  const short = Math.min(image.width, image.height)
  if (kind === "selfie") return short < 480 ? "Ảnh selfie quá nhỏ, hãy chụp gần và rõ mặt hơn." : null
  if (long < 800 || short < 500) return "Ảnh CCCD quá nhỏ hoặc mờ, hãy chụp gần hơn."
  const ratio = long / short
  // A CCCD card is ~85.6 × 54 mm (ratio ≈ 1.59); allow margin around the card.
  if (ratio < 1.25 || ratio > 2.1) return "Hãy chụp ngang, để thẻ chiếm gần hết khung hình."
  return null
}

function toJpeg(image: IdentityImage): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, UPLOAD_SIZE / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không xử lý được ảnh"))), "image/jpeg", 0.85)
    }
    img.onerror = () => reject(new Error("Không đọc được ảnh"))
    img.src = image.url
  })
}

export type IdentityResult =
  | { status: "verified"; nameOnCard: string }
  | { status: "review"; reason: string; nameOnCard?: string }
  | { status: "rejected"; reason: string }

export async function verifyIdentity(images: Record<IdentityImageKind, IdentityImage>, profileName: string): Promise<IdentityResult> {
  for (const kind of ["front", "back", "selfie"] as const) {
    const issue = checkImage(kind, images[kind])
    if (issue) return { status: "rejected", reason: issue }
  }
  const body = new FormData()
  for (const kind of ["front", "back", "selfie"] as const) body.append(kind, await toJpeg(images[kind]), `${kind}.jpg`)
  body.append("profileName", profileName)

  const res = await fetch("/api/identity", { method: "POST", body })
  const data = (await res.json().catch(() => null)) as IdentityResult | { error: string } | null
  if (!res.ok || !data || "error" in data) {
    throw new Error(data && "error" in data ? data.error : "Không kết nối được dịch vụ xác minh.")
  }
  return data
}
