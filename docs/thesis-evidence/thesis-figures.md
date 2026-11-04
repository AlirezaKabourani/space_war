# Recommended thesis figures and tables — پیشنهاد شکل‌ها، جدول‌ها و اسکرین‌شات‌ها

خلاصه فارسی: شکل‌های پیشنهادی باید میان «رفتار واقعی کد»، «خروجی شبیه‌سازی آرشیوی» و «ادعای نیازمند اعتبارسنجی انسانی» تمایز بصری ایجاد کنند. زیرنویس هر نمودار باید نسخه مدل، seed/جهان، دامنه شمارش و محدودیت روش را ذکر کند.

## Selection principles

Use figures that demonstrate implemented mechanics and evidence provenance. Label archived screenshots with their capture artifact/date and do not imply that a screenshot validates educational effectiveness. For Persian thesis layout, keep English identifiers in monospace and put the Persian explanation in the caption.

## Architecture and data-flow figures

1. **Client-side system architecture.** Render the Mermaid flowchart in `system-architecture.md` with Mermaid CLI or a Markdown renderer. Caption: «معماری واقعی برنامه تک‌صفحه‌ای و مسیر ذخیره محلی داده‌ها». Evidence: `src/App.tsx:183-336,2476-2605`, `MiniGameHost.tsx:613-670`, `eventLogger.ts:33-60`.
2. **Decision lifecycle sequence.** Render the Mermaid sequence in `system-architecture.md`. Emphasize that adjudication and persistence execute in-browser.
3. **S4 adjudication pipeline.** Render the Mermaid flowchart in `decision-engine.md`, adding a dashed boundary around hidden state. Evidence: `scenario-four/model/initialState.ts:20-78`; adjudicators; `move3Adjudicator.ts:376-498`.
4. **S5 stage machine.** Generate a flow diagram directly from the ordered identifiers at `scenario-five/model/runtime/stageMachine.ts:10-44`: eight decision nodes, four belief nodes, three reason nodes, repeated outcome review, completion.
5. **Persistence map.** Table/diagram of localStorage keys: profiles, behavior events, logging flag, system events, S4 snapshots/run. Sources: `profileStorage.ts:9`; `eventLogger.ts:33-34`; `systemLogger.ts:3`; `ScenarioFourRedesignedScenarioOne.tsx:182-183`; `systemStorage.ts:77-132`.

## Scenario and model tables

6. **Scenario inventory/status matrix.** Reuse the first table in `scenario-inventory.md`, visually separating released (`0,4,5`) from full-catalog legacy (`1,2,3`).
7. **State-variable comparison.** Columns: S1, S2, S3, S4, S5; rows: visible state, hidden state, resources, time, opponent, random seed, persistence, ending count. Source locations are provided in `scenario-inventory.md`.
8. **Decision-window/action matrix.** For S4 list 3×3 core windows plus rationale/attribution/off-ramp; for S5 list eight windows and per-round action counts from `actionCatalog.ts:30-71`.
9. **Index scale compatibility table.** Show S1 OSI `[-1,1]`, S2 OSI `[0,100]`, S4/S5 OSI `[-1,1]`, and the S4 risk-posture inconsistency. Use `indices-and-formulas.md` as the figure source.
10. **Validation-evidence matrix.** Rows: source assertion, browser, seeded simulation, exhaustive enumeration, archived calibration, human validation. Mark S0–S5 availability. This makes the absence of human validation explicit.

## Quantitative figures from existing artifacts

11. **S4 ending distribution (exhaustive structural run).** Plot the nine counts from `analysis/scenario4-resource-after/summary.json:29-40`; caption must say “8,352,000 structural paths, one world/resource profile; reasons and attribution sliders fixed,” citing metadata `:2-28`. A log-scale secondary version may help display the rare coalition-fracture outcome.
12. **S4 ending reachability by hidden intent.** Build a stacked bar/heatmap from the artifact's `byIntent` block (begins `summary.json:41`). This visualizes code behavior, not empirical likelihood.
13. **S4 random OSI reference distribution.** Plot the recorded percentiles/mean/SD from `docs/scenario4-random-baseline-v2.json:2-12`. Label it V2 and do not substitute it for current V3 human norms.
14. **S5 Phase 8B end-state distribution.** Use `docs/scenario5-phase8b-summary.json` `endStateDistribution`; visibly mark the zero-count state and note fixed-witness reachability. Include model/calibration versions from `:2-8`.
15. **S5 test-evidence funnel.** Diagram the archived counts: 25,600 mission runs, 7,936 cognitive runs, 384 deterministic replay cases, 40,540 counterfactual branches (`scenario5-phase8b-summary.json:9-16`).
16. **Current verifier status.** Red/green table from `docs/scenario5-current-verifier-status.json`, separating model assertions from byte-sensitive hash/patch checks.

Recommended reproducible generation approach: write a small analysis script that reads these JSON files and emits SVG/PNG plus a CSV of plotted values. Do not transcribe numbers manually without also saving the extraction script and artifact hashes. No such thesis-specific plot script currently exists.

## Existing screenshots suitable for citation

| Thesis purpose | Existing artifact | Qualification |
|---|---|---|
| S0 guided-learning introduction | `docs/screenshots/scenario0-learning/00-introduction-desktop.png` | Archived browser capture; generator `scripts/validate-s0-learning-browser.mjs:78-95` |
| S0 quiz feedback | `docs/screenshots/scenario0-learning/05-quiz-feedback.png` | Shows instructional feedback; generator `:224-235` |
| S0 concept lab | `docs/screenshots/scenario0-learning/06-lab-reaction.png` | Shows action/reaction lab; generator `:252` |
| S4 three-move decision UI | `docs/screenshots/scenario4-phase6/1440x900-move1-decision.png`, `...move2-decision.png`, `...move3-decision.png` | Current archived Phase 6 visual set |
| S4 resource constraint | `docs/screenshots/scenario4-phase6/1440x900-resource-insufficient-hard-block.png` | Good evidence for affordability gate |
| S4 final report/AAR | `docs/screenshots/scenario4-phase6/1440x900-final-report.png`, `...aar.png`, `...aar-statistics.png` | Use with formula/AAR qualifications |
| S5 decision/evidence progression | `docs/scenario5-current-flow-screenshots/04-r1-decision.png`, `07-r2-decision.png`, `08-r2-evidence-view.png` | Current audit sequence |
| S5 belief/rationale gates | `docs/scenario5-current-flow-screenshots/06-a2-prebelief.png`, `14-b-reason.png`, `24-d-final-belief.png` | Demonstrates telemetry checkpoints |
| S5 AAR | `docs/scenario5-current-flow-screenshots/28-aar-overview.png`, `32-aar-cognitive.png`, `32-aar-domain.png`, `32-aar-truth.png`, `32-aar-limitations.png` | Strongest evidence of disclosed truth and limitations |
| S5 responsive UI | `docs/scenario5-phase8c-screenshots/11-reason-mobile-390x844.png`, `12-aar-mobile-390x844.png` | Archived responsive captures |

For S5 current-flow screenshots, retain `docs/scenario5-current-flow-screenshots/manifest.json` and `observations.json` alongside selected images. The manifest records viewport, deterministic epoch, world audit, and result consistency (`scripts/audit-s5-current-flow-browser.mjs:214-216`).

## Suggested capture/generation instructions

Existing capture commands write files and launch a browser, so run them only in a clean reproducibility branch/worktree:

```powershell
npm run test:s0-learning-browser
node scripts/capture-s4-phase6-qa.mjs
node scripts/audit-s5-current-flow-browser.mjs
node scripts/capture-s5-phase8c.mjs
```

The S0 script writes to `docs/screenshots/scenario0-learning` (`validate-s0-learning-browser.mjs:78-86`); S4 Phase 6 to `docs/screenshots/scenario4-phase6` (`capture-s4-phase6-qa.mjs:7-8,112-228`); S5 current flow to `docs/scenario5-current-flow-screenshots` (`audit-s5-current-flow-browser.mjs:6-7,210-216`); S5 Phase 8C to `docs/scenario5-phase8c-screenshots` (`capture-s5-phase8c.mjs:6-7,94-239`). Record commit hash, browser/Node versions, viewport, seed/epoch, and output hashes in the thesis research log.

## Figures to avoid or qualify

- Do not call S4/S5 cognitive radar plots “psychological profiles”; use “coded behavioral proxy profile.”
- Do not present exhaustive-path frequencies as probabilities or forecasts.
- Do not compare the three OSI implementations on one numeric axis without rescaling and explaining their different definitions.
- Do not use S3 event data as evidence of cognitive assessment; no formula exists.
- Do not present admin dashboard “estimated cognitive load,” “overconfidence,” or “guidance benefit” as validated constructs or causal effects.
- Do not use historical/superseded S5 Phase 8 failure artifacts as current results without version labels.

## Concise evidence completeness report

| Evidence area | Completeness | Remaining requirement |
|---|---|---|
| Architecture, stack, module/data flow | High | Deployment environment and supported-browser policy are undocumented. |
| Scenario/action/state inventory | High for code; medium for pedagogy | Formal learning objectives/rubrics and domain-expert rationale are not versioned as research instruments. |
| Decision/adjudication formulas | High for S4/S5; medium for legacy scenarios | Independent specification and requirements traceability are absent. |
| Behavioral/cognitive proxies | Formula-complete | Expert validation, reliability, construct/criterion validity, norms, and human-subject evidence are missing. |
| Logging/AAR | High for schema/code | Data governance, consent, integrity, server backup and user replay are missing. |
| S4 8,352,000/nine-ending claim | Supported with scope limitations | Reproduction on the current commit and artifact hashes should be recorded before thesis submission. |
| S5 engineering validation | Substantial but mixed | Current suite is not all-pass; resolve or formally waive CRLF/hash and patch-applicability failures, then rerun in a clean pinned environment. |
| S0–S3 validation | Partial | S1–S3 lack comparable exhaustive/replay artifacts; S0 lacks educational outcome study. |
| Real-world/educational effectiveness claims | Unverified | External sources, expert review, ethics approval where applicable, and a defined evaluation study are required. |

Bottom line: the repository provides strong evidence for implemented software behavior and deterministic engineering checks, especially S4/S5. It does not by itself establish operational realism, psychological validity, or educational effectiveness.
