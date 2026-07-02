import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { RESEARCHED_PRODUCT_SOURCES } from "../lib/product-research"

const execFileAsync = promisify(execFile)
const outDir = path.join(process.cwd(), "public", "images", "products")
const userAgent = "Mozilla/5.0 (compatible; 360dep-product-research/1.0)"
const requestTimeoutMs = 12000
const BANNED_PRODUCT_IMAGE_HASHES = new Set([
  // Brand-logo placeholders that are not acceptable product packshots.
  "40e70f1ee96c912548f25ac54f678323fb84e611cc74b9305f1e1514c9aa8049",
  "708ba85f10d3e9ae77b5d69e3da068bf9dd96ae33bb37ef3cbcbdab751a22cb2",
])

async function main() {
  await fs.mkdir(outDir, { recursive: true })
  const results = []

  for (const source of RESEARCHED_PRODUCT_SOURCES) {
    const targetPath = path.join(outDir, `${source.productId}.jpg`)
    if (await hasExistingImage(targetPath)) {
      results.push({ id: source.productId, ok: true, skipped: true, source: source.url })
      continue
    }

    const imageUrl = await findImageUrl(source.url, source.productId)
    if (!imageUrl) {
      results.push({ id: source.productId, ok: false, reason: "no image", source: source.url })
      continue
    }

    const ok = await downloadAsJpeg(imageUrl, targetPath)
    results.push({ id: source.productId, ok, imageUrl, source: source.url })
  }

  const failures = results.filter((result) => !result.ok)
  console.log(JSON.stringify({
    total: results.length,
    downloaded: results.length - failures.length,
    failed: failures,
  }, null, 2))

  if (failures.length > 0) process.exit(1)
}

async function findImageUrl(productUrl: string, productId: string) {
  const shopifyImage = await findShopifyImage(productUrl)
  if (shopifyImage) return shopifyImage

  const html = await fetchText(productUrl)
  if (!html) return null

  const jsonLdImage = findJsonLdImage(html)
  if (jsonLdImage && !isBadImageUrl(jsonLdImage)) return new URL(jsonLdImage, productUrl).toString()

  const metaImage = findMetaImage(html)
  if (metaImage && !isBadImageUrl(metaImage)) return new URL(metaImage, productUrl).toString()

  const htmlImage = findBestHtmlImage(html, productUrl, productId)
  if (htmlImage) return htmlImage

  return null
}

async function findShopifyImage(productUrl: string) {
  try {
    const url = new URL(productUrl)
    const jsonUrl = `${url.origin}${url.pathname.replace(/\/$/, "")}.js`
    const json = await fetchJson(jsonUrl)
    const image = json?.featured_image ?? json?.images?.[0]
    return typeof image === "string" ? new URL(image, productUrl).toString() : null
  } catch {
    return null
  }
}

async function fetchText(url: string) {
  try {
    const response = await fetchWithTimeout(url, { headers: { "user-agent": userAgent } })
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

async function fetchJson(url: string) {
  try {
    const response = await fetchWithTimeout(url, { headers: { "user-agent": userAgent, accept: "application/json" } })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function findMetaImage(html: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1])
  }

  return null
}

function findJsonLdImage(html: string) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1].trim())
      const image = extractImage(parsed)
      if (image) return image
    } catch {
      // Ignore malformed marketing JSON.
    }
  }
  return null
}

function findBestHtmlImage(html: string, productUrl: string, productId: string) {
  const tokens = productId
    .split("-")
    .filter((token) => token.length >= 4 && !["with", "plus", "skin", "cream", "serum", "product"].includes(token))
  const candidates: { url: string; score: number }[] = []
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0])

  for (const tag of imageTags) {
    const alt = getAttr(tag, "alt")
    const src = pickImageUrlFromTag(tag)
    if (!src || isBadImageUrl(src)) continue

    const haystack = `${src} ${alt ?? ""}`.toLowerCase()
    let score = 0
    for (const token of tokens) {
      if (haystack.includes(token)) score += 2
    }
    if (haystack.includes("packshot")) score += 4
    if (haystack.includes("product")) score += 2
    if (haystack.includes("pdp")) score += 2
    if (haystack.includes("main")) score += 1
    if (haystack.includes("thumbnail")) score -= 1
    if (haystack.includes("banner")) score -= 2
    if (haystack.includes("logo")) score -= 4

    if (score > 0) {
      candidates.push({ url: new URL(decodeHtml(src), productUrl).toString(), score })
    }
  }

  return candidates.sort((a, b) => b.score - a.score)[0]?.url ?? null
}

function pickImageUrlFromTag(tag: string) {
  const srcset = getAttr(tag, "srcset") ?? getAttr(tag, "data-srcset")
  if (srcset) {
    const urls = srcset
      .split(",")
      .map((item) => item.trim().split(/\s+/)[0])
      .filter(Boolean)
    return urls.at(-1) ?? null
  }

  return getAttr(tag, "data-zoom-src")
    ?? getAttr(tag, "data-src")
    ?? getAttr(tag, "data-original")
    ?? getAttr(tag, "data-image")
    ?? getAttr(tag, "src")
}

function getAttr(tag: string, attr: string) {
  const pattern = new RegExp(`${attr}=["']([^"']+)`, "i")
  return tag.match(pattern)?.[1] ? decodeHtml(tag.match(pattern)?.[1] ?? "") : null
}

function isBadImageUrl(url: string) {
  const normalized = url.toLowerCase()
  return normalized.includes("noimage")
    || normalized.includes("no-image")
    || normalized.includes("sprite")
    || normalized.includes("logo")
    || normalized.endsWith(".svg")
}

function extractImage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = extractImage(item)
      if (image) return image
    }
    return null
  }

  const record = value as Record<string, unknown>
  if (record["@type"] === "Product" || record["@type"] === "ProductGroup") {
    const image = record.image
    if (typeof image === "string") return image
    if (Array.isArray(image) && typeof image[0] === "string") return image[0]
    if (image && typeof image === "object" && typeof (image as Record<string, unknown>).url === "string") {
      return (image as Record<string, string>).url
    }
  }

  for (const nested of Object.values(record)) {
    const image = extractImage(nested)
    if (image) return image
  }

  return null
}

async function downloadAsJpeg(imageUrl: string, targetPath: string) {
  try {
    const normalizedUrl = imageUrl.replace(/^http:\/\//, "https://")
    const response = await fetchWithTimeout(normalizedUrl, { headers: { "user-agent": userAgent } })
    if (!response.ok) return false

    const contentType = response.headers.get("content-type") ?? ""
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 1000) return false

    if (contentType.includes("jpeg") || isJpeg(buffer)) {
      if (isBannedImage(buffer)) return false
      await fs.writeFile(targetPath, buffer)
      return true
    }

    if (!contentType.startsWith("image/") && !isWebp(buffer) && !isPng(buffer)) return false

    const tempPath = `${targetPath}.tmp`
    await fs.writeFile(tempPath, buffer)
    try {
      await execFileAsync("sips", ["-s", "format", "jpeg", tempPath, "--out", targetPath], { timeout: 30000 })
      const converted = await fs.readFile(targetPath)
      if (isBannedImage(converted)) {
        await fs.unlink(targetPath).catch(() => undefined)
        await fs.unlink(tempPath).catch(() => undefined)
        return false
      }
      await fs.unlink(tempPath)
      return true
    } catch {
      await fs.unlink(tempPath).catch(() => undefined)
      return false
    }
  } catch {
    return false
  }
}

function isJpeg(buffer: Buffer) {
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
}

function isPng(buffer: Buffer) {
  return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
}

function isWebp(buffer: Buffer) {
  return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x3A;/g, ":")
}

async function hasExistingImage(targetPath: string) {
  try {
    const stat = await fs.stat(targetPath)
    if (stat.size <= 1000) return false
    const bytes = await fs.readFile(targetPath)
    return !isBannedImage(bytes)
  } catch {
    return false
  }
}

function isBannedImage(buffer: Buffer) {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")
  return BANNED_PRODUCT_IMAGE_HASHES.has(hash)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
