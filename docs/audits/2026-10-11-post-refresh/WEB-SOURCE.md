# Web flow audit after UI refresh

Date: 2026-10-11. Source baseline: `f542020` (`codex/ux-ui-refresh`).

Scope: discovery → service detail → provider profile → booking; login and partner onboarding. This pass changes audit documentation only. The findings describe gaps still present after the refresh, not newly introduced regressions. The three catalogue price levels remain partner-selected price choices, not certificates of skill.

Evidence levels:

- **Source confirmed**: traced the current implementation and reproducible state transition; not an end-to-end runtime assertion.
- **Runtime confirmed by the coordinating audit**: observed against local, explicitly synthetic fixtures. This does not establish a production incident or real provider inventory.

## W1 — P1: Quote errors silently disable checkout

**Evidence: source confirmed; authenticated runtime not exercised.**

`bookingQuote()` results are stored with either a quote or an error in [app/book/[proId]/page.tsx:217](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:217). The error is not rendered there. The footer disables the submit button whenever a signed-in customer has no confirmed quote ([line 940](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:940)). The only code that would promote `verified.error` into the visible `error` state is inside `submit()` ([line 250](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:250)); the disabled button prevents that handler from running.

Reproduce: use a signed-in customer with a valid provider, service, date, slot and address; make `booking_quote` return an error; reach the confirmation step. Expected from source: “Gửi yêu cầu” stays disabled without an explanation or retry action. A transport rejection also lacks a catch in this effect.

Impact: a transient backend problem appears to the customer as an inert checkout. The customer cannot tell whether they omitted information, lost the time slot, or need to retry.

Recommendation: represent quote loading, success and failure explicitly; render the current request's error and a retry control. Disable submission while the quote is pending or invalid, while keeping recovery actionable. Never submit a stale or estimated quote as if it were confirmed.

## W2 — P2: Search location is lost when opening a service

**Evidence: source confirmed and runtime confirmed by the coordinating audit.**

Search prefers the explicit `?city=` parameter over the saved browsing city ([app/search/search-view.tsx:73](/Users/alexle/Documents/đẹp-radar/app/search/search-view.tsx:73)). A result card links only to `/dich-vu/<template>` ([components/service-card.tsx:22](/Users/alexle/Documents/đẹp-radar/components/service-card.tsx:22)). The destination reads `state.city` and filters providers using that saved city ([app/dich-vu/[id]/service-view.tsx:26](/Users/alexle/Documents/đẹp-radar/app/dich-vu/[id]/service-view.tsx:26)).

Reproduce: save TP.HCM as the browsing city, open search, choose Hà Nội in its location filter, then open a Hà Nội service result. The coordinating audit observed the detail page reverting to the saved city rather than showing the selected Hà Nội supply.

Evidence images: [search Hà Nội](screenshots/02-search-hanoi.png), [detail city reset](screenshots/03-detail-city-reset.png).

The same link omits `home`, `price` and `open`, so source tracing also shows that those search constraints are not applied on the detail page. Their individual effects were not separately asserted at runtime in this source pass.

Impact: the price and available providers that earned the click can disappear or change immediately after navigation; the customer may be told no one offers the service even though search just found someone.

Recommendation: preserve and apply relevant discovery context through the result link, or intentionally synchronize the selected city with browsing state before navigation. Preserve an accessible route back to the original filtered results.

## W3 — P2: Slot-loading errors are reported as a full calendar

**Evidence: source confirmed; failure injection not exercised in this source pass.**

`fetchSlots()` logs an RPC error and returns `[]` ([lib/api/actions.ts:105](/Users/alexle/Documents/đẹp-radar/lib/api/actions.ts:105)). The booking screen interprets an empty array as “không nhận khách hoặc đã kín lịch ngày này” ([app/book/[proId]/page.tsx:603](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:603)). There is no retry control. The loading effect only handles a fulfilled promise ([line 189](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:189)); a transport rejection can leave the skeleton in place.

Reproduce: open a valid provider's booking form and make `free_slots` return an RPC error for the selected date. Expected from source: the page claims the provider is unavailable or fully booked, rather than stating that availability could not be loaded. Separately, reject the server-action request to inspect the unresolved loading state.

Impact: technical failures become false inventory claims, potentially sending customers away from providers who actually have availability.

Recommendation: return a typed success/error result, keep “no slots” distinct from “could not load slots”, and allow retry without losing service, address and date choices.

## W4 — P2: Service-card price and duration can describe an option that cannot be booked

**Evidence: source confirmed and both examples runtime confirmed by the coordinating audit using synthetic listings.**

### Price unit and minimum booking

`photo-yearbook-group/half` costs 150,000đ per person at its lowest price level and requires at least five people ([lib/catalog.ts:646](/Users/alexle/Documents/đẹp-radar/lib/catalog.ts:646), minimum at line 654). `serviceOffers()` uses the minimum raw listing price ([lib/offers.ts:62](/Users/alexle/Documents/đẹp-radar/lib/offers.ts:62)); the card displays that amount without a per-person unit ([components/service-card.tsx:43](/Users/alexle/Documents/đẹp-radar/components/service-card.tsx:43)). Search compares that raw amount against “Ngân sách tối đa” ([app/search/search-view.tsx:116](/Users/alexle/Documents/đẹp-radar/app/search/search-view.tsx:116)). Booking correctly multiplies by the minimum quantity ([app/book/[proId]/page.tsx:140](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:140)).

Reproduce: publish a fixture offering that option at 150,000đ, choose the 300,000đ budget filter, then inspect the result. The coordinating audit confirmed the 150,000đ card remains in results even though its minimum service total is 750,000đ before travel charges.

Evidence images: [budget filter](screenshots/05-budget-filter.png), [budget result](screenshots/06-budget-result.png).

### Duration from an unlisted option

The card calculates the shortest duration across **all catalogue variants**, rather than the variants present in the eligible providers' listings ([components/service-card.tsx:18](/Users/alexle/Documents/đẹp-radar/components/service-card.tsx:18)). The `nail-gel` catalogue contains a 45-minute hand option and a 90-minute hand-and-foot option ([lib/catalog.ts:77](/Users/alexle/Documents/đẹp-radar/lib/catalog.ts:77)).

Reproduce: let the only eligible `nail-gel` listing offer `hand-foot` for 400,000đ and 90 minutes, without `hand` or `cat-eye`. The coordinating audit observed a search card showing 400,000đ beside **45 minutes**. That duration belongs to an unavailable option.

Impact: the card creates a price, budget or time expectation that changes as soon as the customer tries to book. This is a service-promise problem, even when individual catalogue prices are valid.

Recommendation: retain the offered variant and its pricing unit alongside a card's starting price. Display `/người` and the minimum group size when relevant; define the budget filter consistently as either a labelled unit-price filter or a minimum-booking-total filter. Derive duration from eligible offered variants, ideally the same variant that supplies the displayed starting price. Do not alter the three-level pricing contract.

## W5 — P2: Guest login discards the second session's date and time

**Evidence: source confirmed; authenticated round trip not exercised.**

The bridal `makeup-bridal/two` option contains two sessions ([lib/catalog.ts:162](/Users/alexle/Documents/đẹp-radar/lib/catalog.ts:162)). The booking form allows guests to choose the second session at confirmation ([app/book/[proId]/page.tsx:861](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:861)). However, `secondDate` always initializes empty and `secondTime` initializes to `09:00` ([line 212](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:212)); neither field is included in `resumeUrl()` ([line 228](/Users/alexle/Documents/đẹp-radar/app/book/[proId]/page.tsx:228)).

Reproduce: while signed out, select the two-session bridal option, choose dates and times for both sessions, then continue to login. After returning, source tracing shows the first session can restore but the second date is empty and its time returns to `09:00`. Submission then asks the customer to choose the second date again (line 251), despite the flow promising to keep their selections.

Impact: avoidable re-entry during checkout and possible selection of an unintended time for the second ceremony.

Recommendation: serialize and restore the second session alongside the first; revalidate both dates and availability on return, explaining any choice that is no longer valid rather than silently resetting it.

## Coverage and limits

Login/password signup and partner onboarding were inspected; no additional high-confidence finding was promoted from those routes. Real authentication, actual customer bookings, payments, production availability and physical-device behavior were not exercised by this source reviewer. The coordinating audit owns runtime fixtures and screenshots. No backend settings, catalogue prices or product code were changed by this pass.
