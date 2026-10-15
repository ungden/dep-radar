import { readFile } from "node:fs/promises"
import { join } from "node:path"
import {
  BRAND_CREAM,
  BRAND_GOLD,
  BRAND_INK,
  BRAND_ROSE,
  BRAND_ROSE_LIGHT,
  BRAND_SPARKLE,
  LOGO_BOX,
  LOGO_FACE_PATH,
  LOGO_RADIUS,
  LOGO_SPARKLE_PATH,
  WORDMARK_BOX,
  WORDMARK_PATH,
  logoTransform,
} from "@/lib/design/brand"

/**
 * Shared pieces of the share images (app/**\/opengraph-image.tsx): what Zalo,
 * Facebook and Messenger show when a link is pasted. 1200×630, the site's own
 * face (Be Vietnam Pro, bundled in app/_og, see next.config outputFileTracingIncludes)
 * and the 360đẹp mark, so every shared link looks like the brand.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG = { ink: "#141213", soft: "#3D3739", canvas: "#FAF8F5", rose: "#BB3460", subtle: "#F2EFEA" }

export async function ogFonts() {
  const dir = join(process.cwd(), "app/_og")
  const load = (w: string) => readFile(join(dir, `BeVietnamPro-${w}.ttf`))
  const [regular, bold, extra] = await Promise.all([load("Regular"), load("Bold"), load("ExtraBold")])
  return [
    { name: "Be Vietnam Pro", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Be Vietnam Pro", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Be Vietnam Pro", data: extra, weight: 800 as const, style: "normal" as const },
  ]
}

/** The mark (lib/design/brand.ts), as an <svg> the image renderer draws. */
export function OgMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${LOGO_BOX} ${LOGO_BOX}`}>
      <defs>
        <linearGradient id="og-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BRAND_ROSE_LIGHT} />
          <stop offset="1" stopColor={BRAND_ROSE} />
        </linearGradient>
      </defs>
      <rect width={LOGO_BOX} height={LOGO_BOX} rx={LOGO_RADIUS} fill="url(#og-tile)" />
      <g transform={logoTransform()}>
        <path d={LOGO_FACE_PATH} fill={BRAND_CREAM} />
        <path d={LOGO_SPARKLE_PATH} fill={BRAND_SPARKLE} />
      </g>
    </svg>
  )
}

/** The mark and the name, side by side. */
export function OgBrand({ size = 64, tone = "dark" }: { size?: number; tone?: "dark" | "gold" }) {
  const h = size * 0.74
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      <OgMark size={size} />
      <svg height={h} width={(h * WORDMARK_BOX.width) / WORDMARK_BOX.height} viewBox={`0 0 ${WORDMARK_BOX.width} ${WORDMARK_BOX.height}`}>
        <path d={WORDMARK_PATH} fill={tone === "gold" ? BRAND_GOLD : BRAND_INK} />
      </svg>
    </div>
  )
}

/** A remote image's bytes, fetched with a short timeout. Null when it can't be had. */
export async function ogFetch(url: string | undefined | null): Promise<Buffer | null> {
  if (!url || !/^https?:\/\//.test(url)) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null
    const bytes = Buffer.from(await res.arrayBuffer())
    return bytes.length > 8_000_000 ? null : bytes
  } catch {
    return null
  }
}

/**
 * An image cropped to its slot as a JPEG data URL, which the renderer can draw:
 * it can't decode WebP, and a full-size photo bloats the result.
 */
export async function ogCrop(bytes: Buffer, width: number, height: number): Promise<string | null> {
  try {
    const { default: sharp } = await import("sharp")
    const jpeg = await sharp(bytes).rotate().resize(Math.round(width), Math.round(height), { fit: "cover" }).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`
  } catch {
    return null
  }
}

/** A photo for a card slot, or null when there is none and the card goes without. */
export async function ogPhoto(url: string | undefined | null, width = 500, height = 630): Promise<string | null> {
  const bytes = await ogFetch(url)
  return bytes ? ogCrop(bytes, width, height) : null
}

export const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`
