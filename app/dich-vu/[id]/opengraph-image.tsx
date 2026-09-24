import { ImageResponse } from "next/og"
import { categoryLabel, getTemplate } from "@/lib/catalog"
import { OG, OG_SIZE, OgBrand, ogFonts, vnd } from "@/lib/og"
import { priceBand } from "@/lib/trade"

export const alt = "Dịch vụ trên 360đẹp"
export const size = OG_SIZE
export const contentType = "image/png"

/** A shared service link: the service, what it includes and its price band. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const template = getTemplate((await params).id)
  const fonts = await ogFonts()
  const band = template ? priceBand(template) : null
  return new ImageResponse(
    <div
      style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 72, background: OG.canvas, fontFamily: "Be Vietnam Pro" }}
    >
      <OgBrand size={64} />
      {template ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: OG.rose }}>{categoryLabel(template.category)}</div>
          <div style={{ fontSize: 80, fontWeight: 800, color: OG.ink, letterSpacing: -2.5, lineHeight: 1.02 }}>{template.name}</div>
          {template.includes?.length ? (
            <div style={{ fontSize: 30, color: OG.soft }}>{template.includes.slice(0, 3).join(" · ")}</div>
          ) : null}
        </div>
      ) : (
        <div style={{ fontSize: 72, fontWeight: 800, color: OG.ink }}>Đặt dịch vụ, xem giá ngay.</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {band && (
          <div style={{ display: "flex", background: OG.rose, color: "#fff", fontSize: 32, fontWeight: 700, borderRadius: 999, padding: "12px 26px" }}>
            {`${vnd(band[0])} – ${vnd(band[1])}`}
          </div>
        )}
        <div style={{ fontSize: 28, color: OG.soft }}>Giá niêm yết · người làm gần bạn · 360dep.vn</div>
      </div>
    </div>,
    { ...size, fonts },
  )
}
