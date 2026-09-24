import { ImageResponse } from "next/og"
import { getProBySlug, listProServices, listWorks } from "@/lib/api/pros"
import { showsAverage } from "@/lib/connection"
import { absoluteUrl } from "@/lib/env"
import { OgBrand, ogFonts, vnd } from "@/lib/og"
import { Chip, DARK, SAFE, Mosaic, QrCode, SHARE_FORMATS, asJpeg, isShareFormat, mosaicPhotos, shortLink } from "@/lib/share-card"
import { proBookingUrl } from "@/lib/working-hours"

/**
 * A freelancer's portfolio as one picture to post: their best work, who they
 * are, what they charge, and a QR code to book. /pros/<slug>/portfolio/story
 * (9:16) or /post (4:5), a JPEG. Studio → "Ảnh portfolio" shows and saves it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; format: string }> }) {
  const { id, format } = await params
  if (!isShareFormat(format)) return new Response("Not found", { status: 404 })
  const pro = await getProBySlug(id).catch(() => null)
  if (!pro) return new Response("Not found", { status: 404 })

  const [works, services, fonts] = await Promise.all([
    listWorks({ proId: pro.id, limit: 12 }).catch(() => []),
    listProServices(pro.id).catch(() => []),
    ogFonts(),
  ])
  // One picture per work first (the "after" of a before/after), so three
  // photos show three different jobs; the avatar only when there is no work.
  const best = works.map((w) => (w.kind === "before_after" ? w.images[1] : w.images[0])).filter(Boolean)
  const extra = works.flatMap((w) => w.images).filter((u) => !best.includes(u))
  const urls = [...best, ...extra, ...(pro.avatar ? [pro.avatar] : [])].map((u) => (u.startsWith("/") ? absoluteUrl(u) : u))

  const prices = services.filter((s) => s.active).flatMap((s) => Object.values(s.prices)).filter((n) => n > 0)
  const from = prices.length ? Math.min(...prices) : null
  const chips = [
    showsAverage(pro.rating.count) ? `${pro.rating.average.toFixed(1)}/5 · ${pro.rating.count} đánh giá` : null,
    pro.stats.completedJobs >= 5 ? `${pro.stats.completedJobs} lịch đã làm` : null,
    pro.yearsExp > 0 ? `${pro.yearsExp} năm kinh nghiệm` : null,
    pro.identity === "verified" ? "Đã xác minh" : null,
  ].filter((c): c is string => c !== null)
  const link = proBookingUrl(pro.slug)

  const story = format === "story"
  const { width, height } = SHARE_FORMATS[format]
  const safe = SAFE[format]
  const boxW = width - safe.side * 2
  const boxH = story ? 860 : 600
  const photos = await mosaicPhotos(urls, 3, boxW, boxH, story ? "column" : "row")

  const image = new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width, height, padding: `${safe.top}px ${safe.side}px ${safe.bottom}px`, background: DARK.ground, fontFamily: "Be Vietnam Pro", color: DARK.cream }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <OgBrand size={story ? 56 : 48} tone="gold" />
        <div style={{ fontSize: story ? 24 : 21, fontWeight: 700, letterSpacing: 6, color: DARK.gold }}>PORTFOLIO</div>
      </div>

      <div style={{ display: "flex", flexShrink: 0, marginTop: story ? 48 : 36 }}>
        {photos.length ? (
          <Mosaic photos={photos} w={boxW} h={boxH} radius={story ? 28 : 24} />
        ) : (
          <div style={{ display: "flex", width: boxW, height: boxH, alignItems: "center", justifyContent: "center", borderRadius: 28, background: DARK.chip, fontSize: 220, fontWeight: 800, color: DARK.gold }}>
            {pro.name.trim().charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: story ? 18 : 12 }}>
        <div style={{ fontSize: story ? 84 : 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1.04 }}>{pro.name}</div>
        <div style={{ display: "flex", fontSize: story ? 36 : 30, color: DARK.gold }}>{`${pro.title} · ${pro.district}, ${pro.city}`}</div>
        {(chips.length > 0 || from) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: story ? 10 : 6 }}>
            {from ? <Chip strong size={story ? 30 : 26}>{`Từ ${vnd(from)}`}</Chip> : null}
            {chips.slice(0, story ? 3 : 2).map((c) => (
              <Chip key={c} size={story ? 30 : 26}>
                {c}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: story ? 36 : 28, paddingTop: story ? 36 : 28, borderTop: `2px solid ${DARK.line}` }}>
        <QrCode url={link} size={story ? 200 : 150} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: story ? 38 : 32, fontWeight: 700 }}>Quét mã để đặt lịch</div>
          <div style={{ fontSize: story ? 30 : 26, color: DARK.soft }}>Xem tác phẩm và giá trên</div>
          <div style={{ fontSize: story ? 30 : 26, fontWeight: 700, color: DARK.gold }}>{shortLink(link)}</div>
        </div>
      </div>
    </div>,
    { width, height, fonts },
  )
  return asJpeg(image, `360dep-${pro.slug}-${format}.jpg`)
}
