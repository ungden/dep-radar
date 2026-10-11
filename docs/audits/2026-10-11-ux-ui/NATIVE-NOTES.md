# Native 360dep UI/UX audit — 2026-10-11

Scope: read-only source audit of `apps/mobile/src`; visual audit of already-installed iOS simulator app. No source changes, no build/install, no account creation/sign-in/messages/bookings. Only screenshot files written under repo docs.

## Evidence / environment

- Already installed `vn.dep360.app`, version **1.0.0, build 1**. Bundle Info.plist read directly.
- Reused **R2R iPhone 17 Pro**, UDID `43C9D44F-D8D5-4958-9F28-39CCD91A6F11`, iOS 26.5. App ran standalone; no Metro or rebuild required. Existing :8081 belongs to VietnamGo and was left alone.
- All 7 simulators were Shutdown before, and verified all Shutdown after audit.
- Screenshots captured and inspected through CUA. Native UI was never authenticated. Terms checkbox already appeared checked from existing local state; audit did not alter it.
- **Binary/source uncertainty:** build 1 is an existing older installed artifact, not proven built from current HEAD. The visible empty catalogue is evidence of this installation only, not proof production has zero supply; its configured backend/cache was not verified. Source findings below refer current local source.
- Public partner intro was not reachable from signed-out UI: `Tôi` only presented sign-in gate. No deep link bypass used.

Screenshots (absolute base `/Users/alexle/Documents/đẹp-radar/docs/audits/2026-10-11-ux-ui/`):
- `native-home-empty.png`
- `native-search-empty.png`
- `native-filters.png`
- `native-account-signed-out.png`
- `native-login.png`

## Prioritized findings

### P1 — Functional information is demoted to 13pt; font scaling capped globally

`lib/design/tokens.ts:57-66` explicitly sets body 15, meta 13, label 12. `apps/mobile/src/ui/text.tsx:6-15` turns meta into 13/18 and `:38` caps every Txt at 1.4x system size. More significant than token values: prices, duration and provider name on core service cards are all meta (`apps/mobile/src/app/(tabs)/index.tsx:341-359`). Shared rating is meta (`apps/mobile/src/ui/bits.tsx:112-130`); bottom nav meta (`apps/mobile/src/components/tab-bar.tsx:52-74`); booking contract includes meta (`components/booking-contract.tsx:32`). Static count: 213 of 500 `<Txt>` opening tags across 75 TSX files explicitly use meta (42.6%; source count, not rendered frequency).

Category text can shrink further: five columns `width:'20%'` (`components/category-icon.tsx:53`), meta/one line/adjustsFontSizeToFit/minimumFontScale=.8 at `:74` and `:102`, nominally as small as 10.4pt. Screenshots confirm much smaller taxonomy/nav than headings, though they do not prove each source size matches old binary.

Recommendation: native reading baseline 16–17pt, action 16–17pt, meaningful secondary info 14–15pt; 12–13 only truly secondary timestamps/badges. Remove global arbitrary scaling cap after adaptive layout; allow category wrap or horizontal scroll rather than shrinking names.

### P1 — Empty catalogue is an experience dead end and doubles its fallback

Installed home shows `Cả nước`, four categories all marked `Sắp có`, `Chưa có ai nhận lịch`, then another card `Không thấy dịch vụ bạn cần?`, each pushing `Đăng yêu cầu`. Search with no query shows `Dịch vụ 0`, `Người làm 0`, `Không có gì khớp`. Large empty cream regions dominate both screens, no work imagery or service comparison can establish quality. Source emits unconditional second fallback (`(tabs)/index.tsx:293-300`) in addition to EmptySupply (`:153-160`).

Recommendation: single thoughtfully composed launch/low-supply state; only expose bookable services by default, explain supported area/supply truth and clear next option. Do not imply actual providers without evidence. Deduplicate CTA. Source and installed-state match structurally, but production supply remains unverified.

### P1 — New partners cannot discover recruitment without first signing into customer account

Visual `Tôi` signed out is a large blank gate with customer-only copy and single `Đăng nhập`. Source early-return SignInGate at `(tabs)/toi.tsx:24` prevents rendering the partner intro link at `:153-161`. `doi-tac.tsx:10-12` explicitly calls this quiet bottom-of-Tôi row the only customer entry. This weakens provider acquisition, particularly when home already has no supply. Guest cannot inspect value proposition or steps before giving account details.

Recommendation: visible but secondary `Dành cho đối tác` route on guest account/intro screen, with clear benefit, 3–5 steps, fee expectation and resume. Keep customer booking and partner work hierarchy explicit.

### P1 — Partner settings mislabels native versus web destinations

`studio/toi.tsx:133-144` sends first four rows to native profile steps, last two to WebBrowser. None pass `internal`, so common Row (`:174-191`) assigns external icon and label `mở trong app` to all. Note at `:146-148` says all above settings are missing from app and may require re-login, contradicting native implementation. The actual wallet/verify web handoff uses `WebBrowser.openBrowserAsync` (`:62-64`) with no shared session bridge visible. Setup also opens payment/verification web at `ho-so-doi-tac.tsx:121-124`.

Recommendation: accurate per-row destination labeling (native chevron versus external), remove stale global note, native completion/status or explicit auth continuity for critical wallet/verify flows.

### P2 — Partner onboarding reads like a database editor

`ho-so-doi-tac.tsx:74-84`: all six step choices then all trades/cities/districts as wrapping buttons. `:88-94`: all service cards, three price levels, nested variants; `:105-109`: repeated start/end HH:mm text fields per day. `:134-135`: field labels/choice labels 13pt, fields omit explicit fontSize and use faint decorative `colors.line`, whereas auth fields use `lineStrong`. No keyboard-avoiding container around this long form (ScrollView at `:74`).

Recommendation: one focused step with named progress and save status; searchable city/district pickers, native time picker + apply to weekdays, service/price summaries with expand-to-edit, fixed bottom next CTA. Validate keyboard and large text on real device.

### P2 — Touch target system is undersized for frequent actions

`ui/button.tsx:31` small Button fixed 36pt, no hitSlop; `ui/bits.tsx:80-100` common Chip 36pt and no hitSlop; search active chips 34pt (`(tabs)/tim.tsx:244,252`); middle tab press is 40pt tall (`components/tab-bar.tsx:48`) and its text label outside the press. Important partner `Nhận lịch` uses sm (`studio/index.tsx:114`), as do directions and workflow actions. 44pt IconButton is good and already used. This is below common iOS44/Android48 target guidance; do not incorrectly call all 36pt targets a WCAG 2.2 failure.

Recommendation: shared minHeight44/48 or explicit spacious hit areas; full middle tab including label is tappable; fixed height becomes minHeight for scalable text.

### P2 — Calendar tasks use raw date/time text entry in secondary flows

Initial booking slot picker is clear (`book/[proId].tsx:302-349`, 44pt slots). But multi-session second date/time falls back to `YYYY-MM-DD` and `HH:mm` TextInputs (`:438`), follow-up proposal same (`components/booking-contract.tsx:38`), partner schedules same as above. This inconsistency makes later steps feel unfinished and raises formatting errors.

Recommendation: reuse date/time selection UI and availability feedback for second sessions and followups.

### P2 — Login spends first viewport on marketing/terms, pushes primary email action below fold

Observed on iPhone 17 Pro: logo, two-line large heading, paragraph, auth mode switch, a substantial legal notice, Apple and Google, then email and partly visible password. Main email `Đăng nhập` button not visible on initial viewport. Source confirms ordering `login.tsx:191-218` consent block, `:220-254` social auth, `:256-287` fields, `:303-318` primary action; separator says `hoặc dùng email` even though field supports phone. No partner-oriented intro path.

Recommendation: compact heading; prioritize chosen login method; concise policy summary with full detail link while keeping consent explicit; contextual explanation. Do not remove required consent or precheck it in redesign.

## Things worth keeping

Shared Be Vietnam Pro family and brand rose/espresso palette; coherent tokens; safe area awareness; 44pt icon controls; contextual sign-in rather than blocking all browsing; 3-step primary booking and sticky total/CTA; native bottom sheets with fixed footer; skeleton/offline/error states; deliberate empty state copy; lightweight haptics. The main problem is hierarchy, density, completeness and input ergonomics, not the mere choice of palette.

## Native validation still needed

Current-HEAD binary, authenticated partner/customer screens, actual populated service cards, 200% text (or OS accessibility sizes), 320–375pt widths, Android text/touch and keyboard, VoiceOver inside filter sheets (CUA AX snapshot of old build exposed only Bottom Sheet handles despite visible controls; needs real VoiceOver confirmation), real-device reading/one-handed use. Do not treat old simulator screenshot as current production or physical-device proof.
