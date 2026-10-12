# UX release — 12 October 2026

## Source and web

- PR #49 merged into `main`: `569a809b2f2bf08e73724f5aa2f2926daa66bac8`.
- GitHub CI and Database workflows for that revision passed.
- Vercel production deployment: `dpl_BHufS8bDDGprGmj864VDxnbpB4nN`, target production, Ready, same commit.
- Production aliases include `https://www.360dep.vn` and `https://360dep.vn`.
- Public HTTP readback returned 200 and the refreshed interface was inspected directly in Chrome, including the labelled generated illustration. Public catalogue was empty during inspection.

## Native artifacts

The app does not currently contain EAS Update/OTA configuration. New store binaries were built from the merged source, using the existing `@titanlabs/360dep` project and the verified production environment.

| Platform | Version | EAS build | Current delivery state |
| --- | --- | --- | --- |
| iOS | 1.0.0 (5) | dfdbbdce-f043-4f87-b5fe-eec28dc4698a | Finished, uploaded, processed Valid; submitted to App Review; Waiting for Review |
| Android | 1.0.0 (7) | 9ea594ae-fbfd-4457-9de5-a086c5a64bca | Finished and uploaded; production 100% rollout submitted; Changes in review, automated quick checks running |

The iOS IPA was inspected: bundle identifier `vn.dep360.app`, version 1.0.0, build 5, `ITSAppUsesNonExemptEncryption=false`, production Supabase URL present and the local QA URL absent. It was submitted using its explicit EAS build ID; upload job `db691aa4-23e1-41a3-a7d8-f7dd5ba4feba`.

The Android AAB was inspected: production Supabase URL present and the local QA URL absent. Google Play accepted version code 7, version 1.0.0, API 24+, target SDK 36. Device support was unchanged. Play showed one non-blocking warning about a missing deobfuscation file.

## Store submission readback

- Apple build 4 was withdrawn. Build 5 was selected, saved and submitted through Add for Review and Submit for Review. Apple confirmed 1 Item Submitted and Waiting for Review on 12 October at 12:16 PM ICT. Automatic release after approval remains selected.
- Google production build 7 replaced build 6. Restart review was confirmed, and Publishing overview now shows only 1.0.0 (7) under Production / Changes in review, with full rollout to Vietnam. Managed publishing remains off. Automated quick checks are still running; Google states changes are sent to review after these checks pass. Existing listing, privacy and reviewer settings were preserved.
- Neither store update is publicly available yet. Apple approval and Google automated-check completion/review approval remain external pending stages.

## Verification scope

261 local tests passed, 31 skipped; web/mobile TypeScript and lint passed; web build generated 84 routes; catalogue generation check passed. Native booking was inspected at normal and accessibility-large text sizes before release. Native archive checks do not establish physical-device or Android interaction QA. Private store screenshots stay under gitignored local-proofs; no credentials or signing material belong in this report.
