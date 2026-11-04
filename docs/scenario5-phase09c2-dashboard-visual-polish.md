# PHASE 09C-2 STATUS: FAIL — historical verifier; implementation PASS

The requested visual refinements are implemented. Focused, scientific, build and real-browser checks pass. Strict acceptance is FAIL because the required unchanged 09C-1 verifier already fails on App.tsx from the previously authorized admin shortcut. Its identical before/after failure is preserved; App and historical verification files remain unchanged. No new runtime or visual defect was found.

## Exact application changes

- src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard.tsx: descriptive main spectrum title; existing signed-axis helper and stored values retained; endpoint-only marker alignment hooks; compact-M0 class; explicit number/unit whitespace. No source fields or callbacks changed.
- src/ui/components/scenario/ScenarioFive.css: appended rules scoped exclusively under .s5-cognitive-dashboard. All earlier CSS is preserved byte-for-byte. No other application file changed relative to the phase-start snapshot.

New scripts: scripts/verify-s5-phase09c2.tsx, scripts/capture-s5-phase09c2.mjs, scripts/scenario5-phase09c2-witness.html. Documentation, fixtures, logs, baseline, build results, screenshots and patch are confined to the scenario5-phase09c2 artifact namespace. Existing uncommitted user work is preserved.

## Result

- Overall OSI: centered «طیف جهت‌گیری تصمیم عملیاتی–راهبردی در این اجرا», technical OSI label and exact signed numeric value; dark navy panel; 20px rounded S1 spectrum, physical left gold #f59e0b → green #22c55e → right cyan #38bdf8; white 4×34px marker. Physical LEFT=عملیاتی, RIGHT=راهبردی; visible −1/0/+1 ticks. The neutral center tick is short and below the track, distinct from the value marker. Direction does not mean quality.
- Four phases: all original names and values, same palette and white markers; compact 14px tracks, two columns desktop and one mobile. Main spectrum remains prominent.
- Risk: separate signed [-1,1] axis, 18px track and 4×32px white marker. LEFT=پذیرش ریسک کمتر, RIGHT=پذیرش ریسک بیشتر; independent non-evaluative explanatory text preserved.
- Nine construct meters: unchanged 0..100 data, grouping, null handling, definitions and accessible meter attributes. Rounded 11px bars use only a neutral blue/cyan family (#429fc6→#7ed0e4), without directional spectrum, thresholds or ranking.
- M0: compact two-column summary strip on desktop, stacked on mobile; title, overall coverage, coverage-not-performance wording, exact experimental validity note and five expandable percentages retained. Native keyboard disclosure and focus outline work. Main OSI title, value, entire track, ticks and labels are visible on the first real 1440×900 product frame; axis ends at y=619 inside report bottom y=807. M0 height is 120.22px with details closed.
- Number/unit spacing is explicit text whitespace plus flex gap. RTL labels and LTR signed geometry remain independent. Reduced-motion behavior is preserved; no animation added.

## Reference comparison

Actual accessible reference: docs/scenario5-phase09c0-scenario1-screenshots/02-scenario1-cognitive-dashboard-1440x900.png, copied byte-for-byte as scenario5-phase09c2-screenshots/00-s4-reference-genuine-09c0.png. Read-only source: released S1/id=4 local CognitiveDashboard and ScenarioFourRedesignedScenarioOne.css. Both genuine images were opened in the image viewer. Navy panels, substantial rounded spectrum, exact gradient stops, thin white vertical marker, centered descriptive heading and endpoint meanings match the S1 visual family. This is not a pixel-identical copy. S5 keeps four phases, exact signed ticks and risk semantics, nine neutral construct meters, data-completeness caveats and its own current-run navigation. No separate user screenshot was accessible, so no comparison against an unavailable image is claimed.

## Verification

- New focused verifier: 1591 assertions PASS, including 40 scalar leaves, nine unchanged definitions, signed positions −1/−0.5/−0.14/0/+0.5/+1/null, zero vs missing, gates, immutable rendering and source/instrumentation boundary.
- 112-run deterministic parity: PASS, zero mismatches; all 63 frozen hashes match. Details: scenario5-phase09c2-scientific-parity.md.
- TypeScript typecheck, production build and scoped ESLint: PASS. Actual command outputs are in scenario5-phase09c2-build-checks.json. Existing Vite chunk-size advisory is retained.
- Actual browser at 1440×900, 1366×768, 1280×720 and 390×844: PASS, no horizontal document/report overflow. Mobile vertical scrolling is intentional.
- Browser uses actual unrounded React cognitive props read-only to verify each rendered marker. Interior marker centers match original signed coordinates within 0.1px; −0.14 is 43% from LEFT. At −1 the marker left edge anchors to the track left edge; at +1 its right edge anchors to the track right edge. Both 4px bars stay wholly inside the track horizontally, without changing helper normalization. Null omits the value marker and reports unavailable; 0 retains the center marker. Physical endpoint label coordinates are asserted for all six signed axes despite RTL.
- Real eight-decision product run: dashboard, back/reopen, full eight-decision trace, technical report/back, finish callbacks PASS. Runtime and passive analytics storage unchanged; exactly one real completion event.
- Six archived genuine engine-ending witnesses: correct same-run entry and back/reopen, passive analytics PASS. Synthetic display-only edge/null/zero fixtures are isolated in the QA HTML with a visible TEST ONLY banner; never supplied to production flow or represented as real player data.
- Live map geometry at three desktop sizes matches the archived accepted geometry within 1px; all live source/style bytes unchanged.
- Historical 09C-1 verifier: FAIL before AND after the phase, same App.tsx assertion/actual/expected digests. Reproduce with node node_modules/tsx/dist/cli.mjs scripts/verify-s5-phase09c1.tsx. Logs: scenario5-phase09c2-09c1-before.txt and scenario5-phase09c2-09c1-after.txt. No workaround or historical test modification was made. This is the sole residual acceptance issue, unrelated to these presentation edits.

## Browser evidence

44 genuine browser PNGs and inspection.json under scenario5-phase09c2-screenshots/:

- 01-normal-dashboard-top-1440x900.png — actual product first viewport, compact M0 + full overall spectrum.
- 01b-coverage-keyboard-disclosure-1440x900.png — five percentages and keyboard focus.
- 02-orientation-and-phases-1440x900.png — main and all four phases, number/unit spacing.
- 03-all-nine-constructs-1440x900.png plus 03b-constructs-resources-and-coherence-1440x900.png — all nine across consecutive views; 04-construct-definitions-1440x900.png exposes definitions.
- 05-risk-and-interaction-1440x900.png — signed risk and timing caveats.
- 07-normal-top-{1280x720,1366x768,390x844}.png, 08-mobile-constructs-390x844.png, 09-mobile-risk-390x844.png — responsive layout.
- test-only-{negativeEdge,negativeReal,zero,positive,positiveEdge}-osi-and-four-phases.png and matching risk views — exact geometry; edge mobile images confirm containment/wrapping.
- test-only-null-orientation.png, test-only-null-constructs.png, test-only-null-risk-timing.png and partial/unavailable variants — null distinct from 0; absent score never replaced by a false center.
- witness-* — all six existing ending replays; live-unchanged-* — original map and convoy layout.

The screenshot manifest records actual displayed fields, raw marker values and coordinates, root/document widths, source/run IDs, test provenance, navigation and reviewed reference images.

## Delivery

scenario5-phase09c2-verification.json; scenario5-phase09c2-dashboard-visual-polish.md; scenario5-phase09c2-scientific-parity.md; scenario5-phase09c2.patch; scenario5-phase09c2-screenshots/inspection.json and PNGs. Patch is relative to the phase-start workspace, not repository HEAD. Reverse apply check and index preservation are checked by the packaging script. Work stops at 09C-2 for human review.
