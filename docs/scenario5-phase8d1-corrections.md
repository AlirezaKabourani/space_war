# Phase 08D.1 — four presentation corrections

Status: **PASS**. Scope is restricted to the four approved corrections. No later phase is started.

## Changes

1. The existing canonical progress scalar is unchanged. routePresentationPoint maps it to the original straight segment or the same quadratic Bezier used by the committed alternate SVG path. The curve has the existing midpoint offset (+45,-60). SVG path and marker share alternateRouteControlPoint. The original monotonic/held/delivered progress effect, destination, Tehran origin offsets and their decay remain byte-identical. No geometry enters mission, domain or cognitive data. The map tooltip serializes the same text as a single SVG title string for reliable React rendering.
2. Only active id=5 fullDescription receives the exact approved resource sentence. All other App.tsx bytes, id=2 metadata, routing, released IDs and the released title remain unchanged.
3. Summary headings are exactly: «فاز ۱ — ساخت تصویر اولیه کامل شد»، «فاز ۲ — تمرکز و مدیریت مسیر کامل شد»، «فاز ۳ — ایجاد تاب‌آوری کامل شد». Runtime phases and telemetry still use A/B/C/D. The existing phase-D live header remains unchanged.
4. R7 escort outcome uses one message: «اسکورت در جریان این اقدام اعمال شد و با ورود به مرحله بعد پایان یافت.» It does not also emit an active/expired pair. A still-valid existing window displays «اسکورت فعال». An expired next-stage window may show only «اسکورت مرحله قبل پایان یافت». The outcome projection preserves this lifecycle wording in stored review and AAR. Map history is shown after outcome continuation and is suppressed for a currently active escort.

## Changed application files

- src/App.tsx
- src/ui/components/scenario/ScenarioFiveMap.tsx
- src/ui/components/scenario/ScenarioFiveSimulation.tsx
- src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx
- src/ui/components/scenario/scenario-five/ui/gameplayPresentation.ts
- src/ui/components/scenario/scenario-five/ui/presentation.ts

presentation.ts is the additional presentation file required to keep the stored Outcome and AAR consistent with the live lifecycle labels; no model/type/runtime source is changed. No CSS change was needed.

## Verification

- Correction suite: 1516 checks PASS.
- Existing Phase-08D presentation suite: 32798 assertions PASS. Its exact whole-App guard is updated only to expect the newly approved, uniquely identified id=5 sentence replacement. Every other character remains guarded; no assertion is removed or disabled. The prior immutable 08D baseline is not edited.
- Scientific parity: the same 112 complete runs, 16 worlds, seven valid policies, environmentSeed=1; zero semantic mismatches.
- Frozen guards: all 63 accepted scientific/archive/legacy hashes match. Changed frozen files: none.
- TypeScript, production build and scoped ESLint: PASS. The existing Vite bundle-size advisory remains in the build log.
- Six real player-flow browser screenshots; all three requested viewport sizes checked at every capture. No new page overflow, clipped footer or live hidden-truth leak.
- Browser reroute witness: alpha, progress 0.5702127659574469; original point (532.9191489361702, 185.74468085106383); alternate point (554.9754640108647, 156.33626075147126); actual point (554.9754638671873, 156.3362579345703). Error 0.0000028205627344101917 SVG units, below 0.001. ETA T+235 and delay 25 match the accepted 08D browser witness exactly.

## Artifacts

scenario5-phase8d1-verification.json, scenario5-phase8d1-scientific-parity.md, scenario5-phase8d1-screenshots/inspection.json and scenario5-phase8d1.patch. The patch is relative to the already implemented 08D workspace, not to an earlier Git commit, and includes only the correction files and their verification artifacts. Its reverse apply check passes. The user's actual Git index is untouched.
