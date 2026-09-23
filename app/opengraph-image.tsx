import { ImageResponse } from "next/og"

export const alt = "360dep — Đặt thợ làm đẹp, người chụp ảnh và người mẫu gần bạn"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Colours are lib/design/tokens.ts; this file cannot import CSS variables. */
const INK = "#3A2A2C"
const CANVAS = "#FAF6F4"
const ACCENT = "#A8535D"
const SUBTLE = "#F5ECE9"

export default function OpengraphImage() {
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
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill={ACCENT} />
            <circle cx="15.5" cy="16.5" r="7.6" fill="none" stroke="#fff" strokeWidth="3.4" />
            <circle cx="24" cy="8" r="2.8" fill="#F6E6E6" />
          </svg>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: ACCENT, letterSpacing: -1 }}>360dep</div>
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
    size,
  )
}
