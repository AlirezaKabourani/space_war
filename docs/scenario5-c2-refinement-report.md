# Scenario 2 command console refinement

Implementation: PASS. Build, focused tests, scientific parity, existing presentation tests and real-browser acceptance: PASS. The complete historical wrapper suite is not all green: its old App.tsx snapshot guards retain the previously reported failure. Detailed logs are preserved, with no edits to historical tests/baselines or App.

## Changes in the existing product

The active released Scenario 2 (internal ScenarioFive, catalog id=5) now has a content-sized four-convoy strip beneath its existing map. This is the original live console; no duplicate page, prototype, dependency or simulation state was added.

Exactly three application files changed relative to the start of this request:

- src/ui/components/scenario/ScenarioFive.css: removed convoy scroll/height caps and obsolete media overrides, flexible map/card allocation, compact header/event strip, readable typography, stable action selection styling, simplified nested borders, CSS-only convoy/route hover/focus correspondence, responsive page flow. All cognitive-dashboard CSS is byte-identical to its pre-task suffix.
- src/ui/components/scenario/ScenarioFiveMap.tsx: convoy health/arrival/deadline use semantic label/value rows; route and cargo, status, margin, delay, mitigations, evidence and target controls remain present. Added data attributes on existing route shapes for passive CSS associations. Map SVG, coordinates, movement, effects, callbacks and target logic remain unchanged.
- src/ui/components/scenario/ScenarioFiveActionCard.tsx: title and existing selection indicator grouped in a compact heading; isolated LTR resource/time values. Every original title, description, known effect, cost, timing and target restriction remains sourced from existing catalog/copy/helpers.

New task-owned scripts: capture-s5-c2-refinement.mjs, verify-s5-c2-refinement.tsx and package-s5-c2-refinement.mjs under scripts/. Other artifacts are confined to the scenario5-c2-refinement namespace under docs/.

## Root cause and layout solution

The previous desktop media rule forced the convoy strip to height/max-height 128px while another rule applied overflow-y:auto. Actual 1600×900 content needed 202px, and 1366×768 needed 257px. The map grid reserved exactly 128px for these cards. The header also fixed three rows (80/18/48px) inside a 172px box, and the shell's 920px cap wasted vertical room on taller screens.

The convoy strip now uses an unrestricted auto-height Grid with visible overflow; no hidden overflow, font scaling or removed fields. Four equal-width cards stretch to the same row height at wide desktop sizes, with consistent RTL label/value alignment. Obsolete 128/210/260/330px strip caps and fixed map-row allocation were removed rather than layering another cap. The map takes the flexible space left above the intrinsic-height strip, with a usable 220px minimum; SVG viewBox/preserve-aspect behavior prevents distortion. Existing coordinates, route curves, truck deconfliction and animation logic are unchanged.

Header height is intrinsic, resource indicators share separators rather than individual boxes, and all values/phase/status/controls remain. The event strip wraps meaningful text and has no fixed clipping height. Its identity/title can share a line. Footer spacing is scoped to a parent containing this live console, keeping the actual Stop Scenario button accessible while using more of the viewport. Typography keeps the existing Vazirmatn: 18px phase title, 16px question, 14px option title, 12–13px body/convoy metadata, readable secondary colors and 1.5–1.65 line heights. Selected action borders retain their thickness, avoiding layout shifts, with an explicit check indicator and visible keyboard outline.

## Responsive behavior and measured before/after

| Viewport | Header before → after | Convoy panel before (content) → after (content) | Map height before → after | Result |
| --- | --- | --- | --- | --- |
| 1920x1080 | 172.0 → 143.2px | 128 (202) → 212 (212)px | 523.6 → 489.8px | All four cards fully in first viewport, no internal scroll |
| 1600x900 | 172.0 → 143.2px | 128 (202) → 231 (231)px | 387.6 → 290.6px | All four cards fully in first viewport, no internal scroll |
| 1366x768 | 172.0 → 192.5px | 128 (257) → 432 (432)px | 266.6 → 240.0px | Two columns; normal page scroll, no convoy scroll or clipping |

At 1600×900 and 1920×1080 all four cards are fully visible simultaneously in the initial viewport, and after dynamic updates. All eight selected-decision layouts were checked at 1600×900, including required-target controls. At 1366×768 and widths up to 1439px, cards use two columns and the entire page may grow; decision/form actions return to normal flow. Under 900px the operational area and decision panel stack; under 540px convoy and decision cards use one column. No aggressive viewport font shrinking or transform-scale fitting is used. No horizontal document overflow at any tested viewport. Expanded convoy evidence grows the page with bounded map height; no nested convoy scrollbar or concealed text is introduced.

Existing desktop decision/evidence/form scroll bodies remain intentional. The requirement addressed scrolling in the convoy strip; full decision text, previews and evidence remain reachable using their established pane and action footer.

## Passive map–convoy connection

Hovering a card or focusing one of its controls highlights only that convoy's existing route and truck; hovering/focusing an eligible truck highlights the matching card. Four explicit ID mappings avoid incorrect associations. No new React state, timer or event handler is needed. The pre-existing legal-target selection still highlights the card and updates the select field through its original callback. Browser checks confirm inspection leaves runtime JSON and analytics storage exactly unchanged.

## Verification

- TypeScript typecheck, production Vite build, scoped ESLint: PASS. Outputs: scenario5-c2-refinement-build-checks.json.
- Focused verifier: 28,021 assertions PASS; all other application files and all 63 frozen files unchanged. Entire cognitive stylesheet suffix preserved byte-for-byte; cognition components, helper and gate unchanged.
- Original verifyPresentation function executed unchanged: 32,798 assertions PASS. All 112 deterministic complete traces (16 worlds × seven valid policies, environmentSeed=1) have zero full-run/cognitive/domain/mission/evidence mismatches against accepted corpora.
- All 896 pre-decision states render four real convoy cards with canonical status, cargo, health, arrival and deadlines. Full action copy is verified for every available option; rendering is immutable.
- Whole original map SVG is equal to the pre-task source after stripping only newly added data attributes. Original processing/movement hooks, UI timers and target callbacks compare equal. Actual browser SVG CTM scales match in x/y at every viewport.
- Real product browser: 26 after PNGs and three before PNGs. Target sizes 1920×1080, 1600×900 and 1366×768 were rendered and opened for visual review; mobile 390×844 additionally checked. Manifest includes actual rectangles, text, dimensions, computed fonts and overflow, not simulated measurements.
- Normal eight-decision completion passes all reason/belief gates, target selection, evidence open/close/back, phase summaries and updated convoy data. Cognitive entry/back/finish remains functional. Glossary opens/closes. Real Stop Scenario opens its existing confirmation and cancellation leaves the run/events unchanged. Focus outline and passive hover mapping checked.
- Unchanged historical wrappers verify-s5-phase8d2-ux.tsx and verify-s5-phase09c1.tsx: FAIL at their pre-existing App.tsx baseline guards, before behavioral checks. The same failure was documented before this request. These wrappers/baselines and App are not modified. Logs: scenario5-c2-refinement-historical-tests.json. Do not interpret this report as claiming every historical test passed.

## Scope and limitations

No progression, decision availability, confirmation logic, runtime/clock, cost, outcome, evidence, scoring, API, data contract or operational text change. Existing active S1/id=4 and legacy S2/id=2 files remain unchanged. No sample data in production. The previously authorized small admin preview shortcut remains unchanged.

Four documentation files under docs/scenario-cross-09d0-* changed concurrently outside this task's writes. Their observed hashes are recorded in verification.json. Those changes were preserved, not reverted or included in this patch. All other pre-existing application files outside the three listed above match the task-start snapshot.

At small screens normal page scrolling is intentional; when expanding all convoy evidence the page can also grow on desktop. All meaningful content stays accessible. Historical snapshot-wrapper failures are the remaining verification limitation; no new runtime/layout blocker was found in the tested flows.

## Review artifacts

- scenario5-c2-refinement-screenshots/01-initial-1600x900.png
- scenario5-c2-refinement-screenshots/01-initial-1920x1080.png
- scenario5-c2-refinement-screenshots/01-initial-1366x768.png
- scenario5-c2-refinement-screenshots/01b-convoys-scrolled-1366x768.png
- scenario5-c2-refinement-screenshots/10b-expanded-convoy-details-scrolled-1600x900.png
- scenario5-c2-refinement-screenshots/inspection.json and before/inspection.json
- scenario5-c2-refinement-verification.json, focused-verification.json, build-checks.json and historical-tests.json
- scenario5-c2-refinement.patch — relative to this request's starting workspace, preserving all earlier uncommitted work.

Reproduce with node node_modules/tsx/dist/cli.mjs scripts/verify-s5-c2-refinement.tsx, node scripts/capture-s5-c2-refinement.mjs, and the typecheck/build/lint commands in the build log. The --before capture mode is only for the pre-change workspace and its existing images are retained as historical evidence. Packaging checks patch reverse applicability and does not alter the real git index.
