# PHASE 08D.3 STATUS: PASS

Implemented only for active released Scenario 2 (product id=5, s5_silent_waves_redesign / s5_gnss_logistics_simulation), against the current workspace rather than an old patch. Historical wrappers have the separately documented pre-existing failures; new acceptance gates pass.

## Location, integration and preserved behavior

The section titled «آنچه تصور می‌کردید، در برابر آنچه واقعاً رخ داد» follows the existing orange «آنچه هنگام تصمیم‌گیری نمی‌دانستید» section. New navigation points to #s5-belief-vs-reality. The old #s5-belief-timeline target remains inside the integrated timeline. The original four-card timeline is replaced, so there is exactly one four-checkpoint sequence, not two copies. All original belief fields remain available in native expandable cards.

The mission result, Why This Ending, all eight decision/outcome entries, hidden truth and provenance, canonical current-run gate, cognitive entry and completion flow remain. Recent user changes are preserved: alternative-ending cards stay removed; the cognitive entry is still the active primary button; the mission page has no direct completion button; the truth panel retains its warm orange/red styling.

No new stage, action, reason gate, modal, score, probability, evidence, ending, telemetry event, persistence operation or cross-scenario feature was added. Summary.tsx, Simulation.tsx, routing, model/calibration, archive/storage/admin and cross-scenario files are unchanged.

## Exact changed and added application files

Modified:

- src/ui/components/scenario/scenario-five/ui/ScenarioFiveMissionEnding.tsx
- src/ui/components/scenario/scenario-five/ui/endingPresentation.ts
- src/ui/components/scenario/scenario-five/ui/presentation.ts
- src/ui/components/scenario/ScenarioFive.css

Added:

- src/ui/components/scenario/scenario-five/ui/ScenarioFiveBeliefRealityAar.tsx
- src/ui/components/scenario/scenario-five/ui/beliefRealityAarPresentation.ts

ScenarioFiveMissionEnding imports the new section, integrates the existing anchors, and uses the validated projection for belief excerpts in the old decision trace so malformed historical fields cannot crash it. A short completion-only provenance explanation distinguishes observed direction from hidden origin. ScenarioFive.css adds only .s5-belief-reality-scoped rules and a mobile breakpoint; cognitive-dashboard CSS remains byte-identical and the earlier orange truth rules are retained.

The small additional presentation.ts edit is justified by read-only integration: buildStoredScenario5Outcome previously called .find/.includes on a potentially malformed historical final belief before the new component could render its unavailable state. It and buildMissionAar now accept missing/invalid/duplicate final records as unavailable snapshot input rather than throwing. They do not calculate replacement beliefs, fill zeros or change valid output. Full scientific/AAR parity passes.

New scripts: record-s5-phase08d3-baseline.tsx, verify-s5-phase08d3-belief-vs-reality.tsx, capture-s5-phase08d3.mjs, scenario5-phase08d3-witness.html and package-s5-phase08d3.mjs. The witness page is an isolated, visibly labelled TEST WITNESS test harness, not a product page. Baseline recorder refuses to overwrite its recorded snapshot.

## Player-facing content and source-of-truth map

| Visible field | Exact source / interpretation |
| --- | --- |
| Final selected corridor and convoy | The unique D_final_belief record's mostLikelyCorridorId; labels from SCENARIO5_CORRIDOR_CONTENT_FA. No most-recent fallback. |
| Three final and per-checkpoint scalar fields | corridorConfidence, targetedInterferenceEstimate and targetedInterferenceConfidence from the original record, validated as finite 0..100. Zero remains zero; missing/invalid is explicit unavailable. These are player reports, not modeled probabilities. |
| Modeled primary corridor and convoy | audit.truth.primaryAffectedCorridorId from the same completed AAR; catalog labels. |
| Actor profile and final posture | audit.truth.actorProfile via existing ACTOR labels; audit.truth.finalActorPosture via the same safe four posture labels already used in the AAR. Unknown labels are unavailable, never a guessed Actor/mechanism. |
| Attribution and containment | Existing missionState.operationalAttributionStatus catalog label; existing aar.end.threatContained flag, with no new resolver or classification. |
| Same/different corridor statement | Exact equality of final reported corridor ID and modeled primary corridor ID, only for a valid final checkpoint. Always accompanied by the exact non-evaluative caveat. It does not imply attribution resolved, threat contained, quality or intelligence. |
| Four checkpoint titles/order | Existing BELIEF_COPY catalog, canonical A2_prebelief → A2_postbelief → C_belief_checkpoint → D_final_belief order, independent of storage-array order. |
| Transitions | Only adjacent actual valid records: same corridor or from X to Y, plus the three exact old→new scalar pairs. Missing intermediate data does not skip forward to a later record. |
| Evidence available then | Exactly each original visibleEvidenceIdsAtCheckpoint snapshot, stable distinct IDs in original order; its count never uses the final evidence total. |
| Evidence details | Resolve only those snapshot IDs against state.evidence; actual ID, existing source/direction/strength labels and observed corridor label (or canonical unknown/multi-corridor wording). Missing ID details remain explicit unavailable. |
| Fresh evidence | Current checkpoint ID set minus the immediately preceding checkpoint ID set. Missing previous snapshot yields unavailable, not a made-up zero. |
| Late evidence | Existing aar.lateEvidenceIds from the final checkpoint snapshot difference, displayed separately with the exact late-evidence note. No late ID is back-filled into any earlier list/count. Missing final snapshot yields unavailable classification. |
| Ambiguity inventory | Actual snapshot-resolved evidence only: ambiguous direction, more than one OBSERVED corridor, more than one source type, or exactly zero available IDs. If unsupported, the exact neutral fallback is shown; no mental-cause claim or insufficiency threshold. |

The exact approved intro, same/different statements, comparison caveat, late-evidence note, neutral fallback and conclusion are used verbatim. All cards are Persian RTL with isolated LTR numeric values/IDs. Player estimate is the physical right cyan card and modeled reality the physical left warm card on desktop; equal-width cards stack on mobile. Four native accordion cards combine timeline fields, transitions and nested evidence lists. A separate expandable inventory explains potential uncertainty without assigning causes to the player's choices.

The comparison's evidence lists intentionally show availability only. They do not infer that a player opened an item. Existing actual evidence-open facts remain in the original completed AAR; the new disclosures never emit evidence-open events. Hidden provenance remains in the old completion-only truth section, with its existing canonical labels and the added explanation that provenance and observed direction differ.

## Validation results

- New verifier: 25,278 assertions, zero failures. Covers all required new logical cases; 42 malformed historical variants, explicit missing/no-zero substitution, measured zeros, unresolved evidence ID, distinct IDs, reversed source order and exact neutral fallback.
- Original presentation verifier: 32,798 assertions PASS. Six ending witnesses PASS with the same underlying results and unchanged current explanation functions. 62 revised and 274 unchanged genuine adjacent transitions covered.
- Scientific parity: same pre-edit 112 runs, zero full-object/cognitive/domain/mission/Actor/evidence mismatches. 112 AAR fact projections also identical. All 63 frozen hashes unchanged against both fresh and accepted scientific baselines. See scenario5-phase08d3-scientific-parity.md.
- Hidden-truth guard: PASS for all 23 non-complete occurrences of the real 24-occurrence flow; the last occurrence is complete. The pure projection returns null before touching hidden inputs, and a proxy that throws on any AAR input access proves the order. Mismatched run IDs are rejected. The normal product browser flow adds 45 live outerHTML inspections including attributes/title/aria; no new hidden content appeared.
- Passive UI: actual browser state/result JSON, full localStorage snapshot and instrumented Storage/IndexedDB mutation calls remain unchanged across expansion, collapse, navigation, dashboard/back and revisiting. No new event handler or state hook exists in the new section/helper.
- Typecheck, production build and scoped lint: all PASS. Commands/output are in build-checks.json; existing Vite large-chunk advisory remains advisory.
- Real browser: 14 PNGs, target sizes 1440×900, 1366×768, 1280×720 and 390×844, no horizontal document/report overflow. Physical RTL card positions/equal widths and mobile stacking are asserted. Native keyboard Enter expands the first checkpoint and the existing focus outline is visible. Desktop/mobile images were opened in the image viewer.

## Browser evidence and provenance

The first two screenshots come from a full normal eight-decision product playthrough with the existing user controls. Other captures load unchanged original completed engine runs: same/different/late cases are selected from the exact 112-run corpus, and six ending checks use the existing genuine archived witnesses. No belief, hidden world, evidence or scientific parameter was injected to force a case.

- scenario5-phase08d3-screenshots/00-actual-product-ending-1440x900.png
- scenario5-phase08d3-screenshots/01-actual-product-comparison-1440x900.png
- scenario5-phase08d3-screenshots/02-same-comparison-1440x900.png
- scenario5-phase08d3-screenshots/03-four-checkpoints-timeline-1440x900.png
- scenario5-phase08d3-screenshots/04-checkpoint-evidence-expanded-1440x900.png
- scenario5-phase08d3-screenshots/05-final-checkpoint-transitions-1440x900.png
- scenario5-phase08d3-screenshots/06-uncertainty-inventory-1440x900.png
- scenario5-phase08d3-screenshots/07-comparison-1366x768.png
- scenario5-phase08d3-screenshots/07-comparison-1280x720.png
- scenario5-phase08d3-screenshots/07-comparison-390x844.png
- scenario5-phase08d3-screenshots/08-mobile-evidence-390x844.png
- scenario5-phase08d3-screenshots/02-different-comparison-1440x900.png
- scenario5-phase08d3-screenshots/02-late-comparison-1440x900.png
- scenario5-phase08d3-screenshots/09-late-evidence-expanded-1440x900.png

inspection.json includes original run IDs, live-stage checks, displayed checkpoint/evidence text, card geometry, snapshot counts and passive-write findings. The isolated QA page has a visible TEST WITNESS banner and never supplies data to production gameplay. browser-witnesses.json records the actual selected world/policy and original unmodified completed state/result for reproducibility.

## Pre-existing historical failures — not reported as PASS

All three wrappers were run unchanged before and after editing; the same assertion locations already failed before this request:

- scripts/verify-s5-phase8d2-ux.tsx — FAIL: AssertionError [ERR_ASSERTION]: App including legacy id=2 and active id=5 unchanged
- scripts/verify-s5-phase09c1.tsx — FAIL: AssertionError [ERR_ASSERTION]: Unchanged existing source src/ui/components/scenario/scenario-five/ui/ScenarioFiveMissionEnding.tsx
- scripts/verify-s5-c2-refinement.tsx — FAIL: AssertionError [ERR_ASSERTION]: Unchanged pre-existing file .gitignore

Historical snapshot tests, baselines, calibration files and user work were not rewritten. Current feature tests and scientific boundaries are green; this does not assert that every historical suite is green. Prior successful wrapper reports remain historical artifacts, not new evidence. Baseline.json contains before logs, focused-verification.json contains after logs and new assertion counts.

## Artifacts and stopping point

- scenario5-phase08d3-belief-vs-reality-verification.json
- scenario5-phase08d3-scientific-parity.md
- scenario5-phase08d3-baseline.json, focused-verification.json, build-checks.json
- scenario5-phase08d3-screenshots/inspection.json and real PNGs
- scenario5-phase08d3.patch — relative to the start of this request, preserving the prior uncommitted orange-truth CSS.

Patch reverse apply check and real-index preservation are verified by the packaging script. No commit, reset, checkout, stash, cleanup of user files or publication was performed. Work stops at 08D.3; no 09D-2 or Cognitive V3 redesign was started. Known new blockers: none.
