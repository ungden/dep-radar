import { ImageResponse } from "next/og"

export const alt = "360dep — Đặt lịch làm đẹp với chuyên viên freelancer"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

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
          background: "#FAFAF8",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              background: "#161413",
              color: "#FAFAF8",
              fontSize: 60,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            d
          </div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: "#2b2322", letterSpacing: -1 }}>
            dep<span style={{ color: "#161413" }}>360</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, color: "#2b2322", lineHeight: 1.1, maxWidth: 900 }}>
            Đẹp hơn mỗi ngày, theo cách của bạn
          </div>
          <div style={{ fontSize: 32, color: "#5b4f4d", maxWidth: 900 }}>
            Đặt lịch nail, makeup, chăm sóc da, tóc, mi & mày, massage với chuyên viên freelancer đến tận nhà.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Giá niêm yết rõ ràng", "Không phí nền tảng", "Chuyên viên đã xác minh"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                background: "#f6e8e6",
                color: "#8f434c",
                fontSize: 26,
                padding: "12px 22px",
                borderRadius: 999,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
