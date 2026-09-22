import { ImageResponse } from "next/og"

export const alt = "360dep — Đặt thợ làm đẹp, người chụp ảnh và người mẫu gần bạn"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Colours are lib/design/tokens.ts; this file cannot import CSS variables. */
const INK = "#161413"
const CANVAS = "#FAFAF8"
const ACCENT = "#C42D45"
const SUBTLE = "#F2F0EC"

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
            <rect width="32" height="32" rx="9" fill={INK} />
            <circle cx="15.5" cy="16.5" r="7.6" fill="none" stroke="#fff" strokeWidth="3.4" />
            <circle cx="24" cy="8" r="3.1" fill={ACCENT} />
          </svg>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 800, color: INK, letterSpacing: -2 }}>360dep</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: INK, lineHeight: 1.05, letterSpacing: -2, maxWidth: 960 }}>
            Lên hình đẹp, theo cách của bạn.
          </div>
          <div style={{ fontSize: 32, color: "#4E4845", maxWidth: 960 }}>
            Thợ làm đẹp, người chụp ảnh, quay clip và người mẫu gần bạn. Xem tác phẩm thật, giá rõ trước khi đặt.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {[
            ["Làm đẹp", ACCENT],
            ["Chụp & quay", "#2F55D4"],
            ["Người mẫu", "#7A3E8E"],
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
