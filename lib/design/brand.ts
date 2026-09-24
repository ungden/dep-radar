/**
 * The 360đẹp mark: a white "đ" (the first letter of "đẹp") on a rose rounded
 * square, drawn from Be Vietnam Pro ExtraBold, the same face as the wordmark
 * "360đẹp" and every word on the site. The previous serif "đ" (Playfair)
 * blurred at 16px and did not match the rest of the type.
 *
 * The letter is stored as an outline on a 32×32 grid, optically centred, so
 * the web (<svg>), the native app (react-native-svg), the favicon and the app
 * icons draw the same shape without depending on a font being loaded.
 * public/brand/* and apps/mobile/assets/images/* are rendered from it.
 */
export const LOGO_GLYPH_PATH =
  "M14.20 25.20L14.20 25.20Q12.81 25.20 11.79 24.64Q10.76 24.08 10.07 23.13Q9.37 22.19 9.04 21.02Q8.70 19.85 8.70 18.63L8.70 18.63Q8.70 17.41 9.04 16.24Q9.37 15.07 10.07 14.12Q10.76 13.18 11.79 12.62Q12.81 12.06 14.20 12.06L14.20 12.06Q15.44 12.06 16.22 12.46Q17.00 12.87 17.39 13.29Q17.78 13.71 17.83 13.80L17.83 13.80L18.02 13.80L18.02 11.34L14.99 11.34L14.99 8.78L18.02 8.78L18.02 6.80L22.11 6.80L22.11 8.78L24.00 8.78L24.00 11.34L22.11 11.34L22.11 24.96L18.02 24.96L18.02 23.46L17.83 23.46Q17.78 23.55 17.39 23.98Q17.00 24.41 16.22 24.81Q15.44 25.20 14.20 25.20ZM15.49 21.93L15.49 21.93Q16.37 21.93 16.96 21.44Q17.54 20.95 17.84 20.19Q18.14 19.44 18.14 18.63L18.14 18.63Q18.14 17.82 17.84 17.06Q17.54 16.31 16.96 15.82Q16.37 15.33 15.49 15.33L15.49 15.33Q14.61 15.33 14.01 15.82Q13.41 16.31 13.12 17.06Q12.84 17.82 12.84 18.63L12.84 18.63Q12.84 19.44 13.12 20.19Q13.41 20.95 14.01 21.44Q14.61 21.93 15.49 21.93Z"

export const LOGO_RADIUS = 9
