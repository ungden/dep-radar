/**
 * Removing the place a clip was filmed.
 *
 * Phones write the recording location into an MP4/MOV file's metadata: a
 * "©xyz" box (iPhone and most Android cameras), a "loci" box (3GPP), or an
 * Apple metadata item keyed "com.apple.quicktime.location.ISO6709". A clip of
 * someone's nails filmed at their home would publish their address.
 *
 * Photos are re-encoded on the device and lose all metadata (lib/uploads.ts);
 * re-encoding video in a browser is slow and lossy, so instead the location
 * boxes are neutralised in place: renamed to "free" (which every player skips)
 * and their contents zeroed. Offsets inside the file do not move, so the
 * sample tables stay valid and the clip plays exactly as before.
 *
 * Pure and synchronous so it can be tested without a browser.
 */

const CONTAINERS = new Set(["moov", "trak", "udta", "meta", "ilst", "mdia", "minf"])
const LOCATION_BOXES = new Set(["©xyz", "loci"])
const FREE = [0x66, 0x72, 0x65, 0x65] // "free"

function typeAt(view: DataView, offset: number) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3))
}

interface Box {
  type: string
  start: number
  headerSize: number
  end: number
}

function* boxes(view: DataView, start: number, end: number): Generator<Box> {
  let offset = start
  while (offset + 8 <= end) {
    let size = view.getUint32(offset)
    const type = typeAt(view, offset + 4)
    let headerSize = 8
    if (size === 1) {
      if (offset + 16 > end) return
      // 64-bit size; files here are well under 4 GB, so the high word is 0.
      size = view.getUint32(offset + 8) * 2 ** 32 + view.getUint32(offset + 12)
      headerSize = 16
    } else if (size === 0) {
      size = end - offset
    }
    if (size < headerSize || offset + size > end) return
    yield { type, start: offset, headerSize, end: offset + size }
    offset += size
  }
}

/**
 * ISO "meta" is a full box (4 bytes of version/flags before its children);
 * QuickTime "meta" is not. Tell them apart by whether a plausible child box
 * starts right after the header.
 */
function metaChildrenStart(view: DataView, box: Box) {
  const plain = box.start + box.headerSize
  if (plain + 8 <= box.end && /^[a-z©]{4}$/i.test(typeAt(view, plain + 4))) return plain
  return plain + 4
}

function neutralise(bytes: Uint8Array, box: Box) {
  bytes.set(FREE, box.start + 4)
  bytes.fill(0, box.start + box.headerSize, box.end)
}

/** Apple "keys" box: index (1-based) of each key whose name mentions location. */
function locationKeyIndexes(view: DataView, keys: Box): Set<number> {
  const found = new Set<number>()
  // full box header (4) + entry count (4)
  let offset = keys.start + keys.headerSize + 8
  let index = 1
  while (offset + 8 <= keys.end) {
    const size = view.getUint32(offset)
    if (size < 8 || offset + size > keys.end) break
    let name = ""
    for (let i = offset + 8; i < offset + size; i++) name += String.fromCharCode(view.getUint8(i))
    if (name.toLowerCase().includes("location")) found.add(index)
    offset += size
    index++
  }
  return found
}

export function stripVideoLocation(input: ArrayBuffer): { buffer: ArrayBuffer; removed: number } {
  const bytes = new Uint8Array(input.slice(0))
  const view = new DataView(bytes.buffer)
  let removed = 0

  const walk = (start: number, end: number) => {
    let locationKeys = new Set<number>()
    for (const box of boxes(view, start, end)) {
      if (LOCATION_BOXES.has(box.type)) {
        neutralise(bytes, box)
        removed++
      } else if (box.type === "keys") {
        locationKeys = locationKeyIndexes(view, box)
      } else if (box.type === "ilst") {
        for (const item of boxes(view, box.start + box.headerSize, box.end)) {
          if (locationKeys.has(view.getUint32(item.start + 4)) || LOCATION_BOXES.has(item.type)) {
            neutralise(bytes, item)
            removed++
          }
        }
      } else if (box.type === "meta") {
        walk(metaChildrenStart(view, box), box.end)
      } else if (CONTAINERS.has(box.type)) {
        walk(box.start + box.headerSize, box.end)
      }
    }
  }

  walk(0, bytes.byteLength)
  return { buffer: bytes.buffer, removed }
}
