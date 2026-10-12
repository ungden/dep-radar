# Native booking layout correction — 11 October 2026

The previous accessibility screenshot was functional but visually overcrowded. Passing checks did not justify calling that layout finished. This change addresses the booking flow, not the design quality of the entire product.

## Changes

- One screen title, a small progress indicator, and grouped morning/afternoon/evening slots.
- Normal text: compact date rail, four-column time grid, price and action beside each other.
- Accessibility text: date picker instead of an oversized date rail; price in scrollable content and only the action in the footer. System text scaling remains unrestricted.
- Both first-session date controls offer the same 14 days. The second-session date control retains its existing future-date range.
- Selected times have a checkmark and rose border/background. Controls retain minimum touch sizes.
- Returning to a different step scrolls to the top. Optional notes follow the required details and open on demand.
- Long package prices and summary label/value rows stack vertically at larger text sizes.
- Estimates are labelled “Tạm tính”; payment timing is separate explanatory text.

## Direct simulator evidence

Device: existing R2R iPhone 17 Pro, iOS 26.5, Expo Go. Backend: read-only local fixture from `docs/audits/2026-10-11-post-refresh/fixture.cjs`. No booking was submitted.

1. **Service selection:** long package and price no longer compete for narrow columns at accessibility-large. Studio selection and continuation were exercised.
2. **Choose schedule:** all nine fixture slots were visible at normal system text during live inspection. At accessibility-large, five morning slots are fully visible and afternoon slots are reachable by scrolling. Date change clears the previous time; the continuation action disables until another time is selected. The 14-day picker boundary was checked. Simulated slot-fetch failure and retry preserve the chosen date. The last slot, 16:00, remains selectable.
3. **Confirmation:** returning from a long scrolled schedule starts at the top. A second-session date was selected successfully. Visual inspection found a remaining summary-row problem, shown in `step3-price-before.png`; `Line` now stacks at large text sizes, but this final correction still needs simulator readback.

Saved images:

- [Schedule at accessibility-large](step2-large.png)
- [Last slot and full price in scrollable content](step2-large-price.png)
- [Recoverable slot-fetch error](step2-error-large.png)
- [Confirmation row defect BEFORE its final source correction](step3-price-before.png)

## Automated verification

- Mobile TypeScript and Expo lint: passed.
- Booking recovery, pricing, UX behavior and semantic typography: 30 tests passed.
- Expo iOS export: passed, 2,187 modules, bundle `entry-88e2aa5906bc40be228aa0448bcf1304.hbc`.
- Independent source review: no new date-selection, pricing, note-persistence or payload regression identified.
- Diff whitespace check: passed.

## Remaining verification

The Mac locked during the final simulator pass. A saved normal-text screenshot, readback of the corrected confirmation price rows, and the new optional-note interaction remain pending until the machine is unlocked. Do not treat the export or typecheck as proof of those visual states. Physical-device, Android and authenticated booking submission were not verified in this change.

Local changes only; no push, deployment or store update.

## Follow-up, 12 October

The user rejected the remaining oversized controls. [The compact booking follow-up](../2026-10-12-compact-booking/README.md) supersedes the control sizing above and includes normal and accessibility-large screenshots. It also completes the previously blocked confirmation-price readback and optional-note interaction checks.
