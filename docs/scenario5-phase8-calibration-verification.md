# Scenario 5 — Phase 8 Calibration Verification

## 1. Completion summary

Phase 8 engineering calibration is complete. The audit ran without a browser and did not tune or modify the frozen model. The final calibration status is **FAIL** because four hard gates failed; this is a valid measured result, not an execution failure.

## 2. New files/artifacts

- Eleven calibration modules under `src/ui/components/scenario/scenario-five/calibration/`.
- `scripts/run-s5-phase8-calibration.ts` and `scripts/verify-s5-phase8-calibration.ts`.
- Deterministic summary, Persian report, eleven CSV result files, this verification record, and the Phase-8 patch under `docs/`.

## 3. Frozen hash verification

The normalized protected-source manifest contains 68 model/UI/source paths. Its SHA-256 before and after both audit executions was `1bd32af62f0667d3864eb7b2b0e7354e70bebe43178cdc8a64a880e8a138bef6`: **PASS**. No protected Scenario 5 model/UI source, Scenario 2 source, Scenario 4 cognitive dependency, shared event logger, host, app shell, or package manifest changed during Phase 8.

## 4. Environment panel verification

All 16 frozen worlds were covered with environment seeds 1..64: 1,024 environment instances. Each of four Actor profiles and four primary corridors appeared 256 times, all `early|nominal|late` latency variants appeared, and all 44 expected background-noise relations were observed: **PASS**.

## 5. Policy RNG/determinism

Calibration policies use the isolated uint32-seeded policy RNG and contain no `Math.random`. A fixed sample of 384 mission cases was replayed twice with identical outputs. A second complete audit produced the same artifact-set SHA-256, `0a9d46b91244270a29d1cb5050b5cb5dda022e950e3388442e04dded1eb68d1f`: **PASS**.

## 6. 25,600-run execution verification

Exactly 25,600 scheduled mission runs completed: 9,216 deterministic M1..M9 runs and 16,384 M10 random-policy runs. All scheduled runs finalized, with zero negative-resource, chronology, zero-option, or exact delay-identity failures: **PASS**.

## 7. Mission-policy verification

M1..M9 definitions, ordering, deterministic seed use, target helpers, and neutral reason/belief protocol were statically and artifact-verified. Each deterministic policy has exactly 1,024 rows: **PASS**.

## 8. Random-policy verification

M10 has exactly 16,384 rows, uses the isolated deterministic policy RNG, and samples only legal action/target pairs: **PASS**.

## 9. Action/target coverage

All 33 action IDs were observed. One legal action-target pair was not selected: `a2_focused_pnt:corridor_delta_west`; observed target counts for that action were alpha 2,816, beta 256, gamma 1,024, delta 0. `ACTION_TARGET_COVERAGE`: **FAIL**.

## 10. End-state coverage + witness search

Four of six end states appeared in the main audit: `critical_cargo_lost_or_compromised` 64, `delayed_delivery_persistent_disruption` 14,076, `resilient_delivery_unresolved_attribution` 10,180, and `resilient_delivery_threat_contained` 256. After 20,000 bounded witness-search runs, `priority_delivered_network_failure` and `mission_incomplete_continuity_preserved` remained `not_observed_under_phase8_search`. `SIX_END_STATES_OBSERVED`: **FAIL**.

## 11. Resource/forced-choice checks

Zero decision windows had no legal option and 0% were single-option windows. Both terminal resources were at least 50 in 16.577148% of runs; either terminal resource was at most 5 in 1.041667%. Resource and forced-choice warning thresholds did not fire: **PASS**.

## 12. Actor-distinctiveness checks

All six Actor-profile pairs were evaluated and all six met at least one frozen distinctiveness criterion. The complete component differences are in `actor-signatures.csv`: **PASS**.

## 13. Seed-sensitivity calculations

All 112 world×policy cells for M1..M7 were evaluated. One cell was flagged, a 0.892857% rate; the frozen warning threshold did not fire: **PASS**.

## 14. Pareto counterfactual audit

The audit evaluated 2,590 legal counterfactual branches without collapsing outcomes to a scalar score. Three action families universally Pareto-dominated alternatives in their sampled windows: `a1_preserve_reserve` (32/32), `b1_pulse_network` (32/32), and `c1_preserve_mobile_reserve` (32/32). `NO_UNIVERSAL_ACTION_DOMINANCE`: **FAIL**.

## 15. Shadow horizon/deadline/resource analyses

Post-hoc horizon tables cover exactly 330, 345, 360, 375, and 390 minutes. Deadline shifts cover exactly −30, −15, 0, +15, and +30 minutes. Resource path-feasibility covers exactly budgets 80, 90, 100, 110, and 120 and is explicitly labeled as path-feasibility rather than full counterfactual replay: **PASS**.

## 16. Cognitive synthetic-policy verification

C1..C15 each produced 256 deterministic runs (3,840 total); C16 produced 4,096 random runs, for 7,936 cognitive runs total. All frozen policy definitions and output fields were present: **PASS**.

## 17. Random OSI centering

C16 means were overall −0.089226, Phase A −0.372951, Phase B +0.060145, Phase C +0.002391, and Phase D −0.046491. Overall, Phase A, and Phase B exceeded the frozen absolute 0.05 limit. `RANDOM_OSI_CENTERING`: **FAIL**.

## 18. Cognitive anchor gates

All 12 frozen orientation, information-seeking, second-order, adversary-modeling, stewardship, planning, MCI, risk, coherence, and evidence-updating checks passed: **PASS (12/12)**.

## 19. Distribution screen

All engineering distribution screeners were calculated. `escalationSensitivity` (SD 4.856517), `multiDomainIntegration` (SD 4.895235), and `integration` (SD 3.185132) triggered `engineering_low_variance`. `COGNITIVE_DISTRIBUTION_WARNING`: **WARNING**. This warning does not alter hard-gate status.

## 20. Cognitive firewall

One hundred paired observable bundles were evaluated with hidden truth/domain outcome fields excluded. Each pair produced identical cognitive outputs: **PASS**.

## 21. Runtime clock audit

The pre-finalization decision clock ranged from 237 to 293 minutes; 100% of runs were at or below 300 minutes and the maximum was below the frozen 360-minute bound: **PASS**.

## 22. Phase-3/4/5/6/7 regression results

- Phase 3: **PASS**, 86 assertions.
- Phase 4: **PASS**, 464 assertions.
- Phase 5: **PASS**, 388 assertions.
- Phase 6: **PASS**, 2,979 assertions.
- Phase 7: **PASS**, 562 assertions.

No existing verifier was edited in Phase 8.

## 23. Typecheck/build/calibration commands and results

- `npx tsc -b`: **PASS**.
- `npm run build`: **PASS**, 118 modules transformed.
- `npx tsx scripts/run-s5-phase8-calibration.ts`: **PASS** as an execution; overall measured calibration status **FAIL**.
- `npx tsx scripts/verify-s5-phase8-calibration.ts`: **PASS**, 91 independent assertions.
- Two complete executions yielded byte-identical deterministic artifacts.

## 24. Patch/result artifact integrity

All eleven CSV files are UTF-8, headered, deterministically ordered, and machine-readable; the summary JSON contains no `NaN` or `Infinity`. The unified patch embeds the calibration sources, both scripts, verification/report Markdown, summary JSON, and the nine small deterministic CSVs. Exactly these generated files are excluded from patch embedding because of size:

- `docs/scenario5-phase8-results/mission-runs.csv`
- `docs/scenario5-phase8-results/cognitive-runs.csv`

`git -c core.autocrlf=false diff --check`, patch warning scan, `git apply --stat`, and `git apply --check --reverse` all passed after patch generation.

## 25. Known limitations

The world/seed frequencies are not real-world event probabilities; synthetic policies are not human behavior; engineering calibration is not psychometric validation. Time, cost, threshold, and loading parameters still require expert review and human validation. The failed gates and warning above are preserved for a human reviewer; no numeric replacement is proposed or applied. Phase 8A and Phase 9 were not started.

## 26. Statement

No model parameter was automatically changed by Codex in Phase 8.
