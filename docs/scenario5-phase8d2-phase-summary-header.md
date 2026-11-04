# Phase 08D.2 — local phase-summary header synchronization

**PASS**. Only header/progress presentation changes while an already-existing local summary is visible. No runtime stage, delay, event, telemetry, decision input, or canonical value changes.

| Summary | Exact main title | Exact subtitle | Stage label | Existing stage after Continue |
| --- | --- | --- | --- | --- |
| A | مرور پایان فاز ۱ — ساخت تصویر اولیه | مرحله بعد: فاز ۲ — تمرکز و مدیریت مسیر · تصمیم ۳ از ۸ | مرور فاز | decision:B1_monitoring_allocation |
| B | مرور پایان فاز ۲ — تمرکز و مدیریت مسیر | مرحله بعد: فاز ۳ — ایجاد تاب‌آوری · تصمیم ۵ از ۸ | مرور فاز | decision:C1_support_and_checkpoints |
| C | مرور پایان فاز ۳ — ایجاد تاب‌آوری | مرحله بعد: فاز ۴ — مدیریت فشار و تحویل · تصمیم ۷ از ۸ | مرور فاز | decision:D1_crisis_response |

The reviewed phase and preceding phases show completed checkmarks. No upcoming phase receives aria-current or the active class until Continue dismisses the local summary. The next-phase/current-decision header then appears immediately, using the same safe runtime view. The approved left-panel summary headings are unchanged. When the stored-outcome review temporarily replaces a local summary, the summary-specific header override is not applied.

## Application files

- src/ui/components/scenario/ScenarioFiveSimulation.tsx
- src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx
- src/ui/components/scenario/ScenarioFive.css
- Added: src/ui/components/scenario/scenario-five/ui/phaseHeader.ts

phaseHeader.ts is a pure presentation helper, separated from component exports to satisfy the existing Fast Refresh lint rule. The CSS change only allows review header text to wrap at the required desktop sizes. App.tsx is byte-identical to its pre-08D.2 snapshot; legacy id=2 and id=5 routing are unchanged.

## Evidence

- 115 new checks PASS. Existing 08D: 32,798 assertions PASS; existing 08D.1: 1,516 checks PASS. No prior verifier assertion was edited or weakened. The prior enriched 08D.1 artifact is restored byte-for-byte after its verifier executes, while its fresh output is captured separately.
- The same 112-run corpus, 16 worlds x seven valid policies at seed=1, has zero semantic mismatches. All 63 frozen hashes match.
- Typecheck, build and scoped ESLint PASS. The existing Vite bundle-size advisory remains in the captured build log.
- Six real screenshots cover each A/B/C summary and the immediately following decision. All three required sizes are checked. DOM records contain exact header title/subtitle/label, progress states, current stage, clock, ISR, Support, evidence count and convoy values.
- Browser dismissal checks assert exact runtime JSON, analytics storage, header counters and convoy DOM equality before/after Continue. No page overflow, clipped footer, hidden-truth leak or wrapped-header clipping was found.

Artifacts: scenario5-phase8d2-verification.json, scenario5-phase8d2-scientific-parity.md, scenario5-phase8d2-screenshots/inspection.json and scenario5-phase8d2.patch. The patch is relative to the accepted 08D.1 workspace and passes reverse-apply validation; the user's real index is untouched.
