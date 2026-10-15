/**
 * Renders every brand image from lib/design/brand.ts, so the favicon, the PWA
 * and app icons, the Android adaptive icon and the splash draw the same face
 * as the header.
 *
 *   npx tsx scripts/gen-brand.ts
 *
 * Writes public/brand/* and apps/mobile/assets/images/{icon,android-icon-*,splash-icon,favicon}.png.
 * A new app icon or splash only reaches phones with a new native build.
 */
import { writeFileSync } from "node:fs"
import sharp from "sharp"
import {
  BRAND_CREAM,
  BRAND_INK,
  BRAND_ROSE,
  BRAND_ROSE_LIGHT,
  BRAND_SPARKLE,
  LOGO_BOX,
  LOGO_FACE_BOLD_PATH,
  LOGO_FACE_PATH,
  LOGO_RADIUS,
  LOGO_SPARKLE_BOLD_PATH,
  LOGO_SPARKLE_PATH,
  WORDMARK_BOX,
  WORDMARK_PATH,
  logoTransform,
} from "../lib/design/brand"

const gradient = `<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND_ROSE_LIGHT}"/><stop offset="1" stop-color="${BRAND_ROSE}"/></linearGradient></defs>`

interface Mark {
  /** Rounded tile (favicon, PWA "any"), full square (the OS masks it), or no ground at all. */
  ground: "tile" | "square" | "none"
  /** Space around the face, on the 100 grid. */
  inset: number
  bold?: boolean
}

const face = ({ inset, bold }: Mark) =>
  `<g transform="${logoTransform(inset)}"><path fill="${BRAND_CREAM}" d="${bold ? LOGO_FACE_BOLD_PATH : LOGO_FACE_PATH}"/><path fill="${BRAND_SPARKLE}" d="${bold ? LOGO_SPARKLE_BOLD_PATH : LOGO_SPARKLE_PATH}"/></g>`

const markSvg = (m: Mark) => {
  const ground =
    m.ground === "tile"
      ? `<rect width="${LOGO_BOX}" height="${LOGO_BOX}" rx="${LOGO_RADIUS}" fill="url(#t)"/>`
      : m.ground === "square"
        ? `<rect width="${LOGO_BOX}" height="${LOGO_BOX}" fill="url(#t)"/>`
        : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_BOX} ${LOGO_BOX}">${gradient}${ground}${face(m)}</svg>`
}

const png = (svg: string, size: number, out: string) => sharp(Buffer.from(svg), { density: 72 * (size / LOGO_BOX) * 4 }).resize(size, size).png().toFile(out)

/** The tile with the name under it, for the splash: transparent around, the page colour shows through. */
function splashSvg() {
  const W = 600
  const tile = 300
  const nameW = 440
  const nameH = (nameW * WORDMARK_BOX.height) / WORDMARK_BOX.width
  const gap = 56
  const H = tile + gap + nameH
  const s = tile / LOGO_BOX
  return {
    width: W,
    height: Math.ceil(H),
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Math.ceil(H)}">${gradient}
<g transform="translate(${(W - tile) / 2} 0) scale(${s})"><rect width="${LOGO_BOX}" height="${LOGO_BOX}" rx="${LOGO_RADIUS}" fill="url(#t)"/>${face({ ground: "tile", inset: 16 })}</g>
<g transform="translate(${(W - nameW) / 2} ${tile + gap}) scale(${nameW / WORDMARK_BOX.width})"><path fill="${BRAND_INK}" d="${WORDMARK_PATH}"/></g></svg>`,
  }
}

async function main() {
  const web = "public/brand"
  const app = "apps/mobile/assets/images"

  // Small sizes take the bold face and a bigger one.
  writeFileSync(`${web}/favicon.svg`, markSvg({ ground: "tile", inset: 12, bold: true }))
  await png(markSvg({ ground: "tile", inset: 12, bold: true }), 32, `${web}/favicon-32.png`)
  await png(markSvg({ ground: "square", inset: 16 }), 180, `${web}/apple-touch-icon.png`)
  await png(markSvg({ ground: "tile", inset: 16 }), 192, `${web}/icon-192.png`)
  await png(markSvg({ ground: "tile", inset: 16 }), 512, `${web}/icon-512.png`)
  // Maskable: the platform crops to a circle of 80%, so the face keeps to the middle.
  await png(markSvg({ ground: "square", inset: 22 }), 512, `${web}/icon-512-maskable.png`)

  // iOS masks the corners itself and wants no transparency.
  await png(markSvg({ ground: "square", inset: 16 }), 1024, `${app}/icon.png`)
  // Android adaptive icon: the launcher crops to its own shape inside the middle 66%.
  await png(markSvg({ ground: "none", inset: 26 }), 1024, `${app}/android-icon-foreground.png`)
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${gradient}<rect width="100" height="100" fill="url(#t)"/></svg>`, 1024, `${app}/android-icon-background.png`)
  await png(markSvg({ ground: "tile", inset: 12, bold: true }), 48, `${app}/favicon.png`)

  const splash = splashSvg()
  await sharp(Buffer.from(splash.svg), { density: 288 }).resize(splash.width * 2).png().toFile(`${app}/splash-icon.png`)
  console.log("brand images written")
}

void main()
