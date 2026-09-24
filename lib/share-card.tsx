import type { ImageResponse } from "next/og"
import QRCode from "qrcode"
import { BRAND_DARK, BRAND_GOLD } from "@/lib/design/brand"
import { ogCrop, ogFetch } from "@/lib/og"

/**
 * Images a freelancer saves and posts on their own channels: a Facebook or
 * Instagram story, a feed post, a TikTok cover, a Zalo status. Unlike the link
 * previews (lib/og.tsx) these are the post itself, so they are sized for the
 * phone screen, drawn on the brand's espresso ground, and carry a QR code back
 * to the booking page, since a screenshot has no link to tap.
 */

export const SHARE_FORMATS = {
  /** 9:16, the full phone screen: stories, reels and TikTok covers. */
  story: { width: 1080, height: 1920 },
  /** 4:5, the tallest a feed post shows uncropped on Instagram and Facebook. */
  post: { width: 1080, height: 1350 },
} as const
export type ShareFormat = keyof typeof SHARE_FORMATS
export const isShareFormat = (value: string): value is ShareFormat => value in SHARE_FORMATS

/**
 * Padding that keeps the content clear of what the apps draw on top: a story
 * shows the account name over the top ~200px and the reply bar over the bottom
 * ~250px, which would cover the QR code.
 */
export const SAFE = {
  story: { top: 170, bottom: 240, side: 72 },
  post: { top: 64, bottom: 64, side: 64 },
} as const

export const DARK = { ground: BRAND_DARK, gold: BRAND_GOLD, cream: "#F7EFEA", soft: "#BFAEA7", chip: "#3A2A2D", line: "#4A3639" }

/** A QR code as vector squares: sharp at any size and needing no image fetch. */
export function QrCode({ url, size }: { url: string; size: number }) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" })
  const n = modules.size
  let d = ""
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`
  const pad = size * 0.07
  return (
    <div style={{ display: "flex", width: size, height: size, padding: pad, background: "#FFFFFF", borderRadius: size * 0.1 }}>
      <svg width={size - pad * 2} height={size - pad * 2} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">
        <path d={d} fill={BRAND_DARK} />
      </svg>
    </div>
  )
}

/** A pill on the dark ground. */
export function Chip({ children, strong, size = 30 }: { children: string; strong?: boolean; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: size,
        fontWeight: 700,
        color: strong ? BRAND_DARK : DARK.cream,
        background: strong ? DARK.gold : DARK.chip,
        borderRadius: 999,
        padding: `${size * 0.36}px ${size * 0.8}px`,
      }}
    >
      {children}
    </div>
  )
}

type Slot = { x: number; y: number; w: number; h: number }

/**
 * Where up to three photos go in a box: one fills it; otherwise the first is
 * the hero and the rest share the remaining strip, below it (`column`) or
 * beside it (`row`).
 */
export function mosaic(count: number, w: number, h: number, dir: "column" | "row", gap = 16): Slot[] {
  if (count <= 1) return [{ x: 0, y: 0, w, h }]
  const rest = count - 1
  if (dir === "column") {
    const heroH = Math.round(h * 0.6)
    const stripH = h - heroH - gap
    const each = (w - gap * (rest - 1)) / rest
    return [{ x: 0, y: 0, w, h: heroH }, ...Array.from({ length: rest }, (_, i) => ({ x: i * (each + gap), y: heroH + gap, w: each, h: stripH }))]
  }
  const heroW = Math.round(w * 0.64)
  const stripW = w - heroW - gap
  const each = (h - gap * (rest - 1)) / rest
  return [{ x: 0, y: 0, w: heroW, h }, ...Array.from({ length: rest }, (_, i) => ({ x: heroW + gap, y: i * (each + gap), w: stripW, h: each }))]
}

/** Fetch candidate photos, keep the first `max` that load, and crop them into the mosaic. */
export async function mosaicPhotos(urls: string[], max: number, w: number, h: number, dir: "column" | "row") {
  const fetched = await Promise.all(urls.slice(0, max + 2).map(ogFetch))
  const ok = fetched.filter((b): b is Buffer => b !== null).slice(0, max)
  const slots = mosaic(ok.length, w, h, dir)
  const srcs = await Promise.all(ok.map((b, i) => ogCrop(b, slots[i].w, slots[i].h)))
  return srcs.flatMap((src, i) => (src ? [{ src, ...slots[i] }] : []))
}

/** Photos laid out by `mosaicPhotos`, drawn in a box of the same size. */
export function Mosaic({ photos, w, h, radius }: { photos: { src: string; x: number; y: number; w: number; h: number }[]; w: number; h: number; radius: number }) {
  return (
    <div style={{ display: "flex", position: "relative", width: w, height: h }}>
      {photos.map((p) => (
        // Drawn by the image renderer, not the browser: next/image does not apply.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${p.x}-${p.y}`}
          src={p.src}
          alt=""
          width={p.w}
          height={p.h}
          style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, objectFit: "cover", borderRadius: radius }}
        />
      ))}
    </div>
  )
}

/**
 * The PNG from the renderer as a JPEG: a photo-heavy 1080×1920 PNG runs to
 * several megabytes, which is slow to save on 4G and gets recompressed by every
 * app it is posted to anyway.
 */
export async function asJpeg(image: ImageResponse, fileName: string) {
  const { default: sharp } = await import("sharp")
  const png = Buffer.from(await image.arrayBuffer())
  const jpeg = await sharp(png).jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer()
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `inline; filename="${fileName}"`,
      // Profiles change (new work, new rating) but not by the second.
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    },
  })
}

/** The link as people read it off a picture: no scheme, no www. */
export const shortLink = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "")
