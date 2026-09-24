import { ImageResponse } from "next/og"
import { getWorkBySlug } from "@/lib/api/pros"
import { absoluteUrl } from "@/lib/env"
import { OG, OG_SIZE, OgBrand, ogFonts, ogPhoto } from "@/lib/og"

export const alt = "Tác phẩm trên 360đẹp"
export const size = OG_SIZE
export const contentType = "image/png"

/**
 * A shared work: the photo itself, square on the left, with its title and who
 * made it. Drawn as PNG because the stored photos are often WebP, which Zalo
 * does not show as a link preview.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const work = await getWorkBySlug((await params).id).catch(() => null)
  const fonts = await ogFonts()
  const first = work?.images[0]
  const photo = await ogPhoto(first ? (first.startsWith("/") ? absoluteUrl(first) : first) : null, 630, 630)
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: OG.canvas, fontFamily: "Be Vietnam Pro" }}>
      {photo && <img src={photo} alt="" width={630} height={630} style={{ width: 630, height: 630, objectFit: "cover" }} />}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: 64 }}>
        <OgBrand size={56} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: photo ? 54 : 76, fontWeight: 800, color: OG.ink, letterSpacing: -1.5, lineHeight: 1.08 }}>
            {work?.title ?? "Tác phẩm làm đẹp, chụp ảnh"}
          </div>
          {work && <div style={{ display: "flex", fontSize: 30, color: OG.soft }}>{`bởi ${work.proName}`}</div>}
        </div>
        <div style={{ fontSize: 26, color: OG.soft }}>Xem thêm và đặt lịch · 360dep.vn</div>
      </div>
    </div>,
    { ...size, fonts },
  )
}
