# Testing and validation evidence — آزمون، شبیه‌سازی و اعتبارسنجی

خلاصه فارسی: شواهد مهندسی برای S4 و S5 گسترده است. ادعای ۸٬۳۵۲٬۰۰۰ مسیر و دسترسی‌پذیری ۹ پایان برای فضای ساختاری تعریف‌شده S4 پشتیبانی می‌شود، اما این شمارش احتمال واقعی یا اعتبار آموزشی/روان‌شناختی را اثبات نمی‌کند. مجموعه آزمون جاری S5 نیز در وضعیت «همه‌قبول نیست» قرار دارد.

## Audit method

This audit located source scripts and existing outputs first. It did **not** rerun exhaustive or browser-capture simulations. Recorded results below are artifact claims, not newly reproduced results. No conventional Jest/Vitest unit-test framework is configured; tests are bespoke assertion, model-enumeration, browser/CDP, screenshot, source-hash, and calibration scripts.

## Standard repository commands

Declared commands are in `package.json:6-27`:

```powershell
npm run dev
npm run build
npm run lint
npm run test:profiles
npm run test:system-management
npm run test:system-management-browser
npm run test:s0-learning-browser
npm run test:s4-models
npm run test:s4-cognitive-v3
npm run test:s4-narrative-phase1
npm run test:s4-narrative-phase2
npm run test:s4-narrative-phase3
npm run test:s4-narrative-phase4
npm run test:s4-narrative-phase5
npm run test:s4-narrative-phase6
npm run test:s4-aar-ux
npm run test:s4-attribution-confidence
npm run test:s4-resource-calibration
```

`npm run build` runs `tsc -b && vite build`; `npm run lint` runs `eslint .` (`package.json:8-9`). They were not rerun during this read-only evidence audit because build/browser scripts create output files and the user requested inspection of existing evidence first.

## Test inventory

| Area | Test type | Evidence/coverage |
|---|---|---|
| Profiles | assertion script | `scripts/validate-profiles.ts`; command `npm run test:profiles` |
| Backup/system administration | model assertions + browser flow | `scripts/validate-system-management.ts`, `validate-system-management-browser.mjs`; package scripts `:11-12` |
| S0 | end-to-end browser/CDP, keyboard/responsive/telemetry and screenshots | `scripts/validate-s0-learning-browser.mjs:78-287`; existing `docs/screenshots/scenario0-learning/` |
| S4 | model, cognitive, six narrative phases, AAR UX, attribution, resource calibration | composite `test:s4-models`, `package.json:14`; individual scripts in `scripts/validate-s4-*` |
| S4 exhaustive | deterministic path enumeration, reports, confidence/resource audits | `scripts/exhaustive-s4-outcomes.ts:20-29,533-1017`; archived `analysis/scenario4-*` |
| S4 stochastic QA | seeded run/actor/inject/end-state coverage and option-profile distribution | `docs/scenario4-seeded-qa-10000.json`; `docs/scenario4-random-baseline-v2.json`; profile audit snapshot in source |
| S5 phases 3–8 | model, mission, cognitive, runtime, UI, audit/calibration and UI cohesion | `scripts/verify-s5-phase3-model.ts` through `verify-s5-phase8c-ui.ts`; calibration runners |
| S5 current audit | source freeze, catalogs, docs, verifier audit, browser flow, path traces | `scripts/audit-s5-current-flow*`; `docs/scenario5-current-audit-*.json` |

## Scenario 4: 8,352,000 paths and nine endings

### What is supported

`analysis/scenario4-resource-after/summary.json:29` records `totalPaths: 8352000`. Its `endStates` block (`:30-40`) contains nonzero counts for all nine resolver outcomes:

| Ending | Archived count |
|---|---:|
| `escalation_spiral` | 60,765 |
| `intelligence_failure` | 648,000 |
| `coalition_fracture` | 17,484 |
| `negotiated_deescalation` | 2,644,704 |
| `calm_crisis_control` | 41,601 |
| `costly_deterrence` | 33,822 |
| `persistent_ambiguity` | 3,261,705 |
| `strategic_information_opportunity` | 1,353,813 |
| `mixed_crisis_containment` | 290,106 |

The counts sum to 8,352,000. Metadata records one world, all five intents, resource profile A, `summaryOnly: true`, and duration 1007.625 seconds (`summary.json:2-28`). A second structural artifact independently records 8,352,000 paths at `analysis/scenario4-report-study/20260927-172651/structural-world1/summary.json:29`. A five-world robustness artifact records 41,760,000 paths (`.../robustness-worlds5/summary.json:29`), exactly five times the one-world count.

The enumerator loops across world, five intents, every Move-1 information/protection/communication option, Move-2 investigation/mission/response option, and Move-3 threshold/course-of-action/information-policy/off-ramp combination (`scripts/exhaustive-s4-outcomes.ts:578-831`). It increments `summary.totalPaths` once per legal combination (`:831`). Exact invocation examples are documented by the script (`:20-29`):

```powershell
npx tsx scripts/exhaustive-s4-outcomes.ts --worlds 1 --summary-only
npx tsx scripts/exhaustive-s4-outcomes.ts --worlds 5 --summary-only
```

### What is not supported

The script and artifact explicitly state that rationale fields and three player attribution sliders are held constant because they do not alter the primary resolver (`scripts/exhaustive-s4-outcomes.ts:9,540`; artifact metadata `:17-18`). Therefore 8,352,000 is exhaustive for the coded **structural ending-decision space under the stated one-world/resource configuration**, not every UI interaction, evidence-open ordering, timestamp, rationale, slider, seed, resource profile, or telemetry path. Counts are reachability frequencies under enumeration, not probabilities of real human/operational outcomes.

### Additional archived S4 evidence

- `docs/scenario4-seeded-qa-10000.json:2-14` records 10,000/10,000 completed seeded runs with all nine endings; subsequent blocks record actor and inject coverage. This is a seeded simulation sample, not exhaustive enumeration.
- `docs/scenario4-random-baseline-v2.json:2-12` records 100,000 iterations, seed 23063, mean OSI `-0.0002824`, SD `0.22618`, tolerance `0.02`, `passed: true` for the older orientation V2 baseline.
- Current S4 profile source embeds a 100,000-sample audit and warnings for low variance/discrimination/ceiling (`scenario-four/model/cognitiveOptionProfilesV3.ts:10-27`). These warnings limit interpretability despite passing engineering checks.
- Existing phase reports and screenshots are under `docs/scenario4-*-report.md` and `docs/screenshots/scenario4-phase*/`; they are generated QA evidence, not peer-reviewed validation.

## Scenario 5 validation evidence

### Phase 8B archived calibration result

`docs/scenario5-phase8b-summary.json:2-16` matches active mission model `s5-mission-v1.1.0` and calibration `s5-calibration-v1.2.0`; it labels status `engineering_audit_not_human_validated`. It reports:

- 25,600 main mission runs (9,216 deterministic + 16,384 random);
- 7,936 cognitive runs (3,840 deterministic + 4,096 random);
- 384 deterministic replay cases;
- 40,540 counterfactual branches;
- 563,200 trajectory field comparisons with zero mismatches (`:38-43`);
- all listed engineering gates PASS (`:284-291`) and overall status PASS (`:1152`), with warnings including outcome saturation/low cognitive variance (`:1118,1148`).

The active six-state taxonomy is listed in the artifact (`:18-32`). One ending has zero occurrences in the main distribution (`mission_incomplete_continuity_preserved`, visible around `:60-67`); the report uses an approved fixed witness for reachability rather than claiming all six appeared in the 25,600 distribution. This is a calibration/engineering result, not human validation.

Typical direct commands (not package aliases) are:

```powershell
npx tsx scripts/verify-s5-phase3-model.ts
npx tsx scripts/verify-s5-phase4-mission.ts
npx tsx scripts/verify-s5-phase5-cognitive.ts
npx tsx scripts/verify-s5-phase6-runtime.ts
npx tsx scripts/verify-s5-phase7-ui.ts
npx tsx scripts/verify-s5-phase8a-audit.ts
npx tsx scripts/verify-s5-phase8b-calibration.ts
npx tsx scripts/verify-s5-phase8c-ui.ts
```

These are not declared in `package.json`; reproducibility depends on `tsx` being available as installed dev tooling.

### Current verifier status: not all passing

The most recent consolidated artifact `docs/scenario5-current-verifier-status.json` records:

- Phase 3 PASS, 86 assertions (`:2-8`);
- Phase 4 PASS, 470 assertions (`:9-15`);
- Phase 5 PASS, 388 assertions (`:16-22`);
- Phase 6 FAIL due expected versus actual source hash (`:23-30`);
- Phase 7 PASS, 602 assertions (`:31-37`);
- Phase 8B FAIL because reverse patch applicability/trailing whitespace check fails (`:38-44`);
- isolated LF-normalized Phase 6 PASS, 2,979 assertions (`:45-52`).

The companion current audit explicitly states `currentVerifierSuite: NOT_ALL_PASS` (`docs/scenario5-current-audit-validation-result.json:10`). It otherwise records source freeze/inventory/sync pass, 39 screenshots, zero browser failures, 128 representative runs, 3,072 path rows, one major/ten moderate/six minor issues, and a naive/resource-only upper bound of 24,227,840 action-target sequences (`:2-35`). The representative sample observes only three of six end states (`:36-43`); it is not exhaustive.

**Discrepancy:** it would be inaccurate to cite only the Phase 8B `overallStatus: PASS` as “the current suite passes.” The archived calibration gates pass, while the consolidated current verifier suite has two repository-portability/source-freeze failures. Conversely, those failures do not by themselves prove the mission/cognitive logic is wrong; one is CRLF/hash-sensitive and the other is patch-applicability/whitespace-sensitive.

### Phase 8D work in progress at audit cutoff

At the final inspection cutoff (2026-11-03 17:32 Asia/Tehran), the worktree also contained uncommitted Phase 8D materials: `scripts/verify-s5-phase8d-integrated-gameplay.ts`, `docs/scenario5-phase8d-baseline.json`, `docs/scenario5-phase8d-checks/before-*.txt`, and presentation-layer edits/new helpers. The verifier records a preimplementation baseline of 16 worlds × 7 player-valid policies and is designed to assert exact model parity (`verify-s5-phase8d-integrated-gameplay.ts:1-27`). Only `before-*` check outputs were present; no completed Phase 8D report or after-validation artifact was found. In particular, `before-8b-calibration.txt` records a failure of the frozen live-UI aggregate hash. These files are therefore **planned/in-progress evidence**, not a completed passing validation phase.

The concurrent source edits add richer S5 outcome/resource presentation and a `buildStoredScenario5Outcome` helper (`scenario-five/ui/presentation.ts:97-173`) without modifying the frozen mission/cognitive model files. The helper reads immutable committed records and does not itself provide persisted run hydration or a user-facing replay controller. Because these changes appeared during the read-only audit and remained uncommitted, thesis claims should cite a commit hash after Phase 8D is finalized and rerun the relevant verifier suite.

### Superseded evidence

`docs/scenario5-phase8-summary.json` is an earlier model/calibration artifact and reports failed reachability/dominance/centering gates. It is superseded by Phase 8A/8B source and must not be mixed with current model `v1.1.0`. The source version constants are authoritative (`scenario-five/model/mission/config.ts:4`; `calibration/versions.ts:1-2`).

## Unit/integration/simulation classification

- **Unit-like:** assertion scripts exercise pure functions, catalogs, formulas, hashes, and invariants, but are not organized in a test runner with isolated test cases/coverage reports.
- **Integration-like:** S4/S5 verifiers execute multi-module trajectories and validate mapping, resources, actor/evidence behavior, replay and end states.
- **Browser/E2E:** Chrome DevTools Protocol scripts navigate screens, interact, check layout/leaks/accessibility behaviors, and write screenshots.
- **Simulation/calibration:** exhaustive S4 and sampled/structured S5 drivers enumerate policies/worlds and aggregate distributions.
- **Scenario validation:** exact action/ending reachability and deterministic replay are covered most strongly in S4/S5; S1–S3 lack comparable archived exhaustive evidence.

No code-coverage percentage, mutation testing, property-based framework, CI workflow status, performance benchmark baseline for the full SPA, or independent external validation report was found.

## Reproduction guidance

1. Record Node/npm versions and commit hash before running; archived errors mention Node 22.18.0, but the repository does not pin Node via `engines`.
2. Run `npm ci`, then `npm run build` and `npm run lint` in a clean checkout.
3. Run the declared profile/system/S0/S4 commands.
4. Run S5 phase verifiers in numeric order; preserve original line endings because hash gates are byte-sensitive.
5. Compare generated JSON model/version fields, not just filenames.
6. For S4 exhaustive reproduction, begin with `--max-paths 10000`; only run full enumeration with explicit approval and a dedicated output directory. The archived one-world runs took roughly 752–1,162 seconds, and five-world robustness roughly 2,945 seconds (`analysis/scenario4-report-study/.../summary.json` metadata).
7. Archive stdout/stderr, seed, command, commit hash, OS, Node version, duration, and generated-file hashes.

## Validation conclusion

Engineering evidence supports deterministic execution, structural reachability and many invariants. It does not support psychometric validity, learning effectiveness, operational predictive validity, or probability calibration against real space-conflict data. Those require expert review and human-subject/criterion studies outside the current repository.
