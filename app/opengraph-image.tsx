import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { BRAND_DARK, BRAND_GOLD, LOGO_EYE_PATH, LOGO_EYE_STROKE, LOGO_RADIUS, WORDMARK_BOX, WORDMARK_PATH } from "@/lib/design/brand"

export const alt = "360dep — Đặt thợ làm đẹp, người chụp ảnh và người mẫu gần bạn"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Colours are lib/design/tokens.ts; this file cannot import CSS variables. */
const INK = "#3A2A2C"
const CANVAS = "#FAF6F4"
const ACCENT = "#A8535D"
const SUBTLE = "#F5ECE9"

/** The site's own face, so the preview in Zalo or Facebook looks like 360đẹp. */
async function fonts() {
  const dir = join(process.cwd(), "app/_og")
  const load = (w: string) => readFile(join(dir, `BeVietnamPro-${w}.ttf`))
  const [regular, bold, extra] = await Promise.all([load("Regular"), load("Bold"), load("ExtraBold")])
  return [
    { name: "Be Vietnam Pro", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Be Vietnam Pro", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Be Vietnam Pro", data: extra, weight: 800 as const, style: "normal" as const },
  ]
}

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CANVAS,
          padding: 72,
          fontFamily: "Be Vietnam Pro",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 32 32">
            <rect width="32" height="32" rx={LOGO_RADIUS} fill={BRAND_DARK} />
            <path d={LOGO_EYE_PATH} fill="none" stroke={BRAND_GOLD} strokeWidth={LOGO_EYE_STROKE} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg height="62" width={(62 * WORDMARK_BOX.width) / WORDMARK_BOX.height} viewBox={`0 0 ${WORDMARK_BOX.width} ${WORDMARK_BOX.height}`}>
            <path d={WORDMARK_PATH} fill={BRAND_DARK} />
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: INK, lineHeight: 1.05, letterSpacing: -2, maxWidth: 960 }}>
            Lên hình đẹp, theo cách của bạn.
          </div>
          <div style={{ fontSize: 32, color: "#65575A", maxWidth: 960 }}>
            Thợ làm đẹp, người chụp ảnh, quay clip và người mẫu gần bạn. Xem tác phẩm thật, giá rõ trước khi đặt.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {[
            ["Làm đẹp", ACCENT],
            ["Chụp & quay", "#4A67C9"],
            ["Người mẫu", "#86508F"],
          ].map(([t, dot]) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: SUBTLE,
                color: INK,
                fontSize: 28,
                fontWeight: 700,
                padding: "14px 26px",
                borderRadius: 999,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 999, background: dot }} />
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await fonts() },
  )
}
