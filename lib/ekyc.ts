/**
 * Identity verification (CCCD front + back + selfie).
 *
 * Client side we only run quick quality checks so people fix bad photos before
 * submitting. The real check (OCR the CCCD, match the face with the selfie, detect
 * a photo-of-a-photo) must run on the server through an eKYC provider such as
 * VNPT eKYC or FPT.AI — never from the browser, since it needs a secret API key.
 *
 * Images are personal data (Decree 13/2023): collect explicit consent, send them
 * only to the provider, and do not keep them after the result is stored.
 */

export type IdentityImageKind = "front" | "back" | "selfie"

export interface IdentityImage {
  file: File
  url: string
  width: number
  height: number
}

export interface ImageIssue {
  kind: IdentityImageKind
  message: string
}

const MAX_BYTES = 10 * 1024 * 1024

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

/** Returns a message describing what is wrong with the photo, or null when it looks usable. */
export function checkImage(kind: IdentityImageKind, image: IdentityImage): string | null {
  if (!image.file.type.startsWith("image/")) return "File phải là ảnh (JPG, PNG, HEIC)."
  if (image.file.size > MAX_BYTES) return "Ảnh lớn hơn 10MB, hãy chụp lại."
  const long = Math.max(image.width, image.height)
  const short = Math.min(image.width, image.height)
  if (kind === "selfie") {
    if (short < 480) return "Ảnh selfie quá nhỏ, hãy chụp gần và rõ mặt hơn."
    return null
  }
  if (long < 800 || short < 500) return "Ảnh CCCD quá nhỏ hoặc mờ, hãy chụp gần hơn để đọc rõ chữ."
  const ratio = long / short
  // A CCCD card is ~85.6 × 54 mm (ratio ≈ 1.59). Allow some margin around the card.
  if (ratio < 1.25 || ratio > 2.1) return "Hãy chụp ngang, để thẻ chiếm gần hết khung hình."
  return null
}

export type IdentityResult = { status: "verified" } | { status: "rejected"; reason: string }

/**
 * Demo stand-in for the server call. In production:
 *   POST /api/identity  (multipart: front, back, selfie)
 *   -> server forwards to the eKYC provider, stores only the result
 *      (name match, face-match score, liveness) and deletes the images.
 */
export async function verifyIdentity(images: Record<IdentityImageKind, IdentityImage>): Promise<IdentityResult> {
  await new Promise((r) => setTimeout(r, 2500))
  for (const kind of ["front", "back", "selfie"] as const) {
    const issue = checkImage(kind, images[kind])
    if (issue) return { status: "rejected", reason: issue }
  }
  return { status: "verified" }
}
