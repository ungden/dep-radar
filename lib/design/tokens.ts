/**
 * The 360dep design tokens, shared by the web app (app/globals.css) and the
 * native app (apps/mobile). One source, so a colour cannot drift between them;
 * tests/design-tokens.test.ts fails when globals.css disagrees with this file.
 *
 * Direction: "tạp chí đời thường". Real photos carry the page, text is near
 * black and confident, and there is exactly one accent colour, used sparingly:
 * a saved heart, an unread dot, the selected tab. The main action is black.
 *
 * Every text colour here reaches WCAG AA (4.5:1) on canvas, surface and subtle.
 */
export const colors = {
  canvas: "#FAFAF8",
  surface: "#FFFFFF",
  /** Quiet fill: chips, image placeholders, secondary buttons. */
  subtle: "#F2F0EC",
  subtleStrong: "#E6E2DB",
  line: "#E8E5E0",
  ink: "#161413",
  inkSoft: "#4E4845",
  muted: "#6F6964",
  /** "Đỏ son". The only accent. */
  accent: "#C42D45",
  accentDark: "#A21F36",
  accentSoft: "#FBE9EC",
  success: "#1F7A4D",
  successSoft: "#E4F2EA",
  warning: "#8A5410",
  warningSoft: "#FBEFDC",
  danger: "#B42318",
  dangerSoft: "#FBE6E4",
  /** Small marks only (a dot, a label), never a large fill. */
  vertical: {
    beauty: "#C42D45",
    photo: "#2F55D4",
    model: "#7A3E8E",
  },
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const

/** px. Body copy is 15; nothing a person needs to read goes under 13. */
export const fontSize = {
  label: 12,
  meta: 13,
  body: 15,
  lead: 17,
  title: 20,
  h2: 24,
  h1: 32,
  hero: 44,
} as const

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  10: 40,
  16: 64,
} as const

export const motion = {
  fast: 150,
  base: 220,
  /** Scale applied while a card is pressed. */
  press: 0.98,
} as const

/** Photos are 4:5, videos 9:16. Nothing else is cropped. */
export const aspect = {
  photo: 4 / 5,
  video: 9 / 16,
} as const
