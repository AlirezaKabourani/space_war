# PHASE 08D.2 — Scenario 2 UI/UX refinement and ending explanation pass

**PASS.** Applied to released Scenario 2 / active id=5, internal s5_silent_waves_redesign. The earlier phase-summary-header delivery and 09C-0 audit remain historical artifacts; this distinct delivery uses the suffix phase8d2-ux to avoid overwriting them.

## Visible changes

1. Recent decision is inside the upper information band, with a stronger teal background, accent border, separate label/action hierarchy and unchanged review button. An honest “no decision yet” placeholder reserves the same space initially.
2. Clock icons and explicit operational/map/remaining time labels retain T+ and the exact canonical values. Phase summaries, consequence/review panels, action previews, mission ending and compatibility AAR use explicit time wording/units.
3. On desktop, the top band stays 172px and the recent-action slot 48px. The map's heading and convoy tracks are stable, leaving its central frame unchanged across actions, outcomes, reasons, belief inputs and phase summaries. Convoy details remain available by internal scroll.
4. The left/right split changes from 2:3 to 1.08:1. At 1280px the left pane is about 568.0px wide; decision text, headings and spacing are larger. Desktop page scroll remains absent; long decision/forms retain their own scroll and persistent action footer. This is not a claim that every long form fits without internal scroll.
5. Current information is grouped by corridor/convoy, with a separate unknown-location group when needed. Native keyboard-accessible disclosures show source, original conclusion and strength. Within-group original order and all evidence items are preserved. Up to six items open initially; longer sets start compact. Quality/limitation details remain in the existing explicit evidence-detail flow. Group disclosure does not record evidence-open/dwell telemetry or change belief inputs.
6. The completed mission's “why” section highlights the realized result, then lists exactly five other endings, translated conditions and a short explanation of relevant time/protection/resource/evidence factors. Copy follows the existing resolver's precedence, health 55/60, horizon 360, continuity 75/100, attribution and containment distinctions. No action is claimed to guarantee an alternative. This section exists only behind the pre-existing complete-stage guard.

## Changed application files

- src/ui/components/scenario/scenario-five/ui/ScenarioFiveMissionEnding.tsx — Realized-ending emphasis, five other endings and their conditions; explicit time labels.
- src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx — Recent-action hierarchy and explicit phase-review time labels.
- src/ui/components/scenario/scenario-five/ui/ScenarioFiveTime.tsx — Added: shared presentation-only operational-time text and decorative clock icon.
- src/ui/components/scenario/scenario-five/ui/endingAlternatives.ts — Added: typed Persian copy transcribed from the existing six resolver branches; no resolver.
- src/ui/components/scenario/scenario-five/ui/endingPresentation.ts — Time-unit wording in existing explanatory strings only; calculation expressions unchanged.
- src/ui/components/scenario/ScenarioFive.css — Fixed-height top band/map tracks, wider left panel, larger type, corridor disclosures, bounded report scroll and ending comparison styles.
- src/ui/components/scenario/ScenarioFiveActionCard.tsx — Final-horizon time unit in existing action copy.
- src/ui/components/scenario/ScenarioFiveMap.tsx — Explicit map clock and convoy time units; persistent heading instruction line to avoid geometry changes.
- src/ui/components/scenario/ScenarioFiveResourcePanel.tsx — Clock icon, operational horizon in minutes, and explicit remaining minutes.
- src/ui/components/scenario/ScenarioFiveSimulation.tsx — Recent-action slot inside the top band; neutral initial placeholder; explicit final-horizon copy.
- src/ui/components/scenario/ScenarioFiveSummary.tsx — Compatibility AAR arrival/deadline and trace time labels; no score changes.
- src/ui/components/scenario/scenario-five/ui/ScenarioFiveInformationPicture.tsx — Passive corridor/unknown-location grouping; every existing evidence summary retained.
- src/ui/components/scenario/scenario-five/ui/ScenarioFiveOutcomePanel.tsx — Explicit operational, arrival and deadline time wording.

## Validation

- 2677 focused assertions PASS; accepted 08D presentation verifier: 32798 assertions PASS, without changing its assertions. Its generated witness artifact is restored byte-for-byte.
- Same scientific corpus: 16 worlds × 7 player-valid policies, seed=1, **112 complete runs / zero digest mismatches**. Full run values include mission/action/actor state, chronology, telemetry, domain and cognitive results.
- All **63 frozen scientific/archive/legacy hashes match**. App.tsx and legacy id=2 remain byte-identical to the start of this request. Runtime/timing/telemetry hook and mutation call expressions in Simulation and Map match their original expressions.
- Typecheck, production build and scoped ESLint PASS. Build retains the existing >500kB chunk-size advisory; it is not a compilation failure.
- **17 actual browser PNG captures**, 63 geometry/layout probes at 1280×720, 1366×768 and 1440×900. No page-level overflow, clipped header/footer or live hidden-truth leak. The completed report scrolls inside its own bounded root.
- The actual full browser run has zero evidence opens from passive group/review interactions and exactly one completion event. Previous exact A/B/C phase-review headers and local Continue invariance pass in the browser.
- 842 pre-existing nonignored files compared; only 11 authorized active-presentation files changed, plus 2 added presentation files. Existing scripts, models, other scenarios, previous evidence and 09C-0 documents remain unchanged.

## Stable map measurements

| Viewport | Frame width | Frame height | Left width | Maximum frame change across sampled gameplay stages |
| --- | --- | --- | --- | --- |
| 1280x720 | 509.59px | 218.63px | 568.03px | 0.00px |
| 1366x768 | 550.94px | 266.63px | 612.69px | 0.00px |
| 1440x900 | 582.67px | 387.63px | 646.95px | 0.00px |

## Browser evidence

All paths are under scenario5-phase8d2-ux-screenshots/:

- 01-first-decision-1440x900.png — R1 before action
- 01-first-decision-1280x720.png — R1 before action
- 01-first-decision-1366x768.png — R1 before action
- 02-after-action-1440x900.png — R1 post-action recent summary
- 02-after-action-1280x720.png — R1 post-action recent summary
- 02-after-action-1366x768.png — R1 post-action recent summary
- 03-grouped-information-1440x900.png — information grouped by corridor
- phase-A-review-1440x900.png — phase A review
- phase-B-review-1440x900.png — phase B review
- 03b-current-information-picture-1440x900.png — C belief current information grouped
- 03c-expanded-corridor-information-1440x900.png — C belief first corridor expanded
- phase-C-review-1440x900.png — phase C review
- 04-final-outcome-1440x900.png — R8 consequence
- 05-mission-ending-1440x900.png — realized mission ending
- 06-why-this-ending-1440x900.png — why realized ending
- 07-other-possible-endings-1440x900.png — five alternative endings
- 08-compatibility-cognitive-section-1440x900.png — existing compatibility cognitive section

inspection.json includes viewport geometry, canonical runtime values and interaction checks. Screenshots use a fresh isolated browser and the repository's existing test-player setup; all gameplay proceeds through actual UI controls. No model/world/resource/result state is injected.

## Delivery

- scenario5-phase8d2-ux-verification.json
- scenario5-phase8d2-ux-checks.json and check logs
- scenario5-phase8d2-ux-file-manifest.json
- scenario5-phase8d2-ux.patch (relative to the workspace at the start of this request)

Scientific logic, cognitive formulas, action/outcome/end-state semantics and legacy id=2 are unchanged. No new dashboard or cross-scenario behavior was implemented.
