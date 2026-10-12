/**
 * The 360dep design tokens, shared by the web app (app/globals.css) and the
 * native app (apps/mobile). One source, so a colour cannot drift between them;
 * tests/design-tokens.test.ts fails when globals.css disagrees with this file.
 *
 * Direction (12/10/2026): "giấy sáng, chữ đậm". A warm paper page, white
 * cards with a hairline edge, near-black text that reads at a glance, one
 * vivid rose for actions and a champagne-gold highlight for invitations.
 * Colour lives in the photos and in the category tints
 * (lib/design/category-icons.ts), not in the chrome. The previous dusty-rose
 * page put pink on pink and brown on pink; text washed out.
 *
 * Every text colour here reaches WCAG AA (4.5:1) on canvas, surface and
 * subtle, and white text reaches it on accent, accentDark and ink.
 */
export const colors = {
  canvas: "#FAF8F5",
  surface: "#FFFFFF",
  /** Quiet fill: unselected chips, image placeholders, secondary buttons. */
  subtle: "#F2EFEA",
  subtleStrong: "#E6E1D9",
  line: "#E8E3DB",
  /**
   * Borders that have to be seen to be used: text fields, unselected time
   * slots and date chips. 3.3:1 on surface, 3.1:1 on canvas (WCAG 1.4.11).
   * `line` stays for dividers and card edges, which are decoration.
   */
  lineStrong: "#948B83",
  /** Text and the selected state of chips and tabs. 18.7:1 on surface. */
  ink: "#141213",
  inkSoft: "#3D3739",
  /** 6.0:1 on canvas, 5.5:1 on subtle. Secondary text, never body copy. */
  muted: "#655E60",
  /** Son hồng: the main button, links, the saved heart. */
  accent: "#BB3460",
  accentDark: "#9A2A4F",
  accentSoft: "#FCEAF0",
  /** Champagne gold: invitations (become a partner, hero calls to action), always with ink text. */
  highlight: "#F6C453",
  highlightSoft: "#FFF4D6",
  success: "#21704A",
  successSoft: "#E3F4EA",
  warning: "#8A5410",
  warningSoft: "#FDF0D9",
  danger: "#B3261E",
  dangerSoft: "#FBE6E3",
  /** Small marks only (a dot, a label), never a large fill. */
  vertical: {
    beauty: "#BB3460",
    photo: "#2F62C9",
    model: "#7B47C7",
  },
} as const

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const

/** Readable text roles, shared with the web semantic type scale. Native values are in points. */
export const fontSize = {
  label: 14,
  meta: 14,
  body: 17,
  lead: 18,
  title: 22,
  h2: 26,
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
