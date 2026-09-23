/**
 * The 360dep design tokens, shared by the web app (app/globals.css) and the
 * native app (apps/mobile). One source, so a colour cannot drift between them;
 * tests/design-tokens.test.ts fails when globals.css disagrees with this file.
 *
 * Direction: "hồng đất sáng". A warm, light page where real photos sit on
 * white cards; text is a deep warm brown rather than black; the brand rose is
 * the colour of every action and every selected state. Nothing is black:
 * an earlier all-black version read as heavy and dark.
 *
 * Every text colour here reaches WCAG AA (4.5:1) on canvas and surface, and
 * white text reaches it on accent and accentDark.
 */
export const colors = {
  canvas: "#FAF6F4",
  surface: "#FFFFFF",
  /** Quiet fill: unselected chips, image placeholders, secondary buttons. */
  subtle: "#F5ECE9",
  subtleStrong: "#EADBD7",
  line: "#EFE3DF",
  ink: "#3A2A2C",
  inkSoft: "#65575A",
  muted: "#7D6C6E",
  /** Hồng đất: buttons, selected chips and tabs, links, the saved heart. */
  accent: "#A8535D",
  accentDark: "#8F434C",
  accentSoft: "#F6E6E6",
  success: "#2F6F4B",
  successSoft: "#E5F2EA",
  warning: "#8A5410",
  warningSoft: "#FBEFDC",
  danger: "#A13A3A",
  dangerSoft: "#F8E4E2",
  /** Small marks only (a dot, a label), never a large fill. */
  vertical: {
    beauty: "#A8535D",
    photo: "#4A67C9",
    model: "#86508F",
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
