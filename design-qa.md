# Homepage option 3 — design QA

- Source: `artifacts/homepage-option-3-implementation/reference.png`
- Desktop implementation: `artifacts/homepage-option-3-implementation/implementation-desktop-final.png`
- Mobile implementation: `artifacts/homepage-option-3-implementation/implementation-mobile-final.png`
- Full-view comparison: `artifacts/homepage-option-3-implementation/comparison-full.png`
- Focused hero comparison: `artifacts/homepage-option-3-implementation/comparison-hero.png`
- Viewports: 1440 × 1024, 768 × 1024, 390 × 844
- State: light theme, default concern selected

## Visual comparison

The implementation preserves the selected direction's compact two-row navigation, editorial desk hero, six image-led concern choices, rose primary action, and featured-story plus latest-guides layout. Production editorial imagery and live content replace the illustrative mock content without changing the hierarchy.

## Comparison history

1. V1 exposed a P1 mobile issue: six concern cards used a two-column grid, pushing the primary CTA below the first viewport. Fixed with a three-column mobile grid and compact labels; the CTA is now visible at 390 × 844.
2. V1 exposed a P2 desktop issue: the hero and featured-story block were taller than the selected reference. Reduced hero vertical spacing, constrained the desktop heading measure, and reduced the featured image minimum height.
3. Final comparison found no remaining P0, P1, or P2 visual issues. Real source images differ from the generated reference by design; their crop, density, palette, and slot proportions remain consistent with the selected direction.

## Functional and responsive checks

- Concern selection updates `aria-pressed` and the primary deep link. “Da nhạy cảm” resolves to `/catalogue/da-mat?skin=da-nhay-cam`.
- Navigation, search, theme control, catalogue links, article links, product links, and creator links remain interactive.
- No horizontal overflow at 390 px, 768 px, or 1440 px.
- No broken images at the three tested viewports.
- Browser console: 0 errors and 0 warnings.
- Mobile tap targets and the primary CTA meet the 44 px minimum.
- Focus-visible and reduced-motion behavior are inherited from the global accessibility rules.

final result: passed
