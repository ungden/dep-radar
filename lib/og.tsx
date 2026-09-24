import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { BRAND_DARK, BRAND_GOLD, LOGO_EYE_PATH, LOGO_EYE_STROKE, LOGO_RADIUS, WORDMARK_BOX, WORDMARK_PATH } from "@/lib/design/brand"

/**
 * Shared pieces of the share images (app/**\/opengraph-image.tsx): what Zalo,
 * Facebook and Messenger show when a link is pasted. 1200×630, the site's own
 * face (Be Vietnam Pro, bundled in app/_og, see next.config outputFileTracingIncludes)
 * and the 360đẹp mark, so every shared link looks like the brand.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG = { ink: "#3A2A2C", soft: "#65575A", canvas: "#FAF6F4", rose: "#A8535D", subtle: "#F5ECE9" }

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

/** The mark and the name, side by side. */
export function OgBrand({ size = 64, tone = "dark" }: { size?: number; tone?: "dark" | "gold" }) {
  const h = size * 0.74
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        {tone === "gold" ? (
          // On the espresso ground the tile needs an edge to read as a tile.
          <rect x="0.5" y="0.5" width="31" height="31" rx={LOGO_RADIUS - 0.5} fill={BRAND_DARK} stroke={BRAND_GOLD} strokeOpacity={0.4} strokeWidth={1} />
        ) : (
          <rect width="32" height="32" rx={LOGO_RADIUS} fill={BRAND_DARK} />
        )}
        <path d={LOGO_EYE_PATH} fill="none" stroke={BRAND_GOLD} strokeWidth={LOGO_EYE_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg height={h} width={(h * WORDMARK_BOX.width) / WORDMARK_BOX.height} viewBox={`0 0 ${WORDMARK_BOX.width} ${WORDMARK_BOX.height}`}>
        <path d={WORDMARK_PATH} fill={tone === "gold" ? BRAND_GOLD : BRAND_DARK} />
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
