import type { CategoryId } from "../types"

/**
 * The category icons, drawn for 360dep on a 24×24 grid: a thin outline plus a
 * soft fill in the same colour, so they read as one family next to the rose
 * palette. Stored as plain shapes so the web (<svg>) and the native app
 * (react-native-svg) draw exactly the same pictures from one file.
 *
 *   fill: "soft"  -> filled at low opacity, outlined
 *   fill: "solid" -> filled at full strength (a small accent, like a record dot)
 *   no fill       -> outline only
 */
export type IconShape =
  | { k: "path"; d: string; fill?: "soft" | "solid" }
  | { k: "circle"; cx: number; cy: number; r: number; fill?: "soft" | "solid" }
  | { k: "rect"; x: number; y: number; w: number; h: number; rx: number; fill?: "soft" | "solid" }

export const ICON_STROKE = 1.6
export const ICON_SOFT_OPACITY = 0.2

export type CategoryIconId = CategoryId | "all"

export const CATEGORY_ICONS: Record<CategoryIconId, IconShape[]> = {
  // A bottle of nail polish.
  nail: [
    { k: "rect", x: 9.5, y: 2.5, w: 5, h: 5.5, rx: 1.2 },
    { k: "rect", x: 8.5, y: 8, w: 7, h: 2, rx: 0.8 },
    { k: "rect", x: 6, y: 10, w: 12, h: 11.5, rx: 3, fill: "soft" },
    { k: "path", d: "M9.5 13.5v4" },
  ],
  // A makeup brush with a little sparkle.
  makeup: [
    { k: "path", d: "M13.6 3.9c1.9-1.2 4.6-.5 5.9 1.4 1.3 1.9.8 4.5-1.1 5.8l-2.6 1.7-4.4-6.4z", fill: "soft" },
    { k: "path", d: "m11.4 6.4 4.4 6.4-1.9 1.3-4.4-6.4z" },
    { k: "path", d: "M11.3 10.9 4.6 19.4a1.6 1.6 0 0 0 2.6 1.8l5.9-9.1" },
    { k: "path", d: "M5.5 5v3M4 6.5h3" },
  ],
  // A calm face, eyes closed.
  skincare: [
    { k: "path", d: "M12 3c-4 0-7 3.3-7 8.6C5 16.8 8 21 12 21s7-4.2 7-9.4C19 6.3 16 3 12 3z", fill: "soft" },
    { k: "path", d: "M8.8 11.2c.7.7 1.7.7 2.4 0M12.8 11.2c.7.7 1.7.7 2.4 0" },
    { k: "path", d: "M10.4 15.3c1 .8 2.2.8 3.2 0" },
  ],
  // A comb.
  hair: [
    { k: "rect", x: 3.5, y: 7, w: 17, h: 5, rx: 2, fill: "soft" },
    { k: "path", d: "M6 12v7M8.8 12v7M11.6 12v7M14.4 12v7M17.2 12v5" },
  ],
  // An eye with lashes.
  "lash-brow": [
    { k: "path", d: "M2.8 13.5C5.3 10.2 8.4 8.5 12 8.5s6.7 1.7 9.2 5c-2.5 3.3-5.6 5-9.2 5s-6.7-1.7-9.2-5z", fill: "soft" },
    { k: "circle", cx: 12, cy: 13.5, r: 2.6 },
    { k: "path", d: "M6.7 9.3 5.6 7.4M12 8.5V6.2M17.3 9.3l1.1-1.9" },
  ],
  // Warm stones and a leaf.
  massage: [
    { k: "path", d: "M4.5 18.6c0-1.8 3.4-3.1 7.5-3.1s7.5 1.3 7.5 3.1-3.4 3.1-7.5 3.1-7.5-1.3-7.5-3.1z", fill: "soft" },
    { k: "path", d: "M6.8 13.6c0-1.3 2.3-2.3 5.2-2.3s5.2 1 5.2 2.3-2.3 2.3-5.2 2.3-5.2-1-5.2-2.3z", fill: "soft" },
    { k: "path", d: "M9 9.3c0-.9 1.3-1.6 3-1.6s3 .7 3 1.6-1.3 1.6-3 1.6-3-.7-3-1.6z" },
    { k: "path", d: "M12 7.4c-.2-2.3 1.2-4 3.6-4.4.2 2.3-1.3 3.9-3.6 4.4z", fill: "soft" },
  ],
  // A phone with its camera.
  photophone: [
    { k: "rect", x: 6.5, y: 2.5, w: 11, h: 19, rx: 2.8, fill: "soft" },
    { k: "circle", cx: 12, cy: 12, r: 3.2 },
    { k: "path", d: "M10.8 5.3h2.4" },
  ],
  // A camera.
  camera: [
    { k: "path", d: "M3.5 9A2.5 2.5 0 0 1 6 6.5h2.2L9.8 4.5h4.4l1.6 2H18A2.5 2.5 0 0 1 20.5 9v8.5A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5z", fill: "soft" },
    { k: "circle", cx: 12, cy: 13, r: 3.6 },
    { k: "circle", cx: 17.4, cy: 9.4, r: 0.8, fill: "solid" },
  ],
  // A vertical clip with a play button.
  "short-video": [
    { k: "rect", x: 5.5, y: 2.5, w: 13, h: 19, rx: 3, fill: "soft" },
    { k: "path", d: "M10.3 9.3v5.4l4.6-2.7z", fill: "solid" },
  ],
  // A shopping bag.
  "product-photo": [
    { k: "path", d: "M5 8.5h14l-1.1 12.2a1 1 0 0 1-1 .8H7.1a1 1 0 0 1-1-.8z", fill: "soft" },
    { k: "path", d: "M9 10.5V7a3 3 0 0 1 6 0v3.5" },
  ],
  // A figure in a dress, posing.
  "model-photo": [
    { k: "circle", cx: 12, cy: 4.8, r: 2.3 },
    { k: "path", d: "M12 8.6c-1.7 0-2.8.9-3.1 2.4L7 20.5h10l-1.9-9.5c-.3-1.5-1.4-2.4-3.1-2.4z", fill: "soft" },
  ],
  // A person on camera, recording.
  "model-video": [
    { k: "circle", cx: 10, cy: 8, r: 3 },
    { k: "path", d: "M3.8 20.5c.6-3.7 3.1-6 6.2-6s5.6 2.3 6.2 6", fill: "soft" },
    { k: "circle", cx: 18.3, cy: 6.6, r: 2.4, fill: "solid" },
  ],
  // Everything.
  all: [
    { k: "rect", x: 3.5, y: 3.5, w: 7.5, h: 7.5, rx: 2, fill: "soft" },
    { k: "rect", x: 13, y: 3.5, w: 7.5, h: 7.5, rx: 2 },
    { k: "rect", x: 3.5, y: 13, w: 7.5, h: 7.5, rx: 2 },
    { k: "rect", x: 13, y: 13, w: 7.5, h: 7.5, rx: 2, fill: "soft" },
  ],
}
