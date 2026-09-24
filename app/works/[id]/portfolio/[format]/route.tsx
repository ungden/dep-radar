import { ImageResponse } from "next/og"
import { getWorkBySlug } from "@/lib/api/pros"
import { absoluteUrl } from "@/lib/env"
import { OgBrand, ogCrop, ogFetch, ogFonts } from "@/lib/og"
import { DARK, QrCode, SAFE, SHARE_FORMATS, asJpeg, isShareFormat, shortLink } from "@/lib/share-card"
import { proBookingUrl } from "@/lib/working-hours"

/**
 * One work as a picture to post: the photo (before and after side by side),
 * its title, who made it, and a QR code to their booking page.
 * /works/<slug>/portfolio/story or /post, a JPEG.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; format: string }> }) {
  const { id, format } = await params
  if (!isShareFormat(format)) return new Response("Not found", { status: 404 })
  const work = await getWorkBySlug(id).catch(() => null)
  if (!work) return new Response("Not found", { status: 404 })

  const story = format === "story"
  const { width, height } = SHARE_FORMATS[format]
  const safe = SAFE[format]
  const boxW = width - safe.side * 2
  const boxH = story ? 940 : 760
  const pair = work.kind === "before_after" && work.images.length >= 2
  const abs = (u: string) => (u.startsWith("/") ? absoluteUrl(u) : u)
  const gap = 12
  const slotW = pair ? (boxW - gap) / 2 : boxW
  const [fonts, ...shots] = await Promise.all([
    ogFonts(),
    ...(pair ? work.images.slice(0, 2) : work.images.slice(0, 1)).map(async (u) => {
      const bytes = await ogFetch(abs(u))
      return bytes ? ogCrop(bytes, slotW, boxH) : null
    }),
  ])
  const photos = shots.filter((s): s is string => s !== null)
  const link = proBookingUrl(work.proSlug)
  const radius = story ? 28 : 24

  const image = new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width, height, padding: `${safe.top}px ${safe.side}px ${safe.bottom}px`, background: DARK.ground, fontFamily: "Be Vietnam Pro", color: DARK.cream }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <OgBrand size={story ? 56 : 48} tone="gold" />
        <div style={{ fontSize: story ? 24 : 21, fontWeight: 700, letterSpacing: 6, color: DARK.gold }}>{pair ? "TRƯỚC & SAU" : "TÁC PHẨM"}</div>
      </div>

      <div style={{ display: "flex", flexShrink: 0, gap, marginTop: story ? 48 : 36, width: boxW, height: boxH }}>
        {photos.length === 0 ? (
          <div style={{ display: "flex", width: boxW, height: boxH, borderRadius: radius, background: DARK.chip }} />
        ) : (
          photos.map((src, i) => (
            <div key={src.slice(-24)} style={{ display: "flex", position: "relative", width: photos.length === 2 ? slotW : boxW, height: boxH }}>
              {/* Drawn by the image renderer, not the browser: next/image does not apply. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" width={photos.length === 2 ? slotW : boxW} height={boxH} style={{ objectFit: "cover", borderRadius: radius }} />
              {photos.length === 2 && (
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    left: 20,
                    top: 20,
                    fontSize: story ? 28 : 24,
                    fontWeight: 700,
                    color: i === 0 ? DARK.cream : DARK.ground,
                    background: i === 0 ? "rgba(42,27,30,0.78)" : DARK.gold,
                    borderRadius: 999,
                    padding: "8px 22px",
                  }}
                >
                  {i === 0 ? "Trước" : "Sau"}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: story ? 14 : 10 }}>
        <div style={{ fontSize: story ? 64 : 52, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08 }}>{work.title}</div>
        <div style={{ display: "flex", fontSize: story ? 34 : 28, color: DARK.gold }}>
          {work.proTitle ? `${work.proName} · ${work.proTitle}` : work.proName}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: story ? 32 : 24, paddingTop: story ? 32 : 24, borderTop: `2px solid ${DARK.line}` }}>
        <QrCode url={link} size={story ? 176 : 128} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: story ? 36 : 30, fontWeight: 700 }}>Quét mã để đặt lịch</div>
          <div style={{ fontSize: story ? 28 : 24, fontWeight: 700, color: DARK.gold }}>{shortLink(link)}</div>
        </div>
      </div>
    </div>,
    { width, height, fonts },
  )
  return asJpeg(image, `360dep-${work.slug}-${format}.jpg`)
}
