# Scenario 5 — Phase 8A Audit-Method Correction Verification

## Completion and scope

Phase 8A is complete as an audit-method correction. No Scenario 5 model/UI parameter or source was changed. Calibration code moved to `s5-calibration-v1.1.0`; the frozen mission, cognitive, runtime, domain-metric, and Phase-7 UI/AAR versions remained unchanged. Phase 8B and Phase 9 were not started.

## Frozen source and original Phase-8 archive

- Frozen application manifest: 68 paths, aggregate SHA-256 `1bd32af62f0667d3864eb7b2b0e7354e70bebe43178cdc8a64a880e8a138bef6` before and after Phase 8A — **PASS**.
- Original Phase-8 archive: 14 files, aggregate SHA-256 `a3df95fe09cb3ab1d2bc7e741ffbeb66dc70b6bd41720faec284fc38a19beaf6` before and after Phase 8A — **PASS**.
- The archived Phase-8 result remains: overall **FAIL**, four original hard-gate failures, and three cognitive low-variance warnings. Phase 8A does not rewrite that history.

## Corrected deterministic sampling

- Mission main audit: 25,600 completed runs: 9,216 M1..M9 plus 16,384 M10.
- Cognitive audit: 7,936 completed runs: 3,840 C1..C15 plus 4,096 C16.
- M10 effective policy seeds: 16,384/16,384 unique.
- C16 effective policy seeds: 4,096/4,096 unique.
- No hash construction or `Math.random` was used for policy seeds.
- Deterministic replay: 384 paired cases — **PASS**.

## Explicit action-target probes

All 33 action IDs occurred in the corrected main audit. The explicit table contains all 64 combinations of 16 target-required actions × four canonical corridors; all 64 were legal and committed successfully with one or more structural ticks advanced. The original `a2_focused_pnt:corridor_delta_west` gap was present, active, affordable, accepted, and committed. `ACTION_TARGET_COVERAGE_V2`: **PASS**.

## OSI centering

Eight unique diagnostic available-action sets were evaluated structurally. Each arithmetic mean of frozen adjusted orientations was exactly zero at the stored precision, within `1e-12`. `OSI_STRUCTURAL_CENTERING`: **PASS**.

Corrected C16 Monte Carlo means were: overall `0.006270`, Phase A `0.008773`, Phase B `0.012308`, Phase C `-0.001709`, and Phase D `0.005708`. Every value is within the unchanged ±0.05 threshold. `RANDOM_OSI_MONTE_CARLO_CENTERING`: **PASS**.

## Multi-continuation Pareto audit

Every one of eight decision windows contributed 128 unique pre-decision states. All legal action families and target variants were evaluated under K1 balanced, K2 information-heavy, K3 mobility-resilience, and K4 low-response-reversible continuations. The corrected 16-dimensional vector includes attribution, true-corridor corroboration, and mean/max PNT exposure and contains no scalar weighted score.

The audit executed 40,540 counterfactual branches. The prior `a1_preserve_reserve`, `b1_pulse_network`, and `c1_preserve_mobile_reserve` findings each have four explicit continuation rows, and none is universal across all four continuations. `DOMINANCE_STATE_COVERAGE`: **PASS**. `NO_UNIVERSAL_ACTION_DOMINANCE_V2`: **PASS**.

## Structured reachability

The bounded deterministic search directly used `createInitialMissionState`, `getAvailableMissionActions`, `applyMissionDecision`, and `resolveMissionEndState`. It targeted exactly the two missing Phase-8 states over 48 smallest representative world/latency environments, retained at most 2,500 states per environment/depth, and used no random pruning.

- Applied branches: 4,966,163.
- Unique generated states: 4,719,177.
- Retained states: 500,160.
- Maximum beam width: 2,500.
- `mission_incomplete_continuity_preserved`: observed in structured search.
- `priority_delivered_network_failure`: not observed under Phase-8A structured search.

Boundary A found minimum network continuity `75` with alpha delivered. Boundary B found maximum alpha projected arrival `365` and maximum alpha delay `155` while integrity was at least 55 and all three secondary convoys were on-time/operational. Boundary C found maximum alpha projected arrival `365` with integrity at least 55. Therefore no bounded Phase-8A witness reached the current `priority_delivered_network_failure <=50` continuity condition. This is bounded-search evidence, not a mathematical proof. `SIX_END_STATES_OBSERVED_V2`: **FAIL**.

Static inspection confirmed historical `missionEvents` payloads are not read by transition physics; only length/last ID are used for event provenance. Search-key deduplication therefore excludes historical `missionEvents` while retaining every future-relevant mission/Actor/evidence field.

## Extended horizon and resource diagnostics

The shadow horizon table contains exactly 270, 285, 300, 315, 330, 345, 360, 375, and 390 minutes. The official 360-minute horizon and 100/100 resource budgets were not changed. Minimum available-action-count distribution and p05/p25/median/p75/p95 final ISR/support are recorded in the summary.

## Cognitive warnings

With corrected random sampling, the low-variance warning for `escalationSensitivity` disappeared. The warnings for `multiDomainIntegration` and `integration` persist. Warning thresholds and cognitive loadings were not modified.

## Original failure dispositions

- `ACTION_TARGET_COVERAGE`: `audit_sampling_issue`.
- `SIX_END_STATES_OBSERVED`: `model_or_taxonomy_issue_confirmed`.
- `NO_UNIVERSAL_ACTION_DOMINANCE`: `original_audit_incomplete`.
- `RANDOM_OSI_CENTERING`: `random_sampling_issue`.

## Corrected hard-gate result

Fifteen of sixteen corrected hard gates passed. Only `SIX_END_STATES_OBSERVED_V2` failed, so corrected overall audit status is **FAIL**. The only active warning is `COGNITIVE_DISTRIBUTION_WARNING` for `multiDomainIntegration` and `integration` low variance.

## Independent verifier and regression

- Phase 3 verifier: **PASS**, 86 assertions.
- Phase 4 verifier: **PASS**, 464 assertions.
- Phase 5 verifier: **PASS**, 388 assertions.
- Phase 6 verifier: **PASS**, 2,979 assertions.
- Phase 7 verifier: **PASS**, 562 assertions.
- Phase 8A verifier: **PASS**, 106 assertions.
- `npx tsc -b`: **PASS**.
- `npm run build`: **PASS**, 118 modules transformed.
- `git -c core.autocrlf=false diff --check`: **PASS**.

No existing verifier was edited.

## Patch and artifact integrity

The patch embeds the Phase-8 calibration-source changes, new Phase-8A scripts, verification/report/summary, and all small deterministic Phase-8A tables. Exactly these generated files are excluded from patch embedding because of size:

- `docs/scenario5-phase8a-results/mission-runs.csv`
- `docs/scenario5-phase8a-results/cognitive-runs.csv`

Patch warning scan, `git apply --stat`, and `git apply --check --reverse` passed after patch generation.

## Final statement

No model parameter was automatically changed by Codex in Phase 8A.
