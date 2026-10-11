# 360đẹp — UI/UX refresh, 11/10/2026

Implementation of the findings in `../../audits/2026-10-11-ux-ui/AUDIT.md`.

## Implemented

- Retained the logo, Be Vietnam Pro, rose and espresso palette. Rebuilt the home hero with clearer hierarchy, search, an editorial image and readable service cards.
- Web text roles: 14px labels/metadata, 16px body, 18px lead/card titles, 20px prices. Migrated small text across customer, partner and admin screens. Semantic size classes preserve independent Tailwind color classes.
- Native text roles: 14px labels/metadata and 17px body. System font scale applies to both font and line height, preventing clipped custom-font text. No shared maximum font scale.
- Visible controls meet 44/48/56px minimums. Category names wrap. Mobile categories use four columns; desktop categories fit one row at 1280px. Search opens categories and filters progressively instead of placing every control above the results.
- Primary mobile navigation includes the “Yêu cầu” label. At font scale above 1.6, native navigation becomes a full-width destination menu; the filter footer stacks its actions.
- Radio groups support arrow keys, Home and End. Bottom sheets expose their individual children to accessibility rather than grouping the entire sheet as one element.
- Failed web catalogue/portfolio reads are separate from successful empty reads, with a retry action. Empty home inventory has one request action and a partner entry. Paused providers cannot open booking from the web profile. Distance sorting uses the nearest eligible provider, with unknown distances last.
- Native partner hours, second appointments and follow-ups use date/time pickers. Exact minutes are preserved; 24:00 is available only for closing time. Existing backend validation and RPCs remain in place.
- Guest account screens scroll and retain the partner entry. Studio settings identify which destinations actually open the web. Native Supabase storage uses browser storage on web and the existing chunked SecureStore on native.

## Generated asset

`public/images/beauty-editorial.webp` and the matching native asset are the same 1440px, approximately 76KB WebP. Generated with Imagegen: an adult Vietnamese woman receiving makeup in a warm, natural studio, with realistic skin texture, no text or watermark. Used only as a visibly labelled “Ảnh minh họa” home illustration. Provider portfolio photos remain actual provider content; service cards without portfolio photos show category icons.

The three partner-selected catalogue prices, service selection rules, payments, authentication requirements, database and migrations were not changed.

## Verification

| Check | Evidence |
| --- | --- |
| Web typecheck, lint, production build | Passed; 84 generated routes |
| Root tests | 249 passed, 31 skipped: 30 existing database integration tests without a running DB, one opt-in external AI test |
| Catalogue SQL check | Passed; generated catalogue unchanged |
| Mobile typecheck, lint | Passed |
| iOS production bundle export | Passed; generated editorial asset included |
| Responsive web | 320px and 390px: no document horizontal overflow; body 16px. Desktop 1280px: all 12 category tiles on one row |
| Search | First service starts at y=358px at 320px width; filters and result cards verified |
| Web keyboard/filter button | ArrowRight selected 300,000đ budget and updated URL; primary action white text, 16px, 56px height |
| Web error/empty states | Empty inventory has one request link. Simulated outage shows retry, not “no services”; retry restored data |
| Login/signup | Guest screens inspected, including signup at 320px; no account created |
| Native runtime | Current source running in Expo Go 57 on existing iPhone 17 Pro simulator, iOS 26.5; home, search, filters and guest account |
| Native large text | `accessibility-large`: readable line boxes, adaptive navigation, stacked filter footer. Menu successfully navigated to guest account; filter apply closed the sheet |
| Native date/time | Isolated component QA selected 12/10/2026 and exact time 10:16; returned values verified. Temporary QA route removed before final export |

## Evidence and limits

Open `REVIEW.html` for a self-contained visual review. PNGs in this folder are direct screenshots; audit screenshots retain the original baseline separately. Native screenshots include Expo Go's blue development menu, simulator chrome and the OS back-to-previous-app indicator; these are not product controls.

UI QA used temporary **read-only local fixtures**, explicitly named “Hồ sơ kiểm thử”, with three services and no portfolio/review claims. No Supabase stack or test database was created. These images do not prove production inventory or authenticated booking/payment behavior.

No physical Android/iPhone verification, EAS binary release, store submission, remote push or production deployment occurred. Authenticated partner mutations, real booking/payment and 24:00 server acceptance were not exercised. The existing simulator's font size was restored and that simulator shut down; temporary preview services are stopped at handoff.
