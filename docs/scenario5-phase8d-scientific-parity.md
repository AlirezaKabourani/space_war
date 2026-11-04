# Phase 08D scientific parity and verifier status

Before implementation, verify-s5-phase8d-integrated-gameplay.ts --record-baseline recorded **112 complete runs**: all 16 canonical worlds x seven representative player-valid policy families, environmentSeed=1. Policies: balanced_network, priority_alpha, information_heavy, mobility_resilience, resource_preserver, high_response, low_response_reversible. Oracle/stress/random policies were excluded from the parity corpus.

After implementation, every complete SimulationRun is compared using an exact SHA-256 digest. This includes action/target sequences, final mission/convoys/resources, runtime events, visible evidence IDs/order, operational attribution, containment, domain results and cognitive results. **Semantic mismatch count: 0**. No DOM IDs or presentation timestamps enter the corpus.

All 63 preimplementation frozen file hashes still match, including world/mission/Actor/evidence/cognitive/option/domain/calibration sources, Phase-8B reference data, and legacy Scenario-2 sources. App.tsx is byte-identical to its recorded baseline. The file manifest additionally restricts every changed path to the authorized presentation/test/document set. The only active scenario-tree change is neutral outer-end copy.

## Unchanged historical verifier execution

| Verifier | Prior expected assertions | Actual current result |
| --- | --- | --- |
| 3-model | 86 | Scenario 5 Phase-3 model verification passed (86 assertions). |
| 4-mission | 470 | Scenario 5 Phase-4 mission verification passed (470 assertions). |
| 5-cognitive | 388 | Scenario 5 Phase-5 cognitive verification passed (388 assertions). |
| 6-runtime | 2979 | Scenario 5 Phase-6 runtime verification passed (2979 assertions). |
| 7-ui | 602 | FAIL; exact unchanged verifier output in scenario5-phase8d-checks/after-7-ui.txt |
| 8-calibration | historical / phase-specific | FAIL; exact unchanged verifier output in scenario5-phase8d-checks/after-8-calibration.txt |
| 8a-audit | historical / phase-specific | FAIL; exact unchanged verifier output in scenario5-phase8d-checks/after-8a-audit.txt |
| 8b-calibration | 131 | FAIL; exact unchanged verifier output in scenario5-phase8d-checks/after-8b-calibration.txt |
| 8c-ui | historical / phase-specific | FAIL; exact unchanged verifier output in scenario5-phase8d-checks/after-8c-ui.txt |
| 8d-integrated-gameplay | historical / phase-specific | Phase 08D presentation PASS: 32798 assertions; 6 ending witnesses.; Phase 08D parity PASS: 112 runs; zero mismatches; all frozen hashes unchanged. |


The strict all-verifiers-green acceptance status is **FAIL**. This is retained rather than weakening old assertions:

- Phase 7 failed before work on the eventLogger byte hash. The current run reaches the same first failure with the same actual/expected hashes. The existing resource-panel call remains compatible; the header evidence count is added to its safe presentation data.
- Phase 8 and 8A already failed before work because the protected manifest contains 71 entries while their old expectation is 68.
- Phase 8B failed before work on its frozen live-UI aggregate hash. The current run reaches that same first failure, after its archive reverse-patch check and preceding scientific assertions. The archive and its compatibility title mapping remain unchanged; the approved 08D titles live in the new ending helper. Its frozen-UI snapshot assumption predates the required presentation redesign.
- Phase 8C already failed before work on its recorded archive hash for scenario5-phase8b-engineering-verification.md. That same first failure remains; it also freezes the old summary UI, superseded by the 08D contract.
- The historical metric inventory freezes the entire scenario-five directory at 55 files and a historical source hash. Its final fingerprint gate is incompatible with later phases and new presentation helpers; it fails unchanged. It is an archived inventory, not a current model-parity result.

No previous verifier was edited. Phase 3/4/5/6 still pass with exactly 86/470/388/2979 assertions. The new phase suite covers current UI invariants, all six resolver states, and exact whole-run scientific parity. It passes 32798 assertions. This is evidence of no semantic regression, not a claim that the obsolete historical UI/archive checks pass.

Typecheck: PASS. Build: PASS. Scoped ESLint: PASS. The existing Vite >500 kB chunk advisory remains; prior evidence appears in scenario5-phase8c-gameplay-cohesion-verification.md. No dependency/configuration change or unrelated warning suppression.

Browser: 28 real captures, including the 22 requested views and six ending witnesses. 30 additional cross-viewport live-stage checks pass. No observed stale map/card values, document scroll, clipped footer, passive evidence telemetry, or live hidden-truth leak.
