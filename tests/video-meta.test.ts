import { describe, expect, it } from "vitest"
import { stripVideoLocation } from "@/lib/video-meta"

const enc = (s: string) => [...s].map((c) => c.charCodeAt(0))
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const box = (type: string, ...children: number[][]) => {
  const body = children.flat()
  return [...u32(8 + body.length), ...enc(type), ...body]
}

const COORDS = "+21.0285+105.8542+012.000/"
const latin1 = (buf: ArrayBuffer) => String.fromCharCode(...new Uint8Array(buf))

/** An iPhone-shaped file: udta/©xyz plus an Apple keys/ilst location item. */
function sampleClip() {
  const xyz = box("©xyz", [0, COORDS.length, 0x15, 0xc7], enc(COORDS))
  const keys = box(
    "keys",
    [0, 0, 0, 0],
    u32(2),
    [...u32(8 + 4 + 36), ...enc("mdta"), ...enc("com.apple.quicktime.location.ISO6709")],
    [...u32(8 + 4 + 24), ...enc("mdta"), ...enc("com.apple.quicktime.make")],
  )
  const data = (value: string) => box("data", u32(1), u32(0), enc(value))
  const ilst = box("ilst", [...u32(8 + 8 + 8 + COORDS.length), ...u32(1), ...data(COORDS)], [...u32(8 + 8 + 8 + 5), ...u32(2), ...data("Apple")])
  const meta = box("meta", box("hdlr", new Array(24).fill(0)), keys, ilst)
  const moov = box("moov", box("mvhd", new Array(100).fill(7)), box("udta", xyz), meta)
  const mdat = box("mdat", new Array(64).fill(9))
  return new Uint8Array([...box("ftyp", enc("qt  "), u32(0)), ...moov, ...mdat]).buffer
}

describe("stripVideoLocation", () => {
  it("removes every copy of the coordinates and keeps the size", () => {
    const input = sampleClip()
    expect(latin1(input)).toContain(COORDS)
    const { buffer, removed } = stripVideoLocation(input)
    expect(removed).toBe(2)
    expect(buffer.byteLength).toBe(input.byteLength)
    expect(latin1(buffer)).not.toContain("+21.0285")
  })

  it("leaves everything else byte for byte", () => {
    const input = new Uint8Array(sampleClip())
    const out = new Uint8Array(stripVideoLocation(input.buffer).buffer)
    const text = latin1(out.buffer)
    expect(text).toContain("Apple")
    expect(text).toContain("com.apple.quicktime.make")
    // mvhd and mdat payloads are untouched
    expect(out.filter((b) => b === 7).length).toBe(input.filter((b) => b === 7).length)
    expect(out.filter((b) => b === 9).length).toBe(input.filter((b) => b === 9).length)
  })

  it("does nothing to a file with no location", () => {
    const plain = new Uint8Array([...box("ftyp", enc("isom"), u32(0)), ...box("moov", box("mvhd", [1, 2, 3, 4]))]).buffer
    const { buffer, removed } = stripVideoLocation(plain)
    expect(removed).toBe(0)
    expect(new Uint8Array(buffer)).toEqual(new Uint8Array(plain))
  })

  it("survives garbage without throwing", () => {
    expect(() => stripVideoLocation(new Uint8Array([0, 0, 0, 3, 1, 2, 3]).buffer)).not.toThrow()
  })
})
