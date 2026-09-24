import { ImageResponse } from "next/og"
import { getProBySlug, listProServices, listWorks } from "@/lib/api/pros"
import { absoluteUrl } from "@/lib/env"
import { OG, OG_SIZE, OgBrand, ogFonts, ogPhoto, vnd } from "@/lib/og"
import { showsAverage } from "@/lib/connection"

export const alt = "Hồ sơ người làm trên 360đẹp"
export const size = OG_SIZE
export const contentType = "image/png"

/**
 * What a shared profile link shows in Zalo or Facebook: their best photo, name,
 * trade, city, rating and lowest price, with the 360đẹp mark. The photo is the
 * first post's (the avatar is often a small square selfie).
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const pro = await getProBySlug((await params).id).catch(() => null)
  const fonts = await ogFonts()
  if (!pro) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: OG.canvas }}>
        <OgBrand size={96} />
      </div>,
      { ...size, fonts },
    )
  }
  const [works, services] = await Promise.all([
    listWorks({ proId: pro.id, limit: 3 }).catch(() => []),
    listProServices(pro.id).catch(() => []),
  ])
  const first = works.flatMap((w) => w.images)[0] ?? pro.avatar
  const photo = await ogPhoto(first ? (first.startsWith("/") ? absoluteUrl(first) : first) : null)
  const prices = services.filter((s) => s.active).flatMap((s) => Object.values(s.prices)).filter((n) => n > 0)
  const from = prices.length ? Math.min(...prices) : null
  // No "★": the bundled font has no star, so the text says it.
  const rating = showsAverage(pro.rating.count) ? `${pro.rating.average.toFixed(1)}/5 · ${pro.rating.count} đánh giá` : "Mới trên 360đẹp"

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: OG.canvas, fontFamily: "Be Vietnam Pro" }}>
      {photo && (
        <img src={photo} alt="" width={500} height={630} style={{ width: 500, height: 630, objectFit: "cover" }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: 64 }}>
        <OgBrand size={60} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: photo ? 60 : 76, fontWeight: 800, color: OG.ink, letterSpacing: -2, lineHeight: 1.05 }}>{pro.name}</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 30, color: OG.soft, lineHeight: 1.35 }}>
            <div>{pro.title}</div>
            <div>{`${pro.district}, ${pro.city}`}</div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            <div style={{ display: "flex", background: OG.subtle, color: OG.ink, fontSize: 28, fontWeight: 700, borderRadius: 999, padding: "10px 22px" }}>
              {rating}
            </div>
            {from && (
              <div style={{ display: "flex", background: OG.rose, color: "#fff", fontSize: 28, fontWeight: 700, borderRadius: 999, padding: "10px 22px" }}>
                {`Từ ${vnd(from)}`}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 26, color: OG.soft }}>Xem tác phẩm và đặt lịch · 360dep.vn</div>
      </div>
    </div>,
    { ...size, fonts },
  )
}
