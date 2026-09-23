/**
 * The 360dep mark: a white serif "đ" (the first letter of "đẹp", set in
 * Playfair Display Bold, the wordmark's face) on a rose rounded square. The
 * earlier ring-and-dot mark read as Instagram's camera glyph.
 *
 * The letter is stored as an outline on a 32×32 grid so the web (<svg>), the
 * native app (react-native-svg), the favicon and the app icons draw the same
 * shape without depending on a font being loaded. The crossbar is drawn a
 * little heavier than the font's so it survives at 16px.
 */
export const LOGO_GLYPH_PATH =
  "M20.83 6.80L20.83 6.80L20.83 22.84Q20.83 23.92 21.16 24.43Q21.49 24.94 22.35 24.94L22.35 24.94L22.35 25.44Q21.61 25.37 20.88 25.37L20.88 25.37Q19.87 25.37 19.00 25.44Q18.13 25.51 17.39 25.70L17.39 25.70L17.39 9.66Q17.39 8.59 17.07 8.08Q16.75 7.56 15.87 7.56L15.87 7.56L15.87 7.06Q16.63 7.13 17.35 7.13L17.35 7.13Q18.32 7.13 19.21 7.05Q20.09 6.97 20.83 6.80ZM14.75 12.81L14.75 12.81Q15.80 12.81 16.60 13.15Q17.39 13.50 17.85 14.31L17.85 14.31L17.56 14.57Q17.25 14.00 16.74 13.75Q16.23 13.50 15.65 13.50L15.65 13.50Q14.44 13.50 13.72 14.92Q13.01 16.34 13.03 19.29L13.03 19.29Q13.03 21.32 13.31 22.52Q13.58 23.73 14.09 24.25Q14.61 24.77 15.27 24.77L15.27 24.77Q16.08 24.77 16.73 24.13Q17.37 23.49 17.42 22.39L17.42 22.39L17.54 23.23Q17.18 24.49 16.38 25.14Q15.58 25.80 14.30 25.80L14.30 25.80Q12.89 25.80 11.78 25.11Q10.67 24.42 10.05 22.98Q9.43 21.53 9.43 19.24L9.43 19.24Q9.43 17.07 10.12 15.66Q10.81 14.24 12.02 13.52Q13.22 12.81 14.75 12.81ZM13.2 10.15L22.8 10.15L22.8 11.3L13.2 11.3Z"

export const LOGO_RADIUS = 9
